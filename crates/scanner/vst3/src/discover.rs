use std::collections::HashSet;
use std::path::{Path, PathBuf};

pub fn find_vst3_modules(directory: &Path) -> Vec<PathBuf> {
    let mut seen = HashSet::new();
    let mut modules = Vec::new();
    if !directory.is_dir() {
        return modules;
    }
    collect_recursive(directory, &mut seen, &mut modules);
    modules.sort();
    modules.dedup();
    modules
}

fn collect_recursive(dir: &Path, seen: &mut HashSet<String>, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if is_candidate_module(&path) {
            let key = path.to_string_lossy().into_owned();
            if seen.insert(key) {
                out.push(path);
            }
            continue;
        }
        if path.is_dir() {
            collect_recursive(&path, seen, out);
        }
    }
}

fn is_candidate_module(path: &Path) -> bool {
    if is_vst3_bundle_directory(path) {
        return true;
    }
    #[cfg(windows)]
    {
        if path.is_file() && path_has_vst3_extension(path) {
            return true;
        }
    }
    false
}

fn is_vst3_bundle_directory(path: &Path) -> bool {
    if !path.is_dir() || !path_has_vst3_extension(path) {
        return false;
    }
    path.join("Contents").is_dir()
}

fn path_has_vst3_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("vst3"))
}
