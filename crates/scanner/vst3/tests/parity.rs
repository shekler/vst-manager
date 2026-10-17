use scanner_types::{PluginInfo, ScanOutput};
use serde_json::json;

#[test]
fn deserializes_reference_fixture_shape() {
    let json = include_str!("../../../../data.json");
    let output: ScanOutput = serde_json::from_str(json).expect("parse data.json");
    assert_eq!(output.plugins.len(), 4);
    let p = &output.plugins[0];
    assert!(p.is_valid);
    assert_eq!(p.scan_source, "factory");
    assert_eq!(p.name, "Amplifiers");
}

#[test]
fn serializes_invalid_plugin_like_cpp_scanner() {
    let plugin = PluginInfo {
        path: r"H:\VSTPlugins\Bad.vst3".into(),
        paths: vec![],
        is_valid: false,
        scan_source: "skipped".into(),
        name: String::new(),
        vendor: String::new(),
        version: String::new(),
        cid: String::new(),
        sdk_version: String::new(),
        cardinality: 0,
        flags: 0,
        sub_categories: vec![],
        missing_license: true,
        load_failed: false,
        load_timed_out: false,
        error: "License protection detected; DLL load skipped".into(),
        size: String::new(),
        format: String::new(),
        scan_duration_ms: 0,
    };
    let output = ScanOutput::from_plugins(vec![plugin]);
    let value: serde_json::Value = serde_json::to_value(&output).expect("serialize");
    let p = &value["plugins"][0];
    assert_eq!(p["missingLicense"], json!(true));
    assert_eq!(p["scanSource"], json!("skipped"));
}

#[test]
fn optional_golden_compare_with_cpp_exe() {
    let cpp = std::env::var("VST_SCANNER_CPP_EXE").ok();
    let sample_dir = std::env::var("VST_SCANNER_SAMPLE_DIR").ok();
    let (cpp, sample_dir) = match (cpp, sample_dir) {
        (Some(c), Some(d)) => (c, d),
        _ => return,
    };

    let out_path =
        std::env::temp_dir().join(format!("vst_scanner_parity_{}.json", std::process::id()));
    let _ = std::fs::remove_file(&out_path);

    let status = std::process::Command::new(&cpp)
        .arg(&sample_dir)
        .arg("-o")
        .arg(&out_path)
        .arg("--try-license-load")
        .arg("-q")
        .status()
        .expect("run cpp vst_scanner");

    assert!(status.success(), "cpp scanner failed");
    let cpp_json = std::fs::read_to_string(&out_path).expect("read cpp json");
    let cpp_out: ScanOutput = serde_json::from_str(&cpp_json).expect("parse cpp json");

    let rust_out = vst_scanner::scan_directory(
        std::path::Path::new(&sample_dir),
        &vst_scanner::ScanOptions {
            try_license_load: true,
            fast_license_skip: false,
            quiet: true,
            ..Default::default()
        },
        |_| {},
    );

    assert_eq!(cpp_out.plugins.len(), rust_out.plugins.len());
}

#[test]
fn failure_taxonomy_timeout_and_license() {
    use scanner_types::ScanOutcome;

    let mut timed = PluginInfo {
        path: "A.vst3".into(),
        paths: vec![],
        is_valid: false,
        scan_source: String::new(),
        name: String::new(),
        vendor: String::new(),
        version: String::new(),
        cid: String::new(),
        sdk_version: String::new(),
        cardinality: 0,
        flags: 0,
        sub_categories: vec![],
        missing_license: false,
        load_failed: true,
        load_timed_out: true,
        error: "Timed out loading plugin (hung initializer or modal UI)".into(),
        size: String::new(),
        format: "vst3".into(),
        scan_duration_ms: 0,
    };
    assert_eq!(timed.scan_outcome(), ScanOutcome::TimedOut);

    timed.missing_license = true;
    timed.load_timed_out = false;
    assert_eq!(timed.scan_outcome(), ScanOutcome::MissingLicense);
}
