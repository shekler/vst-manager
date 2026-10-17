use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

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

impl ScanOutput {
    pub fn from_plugins(plugins: Vec<PluginInfo>) -> Self {
        let valid_plugins = plugins.iter().filter(|p| p.is_valid).count() as u32;
        Self {
            scan_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos().to_string())
                .unwrap_or_default(),
            total_plugins: plugins.len() as u32,
            valid_plugins,
            plugins,
        }
    }
}

/// Mirrors `vst_scanner` plugin JSON (`data.json`), plus app-derived `size` / `format`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginInfo {
    pub path: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub paths: Vec<String>,
    /// Older version of the same plugin (same CID) at another install path.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub older_installs: Vec<OlderInstall>,
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
    #[serde(default)]
    pub size: String,
    #[serde(default)]
    pub format: String,
    /// Wall time for the most recent scan of this module (milliseconds).
    #[serde(default)]
    pub scan_duration_ms: u64,
}

/// A previous install of the same plugin (same CID, older version).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct OlderInstall {
    pub path: String,
    #[serde(default)]
    pub version: String,
}

/// Human-readable duration for reports and logs.
pub fn format_scan_duration_ms(ms: u64) -> String {
    if ms == 0 {
        return "—".into();
    }
    if ms >= 10_000 {
        format!("{:.1}s", ms as f64 / 1000.0)
    } else if ms >= 1000 {
        format!("{:.2}s", ms as f64 / 1000.0)
    } else {
        format!("{ms}ms")
    }
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

    pub fn all_paths(&self) -> Vec<&str> {
        if !self.paths.is_empty() {
            self.paths.iter().map(String::as_str).collect()
        } else if self.path.is_empty() {
            Vec::new()
        } else {
            vec![self.path.as_str()]
        }
    }

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

    pub fn clean_sub_categories(&mut self) {
        let mut seen = HashSet::new();
        self.sub_categories.retain(|cat| {
            if cat.eq_ignore_ascii_case("fx") {
                return false;
            }
            seen.insert(cat.to_ascii_lowercase())
        });
    }

    pub fn ensure_derived_fields(&mut self) {
        self.ensure_size();
        self.ensure_format();
        self.clean_sub_categories();
    }

    /// High-level scan result for UI and logging.
    pub fn scan_outcome(&self) -> ScanOutcome {
        if self.is_valid {
            return ScanOutcome::Valid;
        }
        if self.missing_license {
            return ScanOutcome::MissingLicense;
        }
        if self.load_timed_out {
            return ScanOutcome::TimedOut;
        }
        if self.load_failed && self.scan_source == "skipped" {
            return ScanOutcome::SkippedVendor;
        }
        ScanOutcome::LoadFailed
    }

    /// One-line failure description; empty when valid.
    pub fn failure_line(&self) -> Option<String> {
        if self.is_valid {
            return None;
        }
        let detail = if !self.error.is_empty() {
            self.error.clone()
        } else if self.load_timed_out {
            "Timed out loading plugin (hung initializer or modal UI)".into()
        } else if self.missing_license {
            "Missing or invalid license (iLok/PACE)".into()
        } else {
            "Load failed".into()
        };
        Some(format!("{} — {}", self.path, detail))
    }
}

/// Numeric plugin version compare. `"1.0.7.1" > "1.0.6.0"`, `"v1.1" == "1.1.0"`.
/// Empty / unparsable versions sort lowest.
pub fn compare_plugin_versions(a: &str, b: &str) -> Ordering {
    cmp_version_parts(&parse_version_parts(a), &parse_version_parts(b))
}

fn parse_version_parts(raw: &str) -> Vec<u64> {
    raw.trim()
        .trim_start_matches(['v', 'V'])
        .split(|c: char| !c.is_ascii_digit())
        .filter(|part| !part.is_empty())
        .filter_map(|part| part.parse().ok())
        .collect()
}

fn cmp_version_parts(a: &[u64], b: &[u64]) -> Ordering {
    match (a.is_empty(), b.is_empty()) {
        (true, true) => return Ordering::Equal,
        (true, false) => return Ordering::Less,
        (false, true) => return Ordering::Greater,
        _ => {}
    }
    let n = a.len().max(b.len());
    for i in 0..n {
        let left = a.get(i).copied().unwrap_or(0);
        let right = b.get(i).copied().unwrap_or(0);
        match left.cmp(&right) {
            Ordering::Equal => {}
            other => return other,
        }
    }
    Ordering::Equal
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScanNoticeLevel {
    Warning,
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScanOutcome {
    Valid,
    MissingLicense,
    TimedOut,
    SkippedVendor,
    LoadFailed,
}

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
        older_installs: Vec::new(),
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
        scan_duration_ms: 0,
    };
    plugin.fill_size_from_path(path);
    plugin
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserializes_scanner_plugin_json() {
        let json = include_str!("../../../../data.json");
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

    fn sample_plugin() -> PluginInfo {
        PluginInfo {
            path: r"C:\X\P.vst3".into(),
            paths: Vec::new(),
            older_installs: Vec::new(),
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
            load_failed: false,
            load_timed_out: false,
            error: String::new(),
            size: String::new(),
            format: String::new(),
            scan_duration_ms: 0,
        }
    }

    #[test]
    fn scan_outcome_missing_license() {
        let mut p = sample_plugin();
        p.missing_license = true;
        assert_eq!(p.scan_outcome(), ScanOutcome::MissingLicense);
        assert!(p.failure_line().is_some());
    }

    #[test]
    fn scan_outcome_timed_out_is_warning_class() {
        let mut p = sample_plugin();
        p.load_timed_out = true;
        p.load_failed = true;
        assert_eq!(p.scan_outcome(), ScanOutcome::TimedOut);
    }

    #[test]
    fn scan_outcome_skipped_vendor() {
        let mut p = sample_plugin();
        p.load_failed = true;
        p.scan_source = "skipped".into();
        assert_eq!(p.scan_outcome(), ScanOutcome::SkippedVendor);
    }

    #[test]
    fn clean_sub_categories_strips_fx_and_dedupes() {
        let mut p = PluginInfo {
            path: String::new(),
            paths: Vec::new(),
            older_installs: Vec::new(),
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
            scan_duration_ms: 0,
        };
        p.clean_sub_categories();
        assert_eq!(p.sub_categories, ["Distortion", "Dynamics"]);
    }

    #[test]
    fn compare_plugin_versions_numeric() {
        use std::cmp::Ordering;
        assert_eq!(
            compare_plugin_versions("1.0.7.1", "1.0.6.0"),
            Ordering::Greater
        );
        assert_eq!(compare_plugin_versions("v1.1.0", "1.1"), Ordering::Equal);
        assert_eq!(compare_plugin_versions("1.0.2", "v1.1.0"), Ordering::Less);
        assert_eq!(compare_plugin_versions("", "1.0"), Ordering::Less);
    }
}
