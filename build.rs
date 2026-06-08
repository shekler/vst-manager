use std::env;
use std::fs;
use std::path::PathBuf;

const APP_ICON: &str = "assets/icon.ico";

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
    let profile = env::var("PROFILE").expect("PROFILE");
    let target_dir = manifest_dir.join("target").join(&profile);

    println!("cargo:rerun-if-changed={APP_ICON}");
    println!("cargo:rerun-if-changed=tools/vst_scanner.exe");
    println!("cargo:rerun-if-changed=assets/Exo2.ttf");

    embed_windows_icon(&manifest_dir);

    let src = manifest_dir.join("tools").join("vst_scanner.exe");
    let dst = target_dir.join("vst_scanner.exe");

    if !src.is_file() {
        println!(
            "cargo:warning=tools/vst_scanner.exe missing; copy it before scanning in dev/release"
        );
        return;
    }

    fs::create_dir_all(&target_dir).expect("create target profile dir");
    fs::copy(&src, &dst).expect("copy vst_scanner.exe next to app binary");
}

fn embed_windows_icon(manifest_dir: &PathBuf) {
    if env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("windows") {
        return;
    }

    let icon = manifest_dir.join(APP_ICON);
    winresource::WindowsResource::new()
        .set_icon(icon.to_str().expect("icon path"))
        .compile()
        .expect("embed Windows exe icon");
}
