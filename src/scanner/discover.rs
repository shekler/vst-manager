use std::collections::HashSet;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Recursive walk: `.vst3` bundles (file or folder) under `root`.
/// VST2 `.dll` paths are omitted until a VST2 scanner exists (avoids VST3 loader errors).
pub fn discover_plugin_paths(root: &Path) -> Result<Vec<PathBuf>, String> {
    let mut raw = Vec::new();

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if discover_skip_reason(path).is_some() {
            continue;
        }

        let is_vst3 = path
            .extension()
            .is_some_and(|e| e.eq_ignore_ascii_case("vst3"));

        if entry.file_type().is_file() && is_vst3 {
            raw.push(path.to_path_buf());
        } else if entry.file_type().is_dir() && is_vst3 {
            raw.push(path.to_path_buf());
        }
    }

    let mut paths: Vec<PathBuf> = raw
        .into_iter()
        .map(|p| bundle_root(&p))
        .filter(|p| discover_skip_reason(p).is_none())
        .collect();
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

/// Returns a reason when a path should not be discovered or scanned as VST3.
pub fn discover_skip_reason(path: &Path) -> Option<&'static str> {
    let lower = path.to_string_lossy().to_ascii_lowercase();
    const SKIP_DIR_MARKERS: &[&str] = &[
        "\\installerresources\\",
        "/installerresources/",
        "\\__macosx\\",
        "/__macosx/",
        "\\.backup\\",
        "/.backup/",
    ];
    if SKIP_DIR_MARKERS.iter().any(|m| lower.contains(m)) {
        return Some("installer or metadata path");
    }
    if lower.ends_with(".vst3.backup") {
        return Some("backup bundle");
    }
    if is_wow64_program_files_vst3(path) {
        return Some("32-bit Program Files (x86) on 64-bit host");
    }
    None
}

/// On 64-bit Windows, skip VST3 under `Program Files (x86)` (LoadLibrary error 193).
#[cfg(all(windows, target_pointer_width = "64"))]
fn is_wow64_program_files_vst3(path: &Path) -> bool {
    if !path_has_vst3_extension(path) {
        return false;
    }
    path.to_string_lossy()
        .to_ascii_lowercase()
        .contains("program files (x86)")
}

#[cfg(not(all(windows, target_pointer_width = "64")))]
fn is_wow64_program_files_vst3(_path: &Path) -> bool {
    false
}

fn path_has_vst3_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("vst3"))
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

/// Scan shard root: this path and nested subfolders (parallel scan jobs).
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn skips_installer_resources_and_dll_extension() {
        let junk = Path::new(
            r"H:\VSTPlugins\Drumforge\Kickforge\installerResources\com.kickforge.plugin.x64.VST3",
        );
        assert_eq!(
            discover_skip_reason(junk),
            Some("installer or metadata path")
        );

        let dll = Path::new(r"C:\VSTPlugins\WaveShell1-VST 14.17_x64.dll");
        assert!(!path_has_vst3_extension(dll));
    }

    #[test]
    fn skips_x86_program_files_on_64bit_windows() {
        let path = Path::new(r"C:\Program Files (x86)\Common Files\VST3\WaveShell1-VST3 10.0.vst3");
        #[cfg(all(windows, target_pointer_width = "64"))]
        assert_eq!(
            discover_skip_reason(path),
            Some("32-bit Program Files (x86) on 64-bit host")
        );
        #[cfg(not(all(windows, target_pointer_width = "64")))]
        assert!(discover_skip_reason(path).is_none());
    }
}
