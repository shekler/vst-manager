use std::collections::HashMap;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::RwLock;
use std::time::UNIX_EPOCH;

const FAST_BINARY_HEAD: usize = 512 * 1024;

/// In-process cache for monolithic `.vst3` head scans only (path + wrapper checks stay uncached).
static MONOLITHIC_HINTS: RwLock<Option<HashMap<String, MonolithicHint>>> = RwLock::new(None);

#[derive(Clone, Copy)]
struct MonolithicHint {
    mtime_secs: u64,
    likely: bool,
}

/// Fast path for `fast_license_skip`: path/vendor heuristics and wrapper DLL names only.
/// Does not scan plugin binaries (avoids false PACE hits and per-plugin IO on every bundle).
pub fn should_fast_skip_unlicensed(module_path: &Path) -> bool {
    path_suggests_protected_vendor(module_path) || bundle_uses_license_wrapper(module_path)
}

/// Shorter factory timeout when load is attempted (wrapper or monolithic file markers).
pub fn factory_load_may_need_protection(module_path: &Path) -> bool {
    if bundle_uses_license_wrapper(module_path) {
        return true;
    }
    if module_path.is_file() && path_has_vst3_extension(module_path) {
        return monolithic_module_has_license_markers_cached(module_path);
    }
    false
}

pub fn path_suggests_headless_unsafe_vendor(module_path: &Path) -> bool {
    let lower = module_path.to_string_lossy().to_ascii_lowercase();
    const MARKERS: &[&str] = &[
        "\\izotope\\",
        "\\stl tones\\",
        "\\excite audio\\",
        "\\phil speiser\\",
        "\\native instruments\\kontakt",
        "amphub.vst3",
        "tonehub.vst3",
        "lifeline console.vst3",
        "the_smoother.vst3",
        "subtle spaces.vst3",
    ];
    MARKERS.iter().any(|m| lower.contains(m))
}

/// Paths that almost always use PACE/iLok-style protection (cheap string match before IO).
fn path_suggests_protected_vendor(module_path: &Path) -> bool {
    let lower = module_path.to_string_lossy().to_ascii_lowercase();
    const MARKERS: &[&str] = &[
        "\\united plugins\\",
        "\\firecharger",
        "\\fireeq",
        "\\firemaximizer",
        "\\firepreamp",
        "\\firepresser",
        "\\firesnareverb",
        "\\orbitron",
        "\\electrumcore",
        "\\cyberdrivecore",
        "\\autoformer",
        "\\difix",
        "\\heater",
        "\\ignition",
        "\\nanobeast",
        "\\randomachine",
        "\\traptunecore",
        "\\urbanpuncher",
        "\\verbum.vst3",
        "\\voxducker",
        "\\widefire",
        "\\uvi tape ",
        "\\ssl native flexverb",
        "\\noiseworks\\",
        "\\finality ",
        "\\cymatics\\cymatics pandora",
        "\\neural dsp\\archetype",
        "\\neural dsp\\parallax",
        "\\slate digital\\vm ",
        "\\focusrite\\fast-",
        "\\sonible\\balancer",
        "\\wa productions\\redclip",
        "\\meldaproduction\\",
    ];
    MARKERS.iter().any(|m| lower.contains(m))
}

fn path_has_vst3_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("vst3"))
}

fn bundle_uses_license_wrapper(module_path: &Path) -> bool {
    if !module_path.is_dir() {
        return false;
    }
    let contents = module_path.join("Contents");
    if !contents.is_dir() {
        return false;
    }
    let Ok(arch_entries) = std::fs::read_dir(&contents) else {
        return false;
    };
    for arch in arch_entries.flatten() {
        if !arch.path().is_dir() {
            continue;
        }
        let Ok(files) = std::fs::read_dir(arch.path()) else {
            continue;
        };
        for file in files.flatten() {
            let p = file.path();
            if p.extension().and_then(|e| e.to_str()) == Some("dll")
                && dll_name_suggests_license_wrapper(&p)
            {
                return true;
            }
        }
    }
    false
}

fn dll_name_suggests_license_wrapper(path: &Path) -> bool {
    let lower = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    ["pace", "ilok", "wraptool", "pacefusion", "paceeden"]
        .iter()
        .any(|m| lower.contains(m))
}

fn monolithic_module_has_license_markers_cached(path: &Path) -> bool {
    let Some((key, mtime)) = hint_key(path) else {
        return monolithic_module_has_license_markers(path);
    };
    if let Ok(guard) = MONOLITHIC_HINTS.read() {
        if let Some(map) = guard.as_ref() {
            if let Some(entry) = map.get(&key) {
                if entry.mtime_secs == mtime {
                    return entry.likely;
                }
            }
        }
    }
    let likely = monolithic_module_has_license_markers(path);
    if let Ok(mut guard) = MONOLITHIC_HINTS.write() {
        let map = guard.get_or_insert_with(HashMap::new);
        map.insert(
            key,
            MonolithicHint {
                mtime_secs: mtime,
                likely,
            },
        );
    }
    likely
}

fn monolithic_module_has_license_markers(path: &Path) -> bool {
    fast_binary_has_license_markers(path)
}

fn fast_binary_has_license_markers(path: &Path) -> bool {
    binary_file_has_markers(path, FAST_BINARY_HEAD, binary_chunk_has_license_marker)
}

fn binary_chunk_has_license_marker(data: &[u8]) -> bool {
    const MARKERS: &[&str] = &[
        "pacefusion",
        "paceeden",
        "wraptool",
        "ilok",
        "noauthorizedlicensesfound",
        "authorization required",
        "licensedaemon",
    ];
    MARKERS.iter().any(|m| buffer_contains_insensitive(data, m))
}

fn binary_file_has_markers(path: &Path, max_bytes: usize, check: fn(&[u8]) -> bool) -> bool {
    let Ok(meta) = std::fs::metadata(path) else {
        return false;
    };
    let file_size = meta.len() as usize;
    if file_size == 0 {
        return false;
    }
    let Ok(mut file) = File::open(path) else {
        return false;
    };
    scan_file_range(&mut file, 0, file_size.min(max_bytes), check)
}

fn scan_file_range(
    file: &mut File,
    offset: usize,
    length: usize,
    check: fn(&[u8]) -> bool,
) -> bool {
    const CHUNK: usize = 256 * 1024;
    const OVERLAP: usize = 64;

    if file.seek(SeekFrom::Start(offset as u64)).is_err() {
        return false;
    }

    let mut carry = Vec::new();
    let mut remaining = length;

    while remaining > 0 {
        let to_read = CHUNK.min(remaining);
        let mut buf = vec![0u8; to_read];
        let Ok(n) = file.read(&mut buf) else {
            break;
        };
        if n == 0 {
            break;
        }
        buf.truncate(n);
        remaining -= n;

        let mut chunk = carry;
        chunk.extend_from_slice(&buf);
        if check(&chunk) {
            return true;
        }
        if chunk.len() > OVERLAP {
            carry = chunk[chunk.len() - OVERLAP..].to_vec();
        } else {
            carry = chunk;
        }
    }
    false
}

fn buffer_contains_insensitive(data: &[u8], needle: &str) -> bool {
    let needle = needle.as_bytes();
    if needle.is_empty() || data.len() < needle.len() {
        return false;
    }
    for i in 0..=data.len() - needle.len() {
        let mut match_all = true;
        for (j, &nb) in needle.iter().enumerate() {
            let mut c = data[i + j];
            let mut t = nb;
            if c.is_ascii_uppercase() {
                c = c.to_ascii_lowercase();
            }
            if t.is_ascii_uppercase() {
                t = t.to_ascii_lowercase();
            }
            if c != t {
                match_all = false;
                break;
            }
        }
        if match_all {
            return true;
        }
    }
    false
}

fn hint_key(path: &Path) -> Option<(String, u64)> {
    let canonical = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    let mtime = file_mtime_secs(path)?;
    Some((canonical.to_string_lossy().into_owned(), mtime))
}

fn file_mtime_secs(path: &Path) -> Option<u64> {
    let modified = std::fs::metadata(path).ok()?.modified().ok()?;
    modified
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs())
}

pub fn classify_plugin_failure(info: &mut scanner_types::PluginInfo) {
    if info.is_valid {
        return;
    }
    if info.error.to_ascii_lowercase().contains("timed out") {
        info.load_timed_out = true;
        info.load_failed = true;
        return;
    }
    if is_likely_license_error(&info.error) {
        info.missing_license = true;
        if info.error.is_empty() {
            info.error = "Missing or invalid license (iLok/PACE)".into();
        }
        return;
    }
    info.load_failed = true;
}

fn is_likely_license_error(msg: &str) -> bool {
    const KEYWORDS: &[&str] = &[
        "ilok",
        "pace",
        "license",
        "licence",
        "activation",
        "not authorized",
        "unauthorized",
        "0x715",
        "cannot be found",
        "reinstall",
        "noauthorizedlicenses",
        "authorization required",
        "licensedaemon",
    ];
    let lower = msg.to_ascii_lowercase();
    KEYWORDS.iter().any(|k| lower.contains(k))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn stl_tones_path_is_unsafe_for_headless_scan() {
        let p = Path::new(r"H:\VSTPlugins\STL Tones\STL Ignite - AmpHub.vst3");
        assert!(path_suggests_headless_unsafe_vendor(p));
    }

    #[test]
    fn united_plugins_path_is_protected_vendor() {
        let p = Path::new(r"H:\VSTPlugins\United Plugins\FireEQ.vst3");
        assert!(should_fast_skip_unlicensed(p));
    }

    #[test]
    fn fast_binary_scan_finds_marker_in_head() {
        let dir = std::env::temp_dir().join(format!("vst_lic_test_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&dir);
        let file = dir.join("probe.bin");
        let mut data = vec![0u8; 4096];
        data.extend_from_slice(b"PACEeden");
        std::fs::write(&file, &data).unwrap();
        assert!(fast_binary_has_license_markers(&file));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
