use directories::ProjectDirs;
use scanner_types::PluginInfo;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

/// Bump when on-disk cache shape changes. `missing_license` / `scan_source: skipped`
/// entries are cached until the plugin bundle mtime changes (no reload retry each scan).
const CACHE_VERSION: u32 = 1;

const APP_QUALIFIER: &str = "com";
const APP_ORGANIZATION: &str = "vst-manager";
const APP_NAME: &str = "vst-manager";

#[derive(Serialize, Deserialize)]
struct CacheFile {
    version: u32,
    entries: HashMap<String, CacheEntry>,
}

#[derive(Clone, Serialize, Deserialize)]
struct CacheEntry {
    mtime_secs: u64,
    plugin: PluginInfo,
}

pub struct PluginCache {
    path: PathBuf,
    entries: HashMap<String, CacheEntry>,
}

impl PluginCache {
    pub fn load() -> Self {
        let path = Self::cache_path().unwrap_or_else(|| PathBuf::from("plugin_cache.json"));
        let entries = std::fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str::<CacheFile>(&s).ok())
            .filter(|f| f.version == CACHE_VERSION)
            .map(|f| f.entries)
            .unwrap_or_default();

        Self { path, entries }
    }

    pub fn save(&self) -> Result<(), String> {
        let Some(parent) = self.path.parent() else {
            return Ok(());
        };
        std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create cache dir: {e}"))?;

        let file = CacheFile {
            version: CACHE_VERSION,
            entries: self.entries.clone(),
        };
        let json = serde_json::to_string_pretty(&file)
            .map_err(|e| format!("Failed to serialize cache: {e}"))?;
        std::fs::write(&self.path, json).map_err(|e| format!("Failed to write cache: {e}"))
    }

    pub fn get(&self, plugin_path: &Path) -> Option<PluginInfo> {
        let key = cache_key(plugin_path)?;
        let entry = self.entries.get(&key)?;
        let mtime = file_mtime_secs(plugin_path)?;
        if entry.mtime_secs == mtime {
            Some(entry.plugin.clone())
        } else {
            None
        }
    }

    pub fn insert(&mut self, plugin_path: &Path, plugin: PluginInfo) {
        let key = cache_key(plugin_path).unwrap_or_else(|| plugin.path.clone());
        let mtime_secs = file_mtime_secs(plugin_path).unwrap_or(0);
        self.entries.insert(key, CacheEntry { mtime_secs, plugin });
    }

    pub fn plugins_under_root(&self, root: &Path) -> Vec<PluginInfo> {
        let root = root.canonicalize().unwrap_or_else(|_| root.to_path_buf());
        let mut plugins: Vec<PluginInfo> = self
            .entries
            .values()
            .filter_map(|entry| {
                let path = PathBuf::from(&entry.plugin.path);
                let canon = path.canonicalize().unwrap_or(path);
                canon.starts_with(&root).then(|| entry.plugin.clone())
            })
            .collect();
        plugins.sort_by(|a, b| a.path.cmp(&b.path));
        plugins
    }

    pub fn prune_missing(&mut self, still_present: &[PathBuf]) {
        let present: HashSet<String> = still_present.iter().filter_map(|p| cache_key(p)).collect();
        self.entries.retain(|k, _| present.contains(k));
    }

    pub fn clear(&mut self) -> Result<(), String> {
        self.entries.clear();
        if self.path.exists() {
            std::fs::remove_file(&self.path)
                .map_err(|e| format!("Failed to remove cache file: {e}"))?;
        }
        Ok(())
    }

    fn cache_path() -> Option<PathBuf> {
        ProjectDirs::from(APP_QUALIFIER, APP_ORGANIZATION, APP_NAME)
            .map(|dirs| dirs.cache_dir().join("plugin_cache.json"))
    }
}

fn cache_key(path: &Path) -> Option<String> {
    let canonical = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    Some(canonical.to_string_lossy().to_string())
}

fn file_mtime_secs(path: &Path) -> Option<u64> {
    let modified = std::fs::metadata(path).ok()?.modified().ok()?;
    modified
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs())
}
