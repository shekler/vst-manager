use std::collections::HashSet;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Recursive walk: `.vst3` bundles (file or folder) and `.dll` plugins under `root`.
pub fn discover_plugin_paths(root: &Path) -> Result<Vec<PathBuf>, String> {
    let mut raw = Vec::new();

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        let is_vst3 = path
            .extension()
            .is_some_and(|e| e.eq_ignore_ascii_case("vst3"));

        if entry.file_type().is_file() {
            if is_vst3
                || path
                    .extension()
                    .is_some_and(|e| e.eq_ignore_ascii_case("dll"))
            {
                raw.push(path.to_path_buf());
            }
        } else if entry.file_type().is_dir() && is_vst3 {
            raw.push(path.to_path_buf());
        }
    }

    let mut paths: Vec<PathBuf> = raw.into_iter().map(|p| bundle_root(&p)).collect();
    paths.sort_by(|a, b| a.cmp(b));

    let mut seen = HashSet::new();
    paths.retain(|p| {
        let key = p
            .canonicalize()
            .unwrap_or_else(|_| p.clone())
            .to_string_lossy()
            .to_string();
        seen.insert(key)
    });

    Ok(paths)
}

/// Outermost `.vst3` bundle (directory or single-file bundle) containing `path`.
pub fn bundle_root(path: &Path) -> PathBuf {
    let mut best: Option<PathBuf> = None;
    for ancestor in path.ancestors() {
        if ancestor
            .extension()
            .is_some_and(|e| e.eq_ignore_ascii_case("vst3"))
            && (ancestor.is_dir() || ancestor.is_file())
        {
            best = Some(ancestor.to_path_buf());
        }
    }
    best.unwrap_or_else(|| path.to_path_buf())
}

/// Directory to hand to `vst_scanner.exe` (scans this path and all nested subfolders).
pub fn shard_root(root: &Path, plugin_path: &Path) -> PathBuf {
    let bundle = bundle_root(plugin_path);
    let Ok(rel) = bundle.strip_prefix(root) else {
        return root.to_path_buf();
    };
    let components: Vec<_> = rel.components().collect();
    if components.len() <= 1 {
        return root.to_path_buf();
    }
    root.join(components[0].as_os_str())
}
