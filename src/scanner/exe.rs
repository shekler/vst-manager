use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use walkdir::WalkDir;

static SCAN_OUTPUT_COUNTER: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanOutput {
    #[serde(default)]
    pub scan_time: String,
    #[serde(default)]
    pub total_plugins: u32,
    #[serde(default)]
    pub valid_plugins: u32,
    #[serde(default)]
    pub plugins: Vec<PluginInfo>,
}

/// Mirrors `vst_scanner` plugin JSON (`data.json`), plus app-derived `size` / `format`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginInfo {
    /// Primary install path (first of [`Self::paths`] after merge).
    pub path: String,
    /// All discovered install paths for this plugin identity. Empty = only [`Self::path`].
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub paths: Vec<String>,
    #[serde(default)]
    pub is_valid: bool,
    #[serde(default)]
    pub scan_source: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub vendor: String,
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub cid: String,
    #[serde(default)]
    pub sdk_version: String,
    #[serde(default)]
    pub cardinality: i32,
    #[serde(default)]
    pub flags: u32,
    #[serde(default, alias = "categories")]
    pub sub_categories: Vec<String>,
    #[serde(default)]
    pub missing_license: bool,
    #[serde(default, rename = "failed")]
    pub load_failed: bool,
    #[serde(default)]
    pub load_timed_out: bool,
    #[serde(default)]
    pub error: String,
    /// Human-readable on-disk bundle size; set by the app after scan, not vst_scanner.
    #[serde(default)]
    pub size: String,
    /// Container label (e.g. vst3); derived from `sdk_version` when absent in cache.
    #[serde(default)]
    pub format: String,
}

impl PluginInfo {
    pub fn vendor(&self) -> String {
        if self.vendor.is_empty() {
            "Unknown".into()
        } else {
            self.vendor.clone()
        }
    }

    pub fn name(&self) -> String {
        if self.name.is_empty() {
            "Unknown".into()
        } else {
            self.name.clone()
        }
    }

    pub fn format_label(&self) -> String {
        if !self.format.is_empty() {
            return self.format.clone();
        }
        format_from_sdk_version(&self.sdk_version).unwrap_or_default()
    }

    pub fn fill_size_from_path(&mut self, path: &Path) {
        if let Some(bytes) = bundle_disk_size(path) {
            self.size = format_disk_size(bytes);
        }
    }

    pub fn ensure_format(&mut self) {
        if self.format.is_empty() {
            if let Some(format) = format_from_sdk_version(&self.sdk_version) {
                self.format = format;
            }
        }
    }

    pub fn ensure_size(&mut self) {
        if self.size.is_empty() {
            let path = self.path.clone();
            if !path.is_empty() {
                self.fill_size_from_path(Path::new(&path));
            }
        }
    }

    /// Install paths to show in the UI (merged duplicates or the single `path`).
    pub fn all_paths(&self) -> Vec<&str> {
        if !self.paths.is_empty() {
            self.paths.iter().map(String::as_str).collect()
        } else if self.path.is_empty() {
            Vec::new()
        } else {
            vec![self.path.as_str()]
        }
    }

    /// Key used to collapse the same plugin found at multiple filesystem locations.
    pub fn identity_key(&self) -> String {
        if !self.cid.is_empty() {
            return format!("cid:{}", self.cid.to_ascii_uppercase());
        }
        if self.is_valid {
            return format!(
                "name:{}|{}|{}|{}",
                self.vendor.to_ascii_lowercase(),
                self.name.to_ascii_lowercase(),
                self.version.to_ascii_lowercase(),
                self.format_label().to_ascii_lowercase()
            );
        }
        format!("path:{}", self.path)
    }

    /// Drops redundant top-level `Fx` and duplicate tags (case-insensitive).
    pub fn clean_sub_categories(&mut self) {
        let mut seen = HashSet::new();
        self.sub_categories.retain(|cat| {
            if cat.eq_ignore_ascii_case("fx") {
                return false;
            }
            seen.insert(cat.to_ascii_lowercase())
        });
    }

    /// Backfills app-only fields for cache rows missing `size` / `format`.
    pub fn ensure_derived_fields(&mut self) {
        self.ensure_size();
        self.ensure_format();
        self.clean_sub_categories();
    }
}

fn format_from_sdk_version(sdk_version: &str) -> Option<String> {
    let sdk = sdk_version.trim();
    if sdk.is_empty() {
        return None;
    }
    let lower = sdk.to_ascii_lowercase();
    if lower.starts_with("vst 3") || lower.contains("vst3") {
        Some("vst3".into())
    } else if lower.starts_with("vst 2") || lower.contains("vst2") {
        Some("vst2".into())
    } else {
        None
    }
}

fn bundle_disk_size(path: &Path) -> Option<u64> {
    let meta = fs::metadata(path).ok()?;
    if meta.is_file() {
        return Some(meta.len());
    }
    if !meta.is_dir() {
        return None;
    }

    let mut total = 0u64;
    for entry in WalkDir::new(path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            total += entry.metadata().ok().map(|m| m.len()).unwrap_or(0);
        }
    }
    Some(total)
}

fn format_disk_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes < KB {
        format!("{bytes} B")
    } else if bytes < MB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else if bytes < GB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    }
}

pub fn scanner_exe() -> Option<PathBuf> {
    if let Ok(exe) = std::env::current_exe() {
        let beside = exe.parent()?.join("vst_scanner.exe");
        if beside.is_file() {
            return Some(beside);
        }
    }

    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let tools = manifest.join("tools").join("vst_scanner.exe");
    tools.is_file().then_some(tools)
}

pub fn run_scanner(
    scanner: &Path,
    dir: &Path,
    mut on_progress: impl FnMut(&str),
) -> Result<ScanOutput, String> {
    let json_path = scanner_json_path();
    let mut child = Command::new(scanner)
        .arg(dir)
        .arg("-o")
        .arg(&json_path)
        .arg("--try-license-load")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run {}: {e}", scanner.display()))?;

    let stderr_handle = child.stderr.take().map(|stderr| {
        thread::spawn(
            move || {
                for _ in BufReader::new(stderr).lines().map_while(Result::ok) {}
            },
        )
    });

    if let Some(stdout) = child.stdout.take() {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let line = line.trim();
            if !line.is_empty() {
                on_progress(line);
            }
        }
    }

    if let Some(handle) = stderr_handle {
        let _ = handle.join();
    }

    let status = child
        .wait()
        .map_err(|e| format!("Failed to wait for {}: {e}", scanner.display()))?;

    let cleanup = || {
        let _ = fs::remove_file(&json_path);
    };

    let mut read_output = |partial: bool| -> Result<ScanOutput, String> {
        let json = fs::read_to_string(&json_path).map_err(|e| {
            format!("Scanner wrote no JSON at {}: {e}", json_path.display())
        })?;
        let output: ScanOutput = serde_json::from_str(&json)
            .map_err(|e| format!("Invalid scanner JSON: {e}\n{json}"))?;
        if partial {
            on_progress(&format!(
                "Scanner exited with {status}; kept {} plugin(s) from output",
                output.plugins.len()
            ));
        }
        Ok(output)
    };

    if !status.success() {
        match read_output(true) {
            Ok(output) => {
                cleanup();
                return Ok(output);
            }
            Err(_) => {
                cleanup();
                return Err(format!("Scanner failed on {} ({status}).", dir.display()));
            }
        }
    }

    let output = read_output(false).map_err(|e| {
        cleanup();
        e
    })?;
    cleanup();
    Ok(output)
}

/// Placeholder for a plugin path that crashed the native scanner process.
pub fn crash_stub(path: &Path, error: &str) -> PluginInfo {
    let path_str = path.to_string_lossy().into_owned();
    let format = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .filter(|e| e == "vst3" || e == "dll")
        .map(|e| if e == "dll" { "vst2".into() } else { e });
    let mut plugin = PluginInfo {
        path: path_str,
        paths: Vec::new(),
        is_valid: false,
        scan_source: String::new(),
        name: String::new(),
        vendor: String::new(),
        version: String::new(),
        cid: String::new(),
        sdk_version: String::new(),
        cardinality: 0,
        flags: 0,
        sub_categories: Vec::new(),
        missing_license: false,
        load_failed: true,
        load_timed_out: false,
        error: error.to_owned(),
        size: String::new(),
        format: format.unwrap_or_default(),
    };
    plugin.fill_size_from_path(path);
    plugin
}

fn scanner_json_path() -> PathBuf {
    let n = SCAN_OUTPUT_COUNTER.fetch_add(1, Ordering::Relaxed);
    std::env::temp_dir().join(format!(
        "vst-manager-scan-{}-{}.json",
        std::process::id(),
        n
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserializes_scanner_plugin_json() {
        let json = include_str!("../../data.json");
        let output: ScanOutput = serde_json::from_str(json).expect("parse data.json");
        assert_eq!(output.plugins.len(), 4);
        let p = &output.plugins[0];
        assert!(p.is_valid);
        assert_eq!(p.scan_source, "factory");
        assert_eq!(p.name, "Amplifiers");
        assert_eq!(p.sdk_version, "VST 3.7.5");
        assert_eq!(p.sub_categories, ["Fx", "Distortion"]);
        assert_eq!(p.format_label(), "vst3");
    }

    #[test]
    fn clean_sub_categories_strips_fx_and_dedupes() {
        let mut p = PluginInfo {
            path: String::new(),
            paths: Vec::new(),
            is_valid: false,
            scan_source: String::new(),
            name: String::new(),
            vendor: String::new(),
            version: String::new(),
            cid: String::new(),
            sdk_version: String::new(),
            cardinality: 0,
            flags: 0,
            sub_categories: vec![
                "Fx".into(),
                "Distortion".into(),
                "fx".into(),
                "Distortion".into(),
                "Dynamics".into(),
            ],
            missing_license: false,
            load_failed: false,
            load_timed_out: false,
            error: String::new(),
            size: String::new(),
            format: String::new(),
        };
        p.clean_sub_categories();
        assert_eq!(p.sub_categories, ["Distortion", "Dynamics"]);
    }
}
