use super::{ScanReport, ScanStats};
use directories::ProjectDirs;
use scanner_types::{format_scan_duration_ms, PluginInfo, ScanOutcome};
use std::collections::HashSet;
use std::fmt::Write as _;
use std::path::PathBuf;
use std::time::SystemTime;

const APP_QUALIFIER: &str = "com";
const APP_ORGANIZATION: &str = "vst-manager";
const APP_NAME: &str = "vst-manager";

pub struct ScanDiagnostics {
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

impl ScanDiagnostics {
    pub fn push_notice(&mut self, level: scanner_types::ScanNoticeLevel, message: String) {
        match level {
            scanner_types::ScanNoticeLevel::Warning => self.warnings.push(message),
            scanner_types::ScanNoticeLevel::Error => self.errors.push(message),
        }
    }
}

pub fn write_scan_report(
    roots: &[PathBuf],
    report: &ScanReport,
    stats: &ScanStats,
    diagnostics: &ScanDiagnostics,
    elapsed_secs: f64,
    fresh_scanned: &HashSet<String>,
) -> Result<PathBuf, String> {
    let dir = report_dir()?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("create report dir: {e}"))?;

    let stamp = report_filename_stamp();
    let path = dir.join(format!("scan_{stamp}.md"));
    let latest = dir.join("latest_scan_report.md");

    let body = render_markdown(
        roots,
        report,
        stats,
        diagnostics,
        elapsed_secs,
        &stamp,
        fresh_scanned,
    );
    std::fs::write(&path, &body).map_err(|e| format!("write {}: {e}", path.display()))?;
    std::fs::write(&latest, &body).map_err(|e| format!("write {}: {e}", latest.display()))?;

    Ok(path)
}

fn report_dir() -> Result<PathBuf, String> {
    ProjectDirs::from(APP_QUALIFIER, APP_ORGANIZATION, APP_NAME)
        .map(|dirs| dirs.cache_dir().join("scan_reports"))
        .ok_or_else(|| "Could not resolve scan report directory".into())
}

fn report_filename_stamp() -> String {
    let now = SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // Stable, filesystem-safe stamp (UTC-ish wall from epoch; good enough for filenames).
    format!("{now}")
}

fn render_markdown(
    roots: &[PathBuf],
    report: &ScanReport,
    stats: &ScanStats,
    diagnostics: &ScanDiagnostics,
    elapsed_secs: f64,
    stamp: &str,
    fresh_scanned: &HashSet<String>,
) -> String {
    let mut out = String::new();

    let _ = writeln!(out, "# VST Manager scan report");
    let _ = writeln!(out);
    let _ = writeln!(out, "- **Report id:** `{stamp}`");
    let _ = writeln!(out, "- **Duration:** {elapsed_secs:.1}s");
    let _ = writeln!(out, "- **Roots scanned:**");
    for root in roots {
        let _ = writeln!(out, "  - `{}`", md_escape(&root.display().to_string()));
    }
    let _ = writeln!(out);

    let mut valid = 0usize;
    let mut missing_license = 0usize;
    let mut timed_out = 0usize;
    let mut skipped_vendor = 0usize;
    let mut load_failed = 0usize;
    for p in &report.plugins {
        match p.scan_outcome() {
            ScanOutcome::Valid => valid += 1,
            ScanOutcome::MissingLicense => missing_license += 1,
            ScanOutcome::TimedOut => timed_out += 1,
            ScanOutcome::SkippedVendor => skipped_vendor += 1,
            ScanOutcome::LoadFailed => load_failed += 1,
        }
    }

    let _ = writeln!(out, "## Summary");
    let _ = writeln!(out);
    let _ = writeln!(out, "| Metric | Count |");
    let _ = writeln!(out, "|--------|------:|");
    let _ = writeln!(out, "| Total plugins | {} |", report.total);
    let _ = writeln!(out, "| Valid | {valid} |");
    let _ = writeln!(out, "| From cache (this run) | {} |", report.from_cache);
    let _ = writeln!(out, "| Shards scanned | {} |", report.shards_scanned);
    let _ = writeln!(out, "| Missing license | {missing_license} |");
    let _ = writeln!(out, "| Vendor skip | {skipped_vendor} |");
    let _ = writeln!(out, "| Timed out | {timed_out} |");
    let _ = writeln!(out, "| Load failed | {load_failed} |");
    let _ = writeln!(out, "| Warnings (events) | {} |", diagnostics.warnings.len());
    let _ = writeln!(out, "| Errors (events) | {} |", diagnostics.errors.len());
    let detail_scan_ms: u64 = report
        .plugins
        .iter()
        .filter(|p| plugin_scanned_this_run(p, fresh_scanned))
        .map(|p| p.scan_duration_ms)
        .sum();
    if detail_scan_ms > 0 {
        let _ = writeln!(
            out,
            "| Sum of per-plugin scan time (this run) | {:.1}s |",
            detail_scan_ms as f64 / 1000.0
        );
    }
    let _ = writeln!(out);

    let _ = writeln!(
        out,
        "_Newly detail-scanned this run: license skip {}, vendor skip {}, timeout {}, fail {}._",
        stats.missing_license, stats.skipped_vendor, stats.timed_out, stats.load_failed
    );
    let _ = writeln!(
        out,
        "_Per-plugin **Time**: measured on last scan of that module; `(cache)` = served from cache this run._"
    );
    let _ = writeln!(out);

    write_slowest_section(&mut out, &report.plugins, fresh_scanned);
    write_plugin_table(&mut out, &report.plugins, fresh_scanned);
    write_bullet_section(&mut out, "Warnings", &diagnostics.warnings);
    write_bullet_section(&mut out, "Errors", &diagnostics.errors);

    out
}

fn write_slowest_section(out: &mut String, plugins: &[PluginInfo], fresh_scanned: &HashSet<String>) {
    let mut ranked: Vec<&PluginInfo> = plugins
        .iter()
        .filter(|p| p.scan_duration_ms > 0 && plugin_scanned_this_run(p, fresh_scanned))
        .collect();
    ranked.sort_by(|a, b| b.scan_duration_ms.cmp(&a.scan_duration_ms));
    ranked.truncate(25);

    let _ = writeln!(out, "## Slowest plugins (this run)");
    let _ = writeln!(out);
    if ranked.is_empty() {
        let _ = writeln!(out, "_No timed detail-scans this run._");
        let _ = writeln!(out);
        return;
    }

    let _ = writeln!(out, "| Time | Outcome | Path | Name |");
    let _ = writeln!(out, "|------|---------|------|------|");
    for p in ranked {
        let _ = writeln!(
            out,
            "| {} | {} | `{}` | {} |",
            format_scan_duration_ms(p.scan_duration_ms),
            outcome_label(p),
            md_escape(&p.path),
            md_escape(&display_or_dash(&p.name)),
        );
    }
    let _ = writeln!(out);
}

fn write_plugin_table(
    out: &mut String,
    plugins: &[PluginInfo],
    fresh_scanned: &HashSet<String>,
) {
    let _ = writeln!(out, "## Plugins");
    let _ = writeln!(out);
    if plugins.is_empty() {
        let _ = writeln!(out, "_No plugins._");
        let _ = writeln!(out);
        return;
    }

    let _ = writeln!(
        out,
        "| Outcome | Time | Path | Name | Vendor | Detail |"
    );
    let _ = writeln!(
        out,
        "|---------|------|------|------|--------|--------|"
    );

    for p in plugins {
        let outcome = outcome_label(p);
        let time = plugin_time_cell(p, fresh_scanned);
        let detail = plugin_detail(p);
        let _ = writeln!(
            out,
            "| {outcome} | {time} | `{}` | {} | {} | {} |",
            md_escape(&p.path),
            md_escape(&display_or_dash(&p.name)),
            md_escape(&display_or_dash(&p.vendor)),
            md_escape(&detail),
        );
    }
    let _ = writeln!(out);
}

fn write_bullet_section(out: &mut String, title: &str, lines: &[String]) {
    let _ = writeln!(out, "## {title}");
    let _ = writeln!(out);
    if lines.is_empty() {
        let _ = writeln!(out, "_None._");
    } else {
        for line in lines {
            let _ = writeln!(out, "- {}", md_escape(line));
        }
    }
    let _ = writeln!(out);
}

fn plugin_scanned_this_run(p: &PluginInfo, fresh_scanned: &HashSet<String>) -> bool {
    if fresh_scanned.contains(&p.path) {
        return true;
    }
    p.paths.iter().any(|path| fresh_scanned.contains(path))
}

fn plugin_time_cell(p: &PluginInfo, fresh_scanned: &HashSet<String>) -> String {
    let ms = p.scan_duration_ms;
    if ms == 0 {
        return "—".into();
    }
    let label = format_scan_duration_ms(ms);
    if plugin_scanned_this_run(p, fresh_scanned) {
        label
    } else {
        format!("{label} (cache)")
    }
}

fn outcome_label(p: &PluginInfo) -> &'static str {
    match p.scan_outcome() {
        ScanOutcome::Valid => "valid",
        ScanOutcome::MissingLicense => "missing_license",
        ScanOutcome::TimedOut => "timed_out",
        ScanOutcome::SkippedVendor => "skipped_vendor",
        ScanOutcome::LoadFailed => "load_failed",
    }
}

fn plugin_detail(p: &PluginInfo) -> String {
    if p.is_valid {
        return format!(
            "cid={}; format={}",
            if p.cid.is_empty() { "—" } else { &p.cid },
            p.format_label()
        );
    }
    if !p.error.is_empty() {
        return p.error.clone();
    }
    p.failure_line().unwrap_or_else(|| "—".into())
}

fn display_or_dash(s: &str) -> String {
    if s.is_empty() {
        "—".into()
    } else {
        s.to_owned()
    }
}

fn md_escape(s: &str) -> String {
    s.replace('|', "\\|").replace('\n', " ")
}
