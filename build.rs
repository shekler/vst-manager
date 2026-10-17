use std::env;
use std::path::PathBuf;

const APP_ICON: &str = "assets/icon.ico";

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));

    println!("cargo:rerun-if-changed={APP_ICON}");
    println!("cargo:rerun-if-changed=assets/Exo2.ttf");
    println!("cargo:rerun-if-changed=crates/scanner");

    embed_windows_icon(&manifest_dir);
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
