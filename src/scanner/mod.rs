mod cache;
mod discover;
mod report;
mod vst3;

use cache::PluginCache;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::mpsc::Sender;
use std::thread;
use std::time::Instant;

pub use scanner_types::{PluginInfo, ScanNoticeLevel, ScanOutput};

/// Events streamed to the UI while a scan runs.
#[derive(Debug, Clone)]
pub enum ScanEvent {
    Log(String),
    Notice {
        level: ScanNoticeLevel,
        message: String,
    },
    Progress {
        done: usize,
        total: usize,
    },
}

/// Plugins previously scanned under any of `roots`.
pub fn load_cached_plugins(roots: &[PathBuf]) -> Vec<PluginInfo> {
    let cache = PluginCache::load();
    let mut plugins = Vec::new();
    let mut seen = HashSet::new();
    for root in roots {
        for mut plugin in cache.plugins_under_root(root) {
            if seen.insert(plugin.path.clone()) {
                plugin.ensure_derived_fields();
                plugins.push(plugin);
            }
        }
    }
    merge_duplicate_plugins(&mut plugins);
    plugins.sort_by(|a, b| a.path.cmp(&b.path));
    plugins
}

/// Deletes all cached plugin metadata on disk.
pub fn clear_plugin_cache() -> Result<(), String> {
    let mut cache = PluginCache::load();
    cache.clear()
}

#[derive(Debug, Clone)]
pub struct ScanReport {
    pub plugins: Vec<PluginInfo>,
    pub total: usize,
    pub valid: usize,
    pub from_cache: usize,
    pub shards_scanned: usize,
    /// Markdown scan report written under app cache (`scan_reports/`).
    pub report_path: Option<PathBuf>,
}

pub fn scan_directories_with_sender(
    roots: &[PathBuf],
    event_tx: Sender<ScanEvent>,
) -> Result<ScanReport, String> {
    let started = Instant::now();
    let diagnostics = Arc::new(std::sync::Mutex::new(report::ScanDiagnostics {
        warnings: Vec::new(),
        errors: Vec::new(),
    }));
    let events = EventSink::new(event_tx, Arc::clone(&diagnostics));
    let roots: Vec<PathBuf> = roots.iter().filter(|root| root.is_dir()).cloned().collect();
    if roots.is_empty() {
        return Err("No valid scan folders selected.".into());
    }

    for root in &roots {
        events.log(format!("Scanning {}", root.display()));
    }

    events.log("Using in-process Rust VST3 scanner".into());
    log_worker_exe_hint(&events);

    let mut cache = PluginCache::load();
    let mut shards_to_scan = HashSet::new();
    let mut all_discovered = Vec::new();
    let mut shard_plugin_counts = HashMap::new();
    let mut shard_plugins: HashMap<PathBuf, Vec<PathBuf>> = HashMap::new();

    for root in &roots {
        events.log(format!("Discovering plugin paths in {}…", root.display()));
        let discovered = discover::discover_plugin_paths(root)?;
        events.log(format!("Found {} plugin path(s)", discovered.len()));

        for plugin_path in &discovered {
            let shard = discover::shard_root(root, plugin_path);
            *shard_plugin_counts.entry(shard.clone()).or_insert(0) += 1;
            if cache.get(plugin_path).is_none() {
                shards_to_scan.insert(shard.clone());
                shard_plugins
                    .entry(shard)
                    .or_default()
                    .push(plugin_path.clone());
            }
        }
        if discovered.is_empty() {
            shards_to_scan.insert(root.clone());
        }
        all_discovered.extend(discovered);
    }

    all_discovered.sort();
    all_discovered.dedup();

    let total = all_discovered.len();
    let from_cache = all_discovered
        .iter()
        .filter(|path| cache.get(path).is_some())
        .count();

    events.progress(from_cache, total);
    events.log(format!(
        "Cache: {from_cache} hit(s), {} shard(s) need scan — {total} plugin(s) total",
        shards_to_scan.len()
    ));

    let mut shards: Vec<PathBuf> = shards_to_scan.into_iter().collect();
    shards.sort();
    shards.dedup();

    let progress_done = Arc::new(AtomicUsize::new(from_cache));
    let mut scan_stats = ScanStats::default();
    let mut fresh_scanned = HashSet::new();

    let shards_scanned = if shards.is_empty() {
        events.log("All plugins served from cache".into());
        events.progress(total, total);
        0
    } else {
        run_parallel_shards(
            &roots,
            &shards,
            &shard_plugin_counts,
            &shard_plugins,
            &mut cache,
            &events,
            &progress_done,
            total,
            &mut scan_stats,
            &mut fresh_scanned,
        )?
    };

    let mut results = collect_results(&cache, &roots, &all_discovered);

    events.log("Pruning cache and saving…".into());
    cache.prune_missing(&all_discovered);
    cache.save()?;

    for plugin in &mut results {
        plugin.ensure_derived_fields();
    }

    merge_duplicate_plugins(&mut results);
    results.sort_by(|a, b| a.path.cmp(&b.path));
    let valid = results.iter().filter(|p| p.is_valid).count();
    events.progress(total, total);
    let elapsed = started.elapsed().as_secs_f64();
    events.log(format!(
        "Done — {valid} valid / {} total · {} license skip · {} vendor skip · {} timeout · {} fail · {:.1}s",
        results.len(),
        scan_stats.missing_license,
        scan_stats.skipped_vendor,
        scan_stats.timed_out,
        scan_stats.load_failed,
        elapsed
    ));

    let report = ScanReport {
        total: results.len(),
        valid,
        from_cache,
        shards_scanned,
        plugins: results,
        report_path: None,
    };

    let diag = diagnostics
        .lock()
        .map_err(|_| "Scan diagnostics lock poisoned".to_string())?;
    match report::write_scan_report(
        &roots,
        &report,
        &scan_stats,
        &diag,
        elapsed,
        &fresh_scanned,
    ) {
        Ok(path) => {
            events.log(format!("Scan report: {}", path.display()));
            Ok(ScanReport {
                report_path: Some(path),
                ..report
            })
        }
        Err(err) => {
            events.log(format!("Could not write scan report: {err}"));
            Ok(report)
        }
    }
}

#[derive(Default)]
pub(crate) struct ScanStats {
    missing_license: usize,
    skipped_vendor: usize,
    timed_out: usize,
    load_failed: usize,
}

impl ScanStats {
    fn record(&mut self, plugin: &PluginInfo) {
        use scanner_types::ScanOutcome;
        match plugin.scan_outcome() {
            ScanOutcome::Valid => {}
            ScanOutcome::MissingLicense => self.missing_license += 1,
            ScanOutcome::TimedOut => self.timed_out += 1,
            ScanOutcome::SkippedVendor => self.skipped_vendor += 1,
            ScanOutcome::LoadFailed => self.load_failed += 1,
        }
    }
}

static WORKER_HINT: AtomicBool = AtomicBool::new(false);

fn log_worker_exe_hint(events: &EventSink) {
    if WORKER_HINT.swap(true, Ordering::SeqCst) {
        return;
    }
    #[cfg(windows)]
    if vst_scanner::resolve_isolated_worker_exe().is_none() {
        events.log(
            "Note: build vst_scanner.exe beside this app for faster isolated scans (cargo build -p vst_scanner)"
                .into(),
        );
    }
}

#[derive(Clone)]
struct EventSink {
    tx: Sender<ScanEvent>,
    diagnostics: Arc<std::sync::Mutex<report::ScanDiagnostics>>,
}

impl EventSink {
    fn new(tx: Sender<ScanEvent>, diagnostics: Arc<std::sync::Mutex<report::ScanDiagnostics>>) -> Self {
        Self { tx, diagnostics }
    }

    fn log(&self, msg: String) {
        let _ = self.tx.send(ScanEvent::Log(msg));
    }

    fn notice(&self, level: ScanNoticeLevel, message: String) {
        if let Ok(mut diag) = self.diagnostics.lock() {
            diag.push_notice(level, message.clone());
        }
        let _ = self.tx.send(ScanEvent::Notice { level, message });
    }

    fn progress(&self, done: usize, total: usize) {
        let _ = self.tx.send(ScanEvent::Progress { done, total });
    }
}

fn display_shard_label(roots: &[PathBuf], shard: &Path) -> String {
    for root in roots {
        if let Ok(rel) = shard.strip_prefix(root) {
            let rel = rel.display().to_string();
            if rel.is_empty() {
                return root.display().to_string();
            }
            return rel;
        }
    }
    shard.display().to_string()
}

struct ShardJob {
    path: PathBuf,
    label: String,
    plugin_count: usize,
}

fn shard_jobs(
    roots: &[PathBuf],
    shards: &[PathBuf],
    shard_plugin_counts: &HashMap<PathBuf, usize>,
) -> Vec<ShardJob> {
    shards
        .iter()
        .map(|shard| ShardJob {
            label: display_shard_label(roots, shard),
            plugin_count: shard_plugin_counts.get(shard).copied().unwrap_or(0),
            path: shard.clone(),
        })
        .collect()
}

fn run_parallel_shards(
    roots: &[PathBuf],
    shards: &[PathBuf],
    shard_plugin_counts: &HashMap<PathBuf, usize>,
    shard_plugins: &HashMap<PathBuf, Vec<PathBuf>>,
    cache: &mut PluginCache,
    events: &EventSink,
    progress_done: &Arc<AtomicUsize>,
    total: usize,
    scan_stats: &mut ScanStats,
    fresh_scanned: &mut HashSet<String>,
) -> Result<usize, String> {
    let shard_jobs = shard_jobs(roots, shards, shard_plugin_counts);
    let shard_count = shard_jobs.len();
    let workers = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
        .min(shard_count)
        .max(1);

    events.log(format!(
        "Scanning {shard_count} shard(s) with {workers} worker(s)"
    ));

    let shard_jobs = Arc::new(shard_jobs);
    let shard_plugins = Arc::new(shard_plugins.clone());
    let events = Arc::new(events.clone());
    let progress_done = Arc::clone(progress_done);
    let chunk = shard_count.div_ceil(workers);

    let mut handles = Vec::new();
    for worker in 0..workers {
        let start = worker * chunk;
        if start >= shard_count {
            break;
        }
        let end = (start + chunk).min(shard_count);
        let shard_jobs = Arc::clone(&shard_jobs);
        let shard_plugins = Arc::clone(&shard_plugins);
        let events = Arc::clone(&events);
        let progress_done = Arc::clone(&progress_done);
        handles.push(thread::spawn(move || {
            let mut outputs = Vec::new();
            for (i, job) in shard_jobs[start..end].iter().enumerate() {
                let shard_num = start + i + 1;
                events.log(format!(
                    "Shard {shard_num}/{shard_count}: {} — {} plugin(s)",
                    job.label, job.plugin_count
                ));
                let events_progress = Arc::clone(&events);
                let plugins = shard_plugins.get(&job.path).cloned().unwrap_or_default();
                let progress_done = Arc::clone(&progress_done);
                let output = scan_shard(
                    job,
                    &plugins,
                    |line| {
                        events_progress.log(format!("  {line}"));
                    },
                    |level, _path, message| {
                        events_progress.notice(level, message.to_owned());
                    },
                    |n| {
                        let done = progress_done.fetch_add(n, Ordering::Relaxed) + n;
                        events_progress.progress(done.min(total), total);
                    },
                );
                let valid = output.plugins.iter().filter(|p| p.is_valid).count();
                events.log(format!(
                    "  ✓ {} — {valid}/{} valid",
                    job.label,
                    output.plugins.len()
                ));
                outputs.push(output);
            }
            outputs
        }));
    }

    for handle in handles {
        let outputs = handle
            .join()
            .map_err(|_| "Scanner worker thread panicked".to_string())?;
        for output in outputs {
            for mut plugin in output.plugins {
                scan_stats.record(&plugin);
                let path = PathBuf::from(&plugin.path);
                let bundle = discover::bundle_root(&path);
                plugin.path = bundle.to_string_lossy().into_owned();
                plugin.fill_size_from_path(&bundle);
                plugin.ensure_format();
                let bundle_key = bundle.to_string_lossy().into_owned();
                fresh_scanned.insert(bundle_key);
                cache.insert(&bundle, plugin);
            }
        }
    }

    Ok(shard_count)
}

fn scan_shard(
    job: &ShardJob,
    plugins: &[PathBuf],
    mut on_progress: impl FnMut(&str),
    mut on_notice: impl FnMut(ScanNoticeLevel, &str, &str),
    mut on_plugins_done: impl FnMut(usize),
) -> ScanOutput {
    let output = if plugins.is_empty() {
        on_progress(&format!("  → {}", job.path.display()));
        vst3::scan_vst3_directory(&job.path, &mut on_progress, &mut on_notice)
    } else {
        on_progress(&format!(
            "  → {} path(s) (cache miss only)",
            plugins.len()
        ));
        vst3::scan_vst3_paths(plugins, &mut on_progress, &mut on_notice)
    };

    let n = if plugins.is_empty() {
        output.plugins.len()
    } else {
        plugins.len()
    };
    if n > 0 {
        on_plugins_done(n);
    }

    output
}

fn collect_results(
    cache: &PluginCache,
    roots: &[PathBuf],
    discovered: &[PathBuf],
) -> Vec<PluginInfo> {
    let mut results = Vec::new();
    let mut seen = HashSet::new();

    if discovered.is_empty() {
        for root in roots {
            for plugin in cache.plugins_under_root(root) {
                if seen.insert(plugin.path.clone()) {
                    results.push(plugin);
                }
            }
        }
        return results;
    }

    for plugin_path in discovered {
        let Some(plugin) = cache.get(plugin_path) else {
            continue;
        };
        if seen.insert(plugin.path.clone()) {
            results.push(plugin);
        }
    }

    for root in roots {
        for plugin in cache.plugins_under_root(root) {
            if seen.insert(plugin.path.clone()) {
                results.push(plugin);
            }
        }
    }

    results
}

/// Collapse the same plugin found at multiple install paths into one entry.
fn merge_duplicate_plugins(plugins: &mut Vec<PluginInfo>) {
    let mut groups: HashMap<String, PluginInfo> = HashMap::new();
    let drained: Vec<PluginInfo> = std::mem::take(plugins);

    for plugin in drained {
        let key = plugin.identity_key();
        match groups.get_mut(&key) {
            Some(existing) => {
                if existing.paths.is_empty() {
                    existing.paths.push(existing.path.clone());
                }
                existing.paths.push(plugin.path);
            }
            None => {
                groups.insert(key, plugin);
            }
        }
    }

    *plugins = groups
        .into_values()
        .map(|mut plugin| {
            if !plugin.paths.is_empty() {
                plugin.paths.sort();
                plugin.paths.dedup();
                if let Some(first) = plugin.paths.first().cloned() {
                    plugin.path = first;
                }
            }
            plugin
        })
        .collect();
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample(path: &str, cid: &str) -> PluginInfo {
        PluginInfo {
            path: path.into(),
            paths: Vec::new(),
            is_valid: true,
            scan_source: String::new(),
            name: "Test".into(),
            vendor: "Vendor".into(),
            version: "1.0".into(),
            cid: cid.into(),
            sdk_version: "VST 3".into(),
            cardinality: 0,
            flags: 0,
            sub_categories: Vec::new(),
            missing_license: false,
            load_failed: false,
            load_timed_out: false,
            error: String::new(),
            size: String::new(),
            format: "vst3".into(),
            scan_duration_ms: 0,
        }
    }

    #[test]
    fn merge_duplicate_plugins_groups_by_cid() {
        let mut plugins = vec![
            sample(r"C:\A\Foo.vst3", "ABC"),
            sample(r"C:\B\Foo.vst3", "ABC"),
            sample(r"C:\C\Bar.vst3", "DEF"),
        ];
        merge_duplicate_plugins(&mut plugins);
        plugins.sort_by(|a, b| a.path.cmp(&b.path));
        assert_eq!(plugins.len(), 2);
        let foo = plugins.iter().find(|p| p.cid == "ABC").unwrap();
        assert_eq!(foo.all_paths(), vec![r"C:\A\Foo.vst3", r"C:\B\Foo.vst3"]);
        let bar = plugins.iter().find(|p| p.cid == "DEF").unwrap();
        assert_eq!(bar.all_paths(), vec![r"C:\C\Bar.vst3"]);
    }
}
