mod cache;
mod discover;
mod exe;

use cache::PluginCache;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::mpsc::Sender;
use std::thread;

pub use exe::PluginInfo;

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
    log_tx: Sender<String>,
) -> Result<ScanReport, String> {
    let log = LogSink::new(log_tx);
    let roots: Vec<PathBuf> = roots
        .iter()
        .filter(|root| root.is_dir())
        .cloned()
        .collect();
    if roots.is_empty() {
        return Err("No valid scan folders selected.".into());
    }

    for root in &roots {
        log.send(format!("Scanning {}", root.display()));
    }

    let scanner = exe::scanner_exe()
        .ok_or("vst_scanner.exe not found (expected beside app or in tools/vst_scanner.exe)")?;
    log.send(format!("Using scanner: {}", scanner.display()));

    let mut cache = PluginCache::load();
    let mut from_cache = 0usize;
    let mut shards_to_scan = HashSet::new();
    let mut all_discovered = Vec::new();
    let mut shard_plugin_counts = HashMap::new();

    for root in &roots {
        log.send(format!("Discovering plugin paths in {}…", root.display()));
        let discovered = discover::discover_plugin_paths(root)?;
        log.send(format!("Found {} plugin path(s)", discovered.len()));

        for plugin_path in &discovered {
            let shard = discover::shard_root(root, plugin_path);
            *shard_plugin_counts.entry(shard.clone()).or_insert(0) += 1;
            if cache.get(plugin_path).is_some() {
                from_cache += 1;
            } else {
                shards_to_scan.insert(shard);
            }
        }
        if discovered.is_empty() {
            shards_to_scan.insert(root.clone());
        }
        all_discovered.extend(discovered);
    }

    all_discovered.sort();
    all_discovered.dedup();

    log.send(format!(
        "Cache: {} hit(s), {} shard(s) need scan",
        from_cache,
        shards_to_scan.len()
    ));

    let mut shards: Vec<PathBuf> = shards_to_scan.into_iter().collect();
    shards.sort();
    shards.dedup();

    let shards_scanned = if shards.is_empty() {
        log.send("All plugins served from cache".into());
        0
    } else {
        run_parallel_shards(
            &roots,
            &scanner,
            &shards,
            &shard_plugin_counts,
            &mut cache,
            &log,
        )?
    };

    let mut results = collect_results(&cache, &roots, &all_discovered);

    log.send("Pruning cache and saving…".into());
    cache.prune_missing(&all_discovered);
    cache.save()?;

    for plugin in &mut results {
        plugin.ensure_derived_fields();
    }

    results.sort_by(|a, b| a.path.cmp(&b.path));
    let valid = results.iter().filter(|p| p.is_valid).count();
    log.send(format!("Done — {} valid / {} total", valid, results.len()));

    Ok(ScanReport {
        total: results.len(),
        valid,
        from_cache,
        shards_scanned,
        plugins: results,
    })
}

#[derive(Clone)]
struct LogSink {
    tx: Sender<String>,
}

impl LogSink {
    fn new(tx: Sender<String>) -> Self {
        Self { tx }
    }

    fn send(&self, msg: String) {
        let _ = self.tx.send(msg);
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
    cache: &mut PluginCache,
    log: &LogSink,
) -> Result<usize, String> {
    let shard_jobs = shard_jobs(roots, shards, shard_plugin_counts);
    let shard_count = shard_jobs.len();
    let workers = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
        .min(shard_count)
        .max(1);

    log.send(format!(
        "Running vst_scanner on {shard_count} shard(s) with {workers} worker(s)"
    ));

    let scanner = Arc::new(scanner.to_path_buf());
    let shard_jobs = Arc::new(shard_jobs);
    let progress = Arc::new(log.tx.clone());
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
        let progress = Arc::clone(&progress);
        handles.push(thread::spawn(move || {
            let mut outputs = Vec::new();
            for (i, job) in shard_jobs[start..end].iter().enumerate() {
                let shard_num = start + i + 1;
                let _ = progress.send(format!(
                    "Shard {shard_num}/{shard_count}: {} — {} plugin(s)",
                    job.label, job.plugin_count
                ));
                let _ = progress.send(format!("  → {}", job.path.display()));
                let log_progress = Arc::clone(&progress);
                let result = exe::run_scanner(&scanner, &job.path, |line| {
                    let _ = log_progress.send(format!("  {line}"));
                });
                match &result {
                    Ok(out) => {
                        let valid = out.plugins.iter().filter(|p| p.is_valid).count();
                        let _ = progress.send(format!(
                            "  ✓ {} — {valid}/{} valid",
                            job.label,
                            out.plugins.len()
                        ));
                    }
                    Err(e) => {
                        let _ = progress.send(format!("  ✗ {} — {e}", job.label));
                    }
                }
                outputs.push((job.path.clone(), result));
            }
            outputs
        }));
    }

    for handle in handles {
        let outputs = handle
            .join()
            .map_err(|_| "Scanner worker thread panicked".to_string())?;
        for (_shard, result) in outputs {
            let output = result?;
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
