use scanner_types::ScanOutput;
use std::env;
use std::path::PathBuf;
use vst_scanner::{ScanOptions, scan_directory, scan_single_module, write_scan_json};

fn main() {
    if let Err(code) = run() {
        std::process::exit(code);
    }
}

fn run() -> Result<(), i32> {
    if let Some(code) = vst_scanner::try_run_worker_from_args() {
        return if code == 0 { Ok(()) } else { Err(code) };
    }

    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        print_usage(&args[0]);
        return Err(1);
    }

    let mut directory = String::new();
    let mut output_file = String::new();
    let mut worker_plugin = String::new();
    let mut scan_options = ScanOptions::default();

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "-h" | "--help" => {
                print_usage(&args[0]);
                return Ok(());
            }
            "-o" if i + 1 < args.len() => {
                i += 1;
                output_file = args[i].clone();
            }
            "--timeout" if i + 1 < args.len() => {
                i += 1;
                scan_options.factory_load_timeout_sec = args[i].parse().unwrap_or(10);
            }
            "--no-isolate" => {
                scan_options.isolate_factory_load = false;
            }
            "--no-factory" => {
                scan_options.skip_factory_load = true;
            }
            "--try-license-load" => {
                scan_options.try_license_load = true;
                scan_options.fast_license_skip = false;
            }
            "--worker" if i + 1 < args.len() => {
                i += 1;
                worker_plugin = args[i].clone();
            }
            "-q" | "--quiet" => {
                scan_options.quiet = true;
            }
            other if directory.is_empty() && !other.starts_with('-') => {
                directory = other.to_string();
            }
            other => {
                eprintln!("Unknown argument: {other}");
                return Err(1);
            }
        }
        i += 1;
    }

    if !worker_plugin.is_empty() {
        let path = PathBuf::from(&worker_plugin);
        let plugin = scan_single_module(&path);
        let output = ScanOutput::from_plugins(vec![plugin]);
        if output_file.is_empty() {
            println!(
                "{}",
                serde_json::to_string_pretty(&output).unwrap_or_default()
            );
        } else {
            write_scan_json(&output, PathBuf::from(&output_file).as_path()).map_err(|e| {
                eprintln!("{e}");
                1
            })?;
        }
        return Ok(());
    }

    if directory.is_empty() {
        eprintln!("Error: Directory path is required");
        return Err(1);
    }

    if !scan_options.quiet {
        println!("Scanning directory: {directory}");
    }

    let output = scan_directory(PathBuf::from(&directory).as_path(), &scan_options, |line| {
        if !scan_options.quiet {
            println!("{line}");
        }
    });

    if output_file.is_empty() {
        println!(
            "{}",
            serde_json::to_string_pretty(&output).unwrap_or_default()
        );
    } else {
        write_scan_json(&output, PathBuf::from(&output_file).as_path()).map_err(|e| {
            eprintln!("{e}");
            1
        })?;
        if !scan_options.quiet {
            println!("Results written to: {output_file}");
        }
    }

    Ok(())
}

fn print_usage(argv0: &str) {
    eprintln!("Usage: {argv0} <directory_path> [options]");
    eprintln!("       {argv0} --worker <plugin_path> -o <file.json>");
    eprintln!("Options:");
    eprintln!("  -o <output_file.json>     Output to file (default: stdout)");
    eprintln!("  --timeout <seconds>       Per-plugin factory load timeout (default: 10)");
    eprintln!("  --try-license-load        Attempt DLL load for PACE/iLok bundles (slower)");
    eprintln!("  --no-isolate              Load plugins in-process (Windows only, risky)");
    eprintln!("  --no-factory              List paths only; never load plugin DLLs");
    eprintln!("  -q, --quiet               Suppress per-plugin progress output");
    eprintln!("  -h, --help                Show this help message");
}
