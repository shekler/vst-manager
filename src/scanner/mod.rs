mod cache;
mod discover;
mod exe;

use cache::PluginCache;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc::Sender;
use std::thread;

pub use exe::PluginInfo;

/// Events streamed to the UI while a scan runs.
#[derive(Debug, Clone)]
pub enum ScanEvent {
    Log(String),
    Error(String),
    /// `done` plugins finished (cache hits + detail-scanned); `total` discovered paths.
    Progress { done: usize, total: usize },
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
}

pub fn scan_directories_with_sender(
    roots: &[PathBuf],
    event_tx: Sender<ScanEvent>,
) -> Result<ScanReport, String> {
    let events = EventSink::new(event_tx);
    let roots: Vec<PathBuf> = roots
        .iter()
        .filter(|root| root.is_dir())
        .cloned()
        .collect();
    if roots.is_empty() {
        return Err("No valid scan folders selected.".into());
    }

    for root in &roots {
        events.log(format!("Scanning {}", root.display()));
    }

    let scanner = exe::scanner_exe()
        .ok_or("vst_scanner.exe not found (expected beside app or in tools/vst_scanner.exe)")?;
    events.log(format!("Using scanner: {}", scanner.display()));

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

    let shards_scanned = if shards.is_empty() {
        events.log("All plugins served from cache".into());
        events.progress(total, total);
        0
    } else {
        run_parallel_shards(
            &roots,
            &scanner,
            &shards,
            &shard_plugin_counts,
            &shard_plugins,
            &mut cache,
            &events,
            &progress_done,
            total,
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
    events.log(format!("Done — {} valid / {} total", valid, results.len()));

    Ok(ScanReport {
        total: results.len(),
        valid,
        from_cache,
        shards_scanned,
        plugins: results,
    })
}

#[derive(Clone)]
struct EventSink {
    tx: Sender<ScanEvent>,
}

impl EventSink {
    fn new(tx: Sender<ScanEvent>) -> Self {
        Self { tx }
    }

    fn log(&self, msg: String) {
        let _ = self.tx.send(ScanEvent::Log(msg));
    }

    fn error(&self, msg: String) {
        let _ = self.tx.send(ScanEvent::Error(msg));
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
    scanner: &Path,
    shards: &[PathBuf],
    shard_plugin_counts: &HashMap<PathBuf, usize>,
    shard_plugins: &HashMap<PathBuf, Vec<PathBuf>>,
    cache: &mut PluginCache,
    events: &EventSink,
    progress_done: &Arc<AtomicUsize>,
    total: usize,
) -> Result<usize, String> {
    let shard_jobs = shard_jobs(roots, shards, shard_plugin_counts);
    let shard_count = shard_jobs.len();
    let workers = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
        .min(shard_count)
        .max(1);

    events.log(format!(
        "Running vst_scanner on {shard_count} shard(s) with {workers} worker(s)"
    ));

    let scanner = Arc::new(scanner.to_path_buf());
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
        let scanner = Arc::clone(&scanner);
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
                events.log(format!("  → {}", job.path.display()));
                let events_progress = Arc::clone(&events);
                let plugins = shard_plugins
                    .get(&job.path)
                    .cloned()
                    .unwrap_or_default();
                let progress_done = Arc::clone(&progress_done);
                let output = scan_shard_resilient(
                    &scanner,
                    job,
                    &plugins,
                    |line| {
                        events_progress.log(format!("  {line}"));
                    },
                    |line| {
                        events_progress.error(line.to_owned());
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
                for plugin in &output.plugins {
                    if let Some(msg) = plugin_error_message(plugin) {
                        events.error(msg);
                    }
                }
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
                let path = PathBuf::from(&plugin.path);
                let bundle = discover::bundle_root(&path);
                plugin.path = bundle.to_string_lossy().into_owned();
                plugin.fill_size_from_path(&bundle);
                plugin.ensure_format();
                cache.insert(&bundle, plugin);
            }
        }
    }

    Ok(shard_count)
}

/// Scan a shard; on process crash, retry each plugin path so one bad DLL cannot abort the scan.
/// `on_plugins_done` is called with how many plugins just finished detail-scanning.
fn scan_shard_resilient(
    scanner: &Path,
    job: &ShardJob,
    plugins: &[PathBuf],
    mut on_progress: impl FnMut(&str),
    mut on_error: impl FnMut(&str),
    mut on_plugins_done: impl FnMut(usize),
) -> exe::ScanOutput {
    match exe::run_scanner(scanner, &job.path, &mut on_progress, &mut on_error) {
        Ok(output) => {
            // Whole-shard scan finished — count expected plugins for this shard.
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
        Err(err) => {
            on_error(&format!("✗ {} — {err}", job.label));
            if plugins.is_empty() {
                return exe::ScanOutput {
                    scan_time: String::new(),
                    total_plugins: 0,
                    valid_plugins: 0,
                    plugins: Vec::new(),
                };
            }
            if plugins.len() == 1 {
                on_error(&format!(
                    "Recording crash stub for {}",
                    plugins[0].display()
                ));
                on_plugins_done(1);
                return exe::ScanOutput {
                    scan_time: String::new(),
                    total_plugins: 1,
                    valid_plugins: 0,
                    plugins: vec![exe::crash_stub(&plugins[0], &err)],
                };
            }

            on_progress(&format!(
                "Retrying {} plugin(s) individually after shard crash…",
                plugins.len()
            ));
            let mut recovered = Vec::new();
            for plugin_path in plugins {
                on_progress(&format!("  → {}", plugin_path.display()));
                match exe::run_scanner(scanner, plugin_path, &mut on_progress, &mut on_error) {
                    Ok(mut output) => recovered.append(&mut output.plugins),
                    Err(plugin_err) => {
                        on_error(&format!("  ✗ {} — {plugin_err}", plugin_path.display()));
                        recovered.push(exe::crash_stub(plugin_path, &plugin_err));
                    }
                }
                on_plugins_done(1);
            }
            let valid_plugins = recovered.iter().filter(|p| p.is_valid).count() as u32;
            exe::ScanOutput {
                scan_time: String::new(),
                total_plugins: recovered.len() as u32,
                valid_plugins,
                plugins: recovered,
            }
        }
    }
}

fn plugin_error_message(plugin: &PluginInfo) -> Option<String> {
    if !plugin.error.is_empty() {
        return Some(format!("{} — {}", plugin.path, plugin.error));
    }
    if plugin.load_failed {
        return Some(format!("{} — load failed", plugin.path));
    }
    if plugin.load_timed_out {
        return Some(format!("{} — load timed out", plugin.path));
    }
    None
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
        assert_eq!(
            foo.all_paths(),
            vec![r"C:\A\Foo.vst3", r"C:\B\Foo.vst3"]
        );
        let bar = plugins.iter().find(|p| p.cid == "DEF").unwrap();
        assert_eq!(bar.all_paths(), vec![r"C:\C\Bar.vst3"]);
    }
}
