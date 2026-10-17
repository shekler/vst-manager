mod discover;
mod license;
mod map;

pub use discover::find_vst3_modules;

use scanner_types::{PluginInfo, ScanOutput};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};

static IN_PROCESS_LOADS: AtomicUsize = AtomicUsize::new(0);
const MAX_CONCURRENT_IN_PROCESS_LOADS: usize = 2;
use vst3_host::discovery::get_detailed_plugin_info;

#[derive(Debug, Clone, Copy)]
pub struct ScanOptions {
    pub quiet: bool,
    pub factory_load_timeout_sec: u64,
    pub protected_plugin_timeout_sec: u64,
    pub skip_factory_load: bool,
    pub fast_license_skip: bool,
    /// When true, attempt DLL load even for PACE/iLok heuristics (CLI `--try-license-load`).
    pub try_license_load: bool,
    pub isolate_factory_load: bool,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            quiet: false,
            factory_load_timeout_sec: 5,
            protected_plugin_timeout_sec: 2,
            skip_factory_load: false,
            fast_license_skip: true,
            try_license_load: false,
            isolate_factory_load: cfg!(windows),
        }
    }
}

/// Scan an explicit list of module paths (no directory walk).
pub fn scan_paths(
    paths: &[PathBuf],
    options: &ScanOptions,
    max_parallel: usize,
    mut on_progress: impl FnMut(&str),
) -> ScanOutput {
    if paths.is_empty() {
        return ScanOutput::from_plugins(Vec::new());
    }
    if paths.len() == 1 || max_parallel <= 1 {
        return scan_paths_sequential(paths, options, on_progress);
    }
    scan_paths_parallel(paths, options, max_parallel.max(1), &mut on_progress)
}

fn scan_paths_sequential(
    paths: &[PathBuf],
    options: &ScanOptions,
    mut on_progress: impl FnMut(&str),
) -> ScanOutput {
    if !options.quiet {
        on_progress(&format!("Scanning {} plugin path(s)", paths.len()));
    }
    let mut plugins = Vec::with_capacity(paths.len());
    let total = paths.len();
    for (i, module_path) in paths.iter().enumerate() {
        scan_one_module(module_path, i + 1, total, options, &mut plugins, &mut on_progress);
    }
    ScanOutput::from_plugins(plugins)
}

fn scan_paths_parallel(
    paths: &[PathBuf],
    options: &ScanOptions,
    max_parallel: usize,
    on_progress: &mut impl FnMut(&str),
) -> ScanOutput {
    let options = Arc::new(*options);
    let total = paths.len();
    if !options.quiet {
        on_progress(&format!(
            "Scanning {total} plugin path(s) with {max_parallel} worker(s)"
        ));
    }

    let mut slots: Vec<Option<PluginInfo>> = vec![None; total];
    let mut handles = Vec::new();
    let chunk = total.div_ceil(max_parallel);

    for batch in 0..max_parallel {
        let start = batch * chunk;
        if start >= total {
            break;
        }
        let end = (start + chunk).min(total);
        let paths: Vec<PathBuf> = paths[start..end].to_vec();
        let options = Arc::clone(&options);
        let offset = start;
        handles.push(thread::spawn(move || {
            let mut local = Vec::new();
            let mut lines = Vec::new();
            for (j, module_path) in paths.iter().enumerate() {
                let idx = offset + j + 1;
                scan_one_module(
                    module_path,
                    idx,
                    total,
                    &options,
                    &mut local,
                    &mut |line| lines.push(line.to_owned()),
                );
            }
            (offset, local, lines)
        }));
    }

    let mut batches = Vec::new();
    for handle in handles {
        if let Ok(batch) = handle.join() {
            batches.push(batch);
        }
    }
    batches.sort_by_key(|(offset, _, _)| *offset);
    for (offset, batch_plugins, lines) in batches {
        for line in lines {
            on_progress(&line);
        }
        for (i, plugin) in batch_plugins.into_iter().enumerate() {
            slots[offset + i] = Some(plugin);
        }
    }

    ScanOutput::from_plugins(slots.into_iter().flatten().collect())
}

fn scan_one_module(
    module_path: &Path,
    index: usize,
    total: usize,
    options: &ScanOptions,
    plugins: &mut Vec<PluginInfo>,
    on_progress: &mut impl FnMut(&str),
) {
    if !options.quiet {
        on_progress(&format!(
            "[{index}/{total}] scanning: {}",
            module_path.display()
        ));
    }

    let started = Instant::now();
    let mut info = if options.skip_factory_load {
        let mut p = invalid_stub("", "Factory load skipped (--no-factory)");
        p.path = module_path.to_string_lossy().into_owned();
        p.load_failed = true;
        p
    } else {
        load_plugin_via_factory(module_path, options)
    };
    info.scan_duration_ms = started.elapsed().as_millis() as u64;

    if !options.quiet {
        log_plugin_result(&info, on_progress);
    }
    plugins.push(info);
}

pub fn scan_directory(
    directory: &Path,
    options: &ScanOptions,
    mut on_progress: impl FnMut(&str),
) -> ScanOutput {
    let modules = if directory.is_file() || is_vst3_module(directory) {
        vec![directory.to_path_buf()]
    } else {
        find_vst3_modules(directory)
    };

    if !options.quiet {
        on_progress(&format!("Found {} VST module(s)", modules.len()));
    }

    let mut plugins = Vec::with_capacity(modules.len());
    let total = modules.len();

    for (i, module_path) in modules.iter().enumerate() {
        scan_one_module(
            module_path,
            i + 1,
            total,
            options,
            &mut plugins,
            &mut on_progress,
        );
    }

    ScanOutput::from_plugins(plugins)
}

fn is_vst3_module(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("vst3"))
}

pub fn scan_single_module(path: &Path) -> PluginInfo {
    let options = ScanOptions {
        fast_license_skip: false,
        // Worker process is already isolated; do not spawn nested workers.
        isolate_factory_load: false,
        ..ScanOptions::default()
    };
    let started = Instant::now();
    let mut info = load_plugin_via_factory(path, &options);
    info.scan_duration_ms = started.elapsed().as_millis() as u64;
    info
}

fn load_plugin_via_factory(path: &Path, options: &ScanOptions) -> PluginInfo {
    let path_str = path.to_string_lossy().into_owned();

    if !is_vst3_module(path) {
        let mut info = invalid_stub(
            &path_str,
            "Not a VST3 module (VST2/CLAP scan not implemented; skipped)",
        );
        info.scan_source = "skipped".into();
        info.format = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_ascii_lowercase())
            .filter(|e| e == "dll")
            .map(|_| "vst2".into())
            .unwrap_or_default();
        return info;
    }

    let fast_license_skip = options.fast_license_skip && !options.try_license_load;
    let skip_unlicensed = license::should_fast_skip_unlicensed(path);

    if fast_license_skip && skip_unlicensed {
        let mut info = invalid_stub(&path_str, "License protection detected; DLL load skipped");
        info.missing_license = true;
        info.scan_source = "skipped".into();
        return info;
    }

    if fast_license_skip
        && !skip_unlicensed
        && license::path_suggests_headless_unsafe_vendor(path)
    {
        let mut info = invalid_stub(
            &path_str,
            "Factory load skipped (plugin alerts or blocks headless scan, e.g. iZotope)",
        );
        info.load_failed = true;
        info.scan_source = "skipped".into();
        return info;
    }

    let mut timeout_sec = options.factory_load_timeout_sec;
    if !options.try_license_load && license::factory_load_may_need_protection(path) {
        timeout_sec = timeout_sec.min(options.protected_plugin_timeout_sec);
    }

    let timeout = Duration::from_secs(timeout_sec);
    let mut info = if options.isolate_factory_load {
        #[cfg(windows)]
        {
            if let Some(worker) = isolated_worker_exe() {
                scan_isolated(path, timeout, &worker)
            } else {
                // Spawning the GUI binary per plugin usually exceeds the 5s parent timeout.
                scan_in_process_with_timeout(path, timeout)
            }
        }
        #[cfg(not(windows))]
        {
            scan_in_process_with_timeout(path, timeout)
        }
    } else {
        scan_in_process_with_timeout(path, timeout)
    };

    license::classify_plugin_failure(&mut info);
    info
}

fn scan_in_process(path: &Path) -> PluginInfo {
    let path_str = path.to_string_lossy().into_owned();
    match get_detailed_plugin_info(path) {
        Ok(detailed) => map::map_detailed(path, detailed),
        Err(e) => invalid_stub(&path_str, &e.to_string()),
    }
}

fn scan_in_process_with_timeout(path: &Path, timeout: Duration) -> PluginInfo {
    let path_str = path.to_string_lossy().into_owned();
    while IN_PROCESS_LOADS.load(Ordering::SeqCst) >= MAX_CONCURRENT_IN_PROCESS_LOADS {
        thread::sleep(Duration::from_millis(25));
    }
    IN_PROCESS_LOADS.fetch_add(1, Ordering::SeqCst);
    let path_buf = path.to_path_buf();
    let (tx, rx) = mpsc::sync_channel(1);
    thread::spawn(move || {
        let info = scan_in_process(&path_buf);
        let _ = tx.send(info);
    });
    let result = match rx.recv_timeout(timeout) {
        Ok(info) => info,
        Err(mpsc::RecvTimeoutError::Timeout) => {
            let mut info = invalid_stub(
                &path_str,
                "Timed out loading plugin (hung initializer or modal UI)",
            );
            info.load_timed_out = true;
            info
        }
        Err(mpsc::RecvTimeoutError::Disconnected) => invalid_stub(
            &path_str,
            "Plugin scan thread exited before returning a result",
        ),
    };
    IN_PROCESS_LOADS.fetch_sub(1, Ordering::SeqCst);
    result
}

/// Slim `vst_scanner.exe` beside the host (legacy C++ worker), never the GUI binary.
pub fn resolve_isolated_worker_exe() -> Option<PathBuf> {
    isolated_worker_exe()
}

#[cfg(windows)]
fn isolated_worker_exe() -> Option<PathBuf> {
    let current = std::env::current_exe().ok()?;
    let dir = current.parent()?;
    let sibling = dir.join("vst_scanner.exe");
    if sibling.is_file() {
        return Some(sibling);
    }
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        let tools = PathBuf::from(manifest)
            .join("tools")
            .join("vst_scanner.exe");
        if tools.is_file() {
            return Some(tools);
        }
    }
    None
}

#[cfg(not(windows))]
fn isolated_worker_exe() -> Option<PathBuf> {
    None
}

#[cfg(windows)]
fn scan_isolated(path: &Path, timeout: Duration, worker_exe: &Path) -> PluginInfo {
    use std::fs;
    use std::io::{BufRead, BufReader};
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};

    let path_str = path.to_string_lossy().into_owned();

    let out_path = std::env::temp_dir().join(format!(
        "vst_scan_worker_{}_{}.json",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0)
    ));

    let mut child = match Command::new(worker_exe)
        .arg("--worker")
        .arg(path)
        .arg("-o")
        .arg(&out_path)
        .arg("-q")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(0x08000000)
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            return invalid_stub(
                &path_str,
                &format!("Failed to start isolated plugin scan worker: {e}"),
            );
        }
    };

    if !wait_timeout(&mut child, timeout) {
        let _ = child.kill();
        let _ = child.wait();
        let _ = fs::remove_file(&out_path);
        let mut info = invalid_stub(
            &path_str,
            "Timed out loading plugin (hung initializer or modal UI)",
        );
        info.load_timed_out = true;
        return info;
    }

    let status = child.wait().ok();
    let exit_code = status.map(|s| s.code().unwrap_or(1)).unwrap_or(1);

    let mut parsed = Vec::new();
    for _ in 0..20 {
        if out_path.is_file() {
            if let Ok(file) = fs::File::open(&out_path) {
                let reader = BufReader::new(file);
                let mut json = String::new();
                for line in reader.lines().map_while(Result::ok) {
                    json.push_str(&line);
                    json.push('\n');
                }
                if let Ok(output) = serde_json::from_str::<ScanOutput>(&json) {
                    parsed = output.plugins;
                    if !parsed.is_empty() {
                        break;
                    }
                }
            }
        }
        std::thread::sleep(Duration::from_millis(25));
    }

    let had_file = out_path.is_file();
    let _ = fs::remove_file(&out_path);

    if let Some(p) = parsed.into_iter().next() {
        return p;
    }

    let msg = if !had_file {
        format!(
            "Isolated worker exited without result (exit code {exit_code}; plugin may have crashed on load)"
        )
    } else {
        format!("Could not parse worker scan result (exit code {exit_code})")
    };
    invalid_stub(&path_str, &msg)
}

#[cfg(windows)]
fn wait_timeout(child: &mut std::process::Child, timeout: Duration) -> bool {
    use std::time::Instant;
    let deadline = Instant::now() + timeout;
    loop {
        match child.try_wait() {
            Ok(Some(_)) => return true,
            Ok(None) if Instant::now() >= deadline => return false,
            Ok(None) => std::thread::sleep(Duration::from_millis(20)),
            Err(_) => return false,
        }
    }
}


fn invalid_stub(path: &str, error: &str) -> PluginInfo {
    PluginInfo {
        path: path.into(),
        paths: Vec::new(),
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
        error: error.into(),
        size: String::new(),
        format: if path.to_ascii_lowercase().ends_with(".vst3") {
            "vst3".into()
        } else {
            String::new()
        },
        scan_duration_ms: 0,
    }
}

fn log_plugin_result(info: &PluginInfo, log: &mut impl FnMut(&str)) {
    if info.is_valid {
        log(&format!("  -> OK: {} ({})", info.name, info.vendor));
        return;
    }
    if info.missing_license {
        log("  -> missing license (skipped)");
    } else if info.load_failed && info.scan_source == "skipped" {
        log("  -> failed (skipped)");
    } else if info.load_timed_out {
        log("  -> timed out");
    } else if info.load_failed {
        log(&format!("  -> failed: {}", info.error));
    } else {
        log(&format!("  -> failed: {}", info.error));
    }
}

pub fn write_scan_json(output: &ScanOutput, path: &Path) -> Result<(), String> {
    let json = serde_json::to_string_pretty(output).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| format!("write {}: {e}", path.display()))
}

/// If argv is `--worker <plugin> [-o out.json] [-q]`, run one isolated scan and return exit code.
/// Otherwise `None` (caller should continue normal startup).
pub fn try_run_worker_from_args() -> Option<i32> {
    let args: Vec<String> = std::env::args().collect();
    let mut worker_plugin = String::new();
    let mut output_file = String::new();
    let mut quiet = false;

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--worker" if i + 1 < args.len() => {
                i += 1;
                worker_plugin = args[i].clone();
            }
            "-o" if i + 1 < args.len() => {
                i += 1;
                output_file = args[i].clone();
            }
            "-q" | "--quiet" => quiet = true,
            _ => {}
        }
        i += 1;
    }

    if worker_plugin.is_empty() {
        return None;
    }

    let path = Path::new(&worker_plugin);
    let plugin = scan_single_module(path);
    let output = ScanOutput::from_plugins(vec![plugin]);

    let result = if output_file.is_empty() {
        println!(
            "{}",
            serde_json::to_string_pretty(&output).unwrap_or_default()
        );
        Ok(())
    } else {
        write_scan_json(&output, Path::new(&output_file)).map_err(|e| {
            eprintln!("{e}");
            1
        })
    };

    if !quiet && result.is_ok() && !output_file.is_empty() {
        eprintln!("Results written to: {output_file}");
    }

    Some(if result.is_ok() { 0 } else { 1 })
}
