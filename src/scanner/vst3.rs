use scanner_types::PluginInfo;
use std::path::{Path, PathBuf};
use vst_scanner::ScanOptions;

pub use scanner_types::{ScanNoticeLevel, ScanOutput};

/// Default scan options for the GUI (matches C++ scanner defaults).
pub fn app_scan_options() -> ScanOptions {
    ScanOptions {
        try_license_load: false,
        ..ScanOptions::default()
    }
}

/// Scan explicit plugin paths (cache misses only).
pub fn scan_vst3_paths(
    paths: &[PathBuf],
    mut on_progress: impl FnMut(&str),
    mut on_notice: impl FnMut(ScanNoticeLevel, &str, &str),
) -> ScanOutput {
    let options = app_scan_options();
    let output =
        vst_scanner::scan_paths(paths, &options, 4, move |line| on_progress(line));
    for plugin in &output.plugins {
        emit_plugin_notice(plugin, &mut on_notice);
    }
    output
}

/// Scan a directory tree for VST3 modules (empty shard edge case).
pub fn scan_vst3_directory(
    dir: &Path,
    mut on_progress: impl FnMut(&str),
    mut on_notice: impl FnMut(ScanNoticeLevel, &str, &str),
) -> ScanOutput {
    let options = app_scan_options();
    let output = vst_scanner::scan_directory(dir, &options, |line| on_progress(line));
    for plugin in &output.plugins {
        emit_plugin_notice(plugin, &mut on_notice);
    }
    output
}

pub fn emit_plugin_notice(
    plugin: &PluginInfo,
    on_notice: &mut impl FnMut(ScanNoticeLevel, &str, &str),
) {
    use scanner_types::ScanOutcome;
    let Some(line) = plugin.failure_line() else {
        return;
    };
    let level = match plugin.scan_outcome() {
        ScanOutcome::Valid => return,
        ScanOutcome::MissingLicense | ScanOutcome::TimedOut | ScanOutcome::SkippedVendor => {
            ScanNoticeLevel::Warning
        }
        ScanOutcome::LoadFailed => ScanNoticeLevel::Error,
    };
    on_notice(level, &plugin.path, &line);
}
