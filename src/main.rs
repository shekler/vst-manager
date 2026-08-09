#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod pages;
mod scanner;
mod theme;

use app::App;
use eframe::egui;

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_maximized(true)
            .with_decorations(true)
            .with_has_shadow(false)
            .with_min_inner_size(egui::Vec2::new(1024.0, 768.0))
            // Remove position for production build
            .with_position(egui::Pos2::new(-1080.0, 320.0))
            .with_title("VST Manager")
            .with_icon(
                eframe::icon_data::from_png_bytes(include_bytes!("../assets/icon.png"))
                    .expect("invalid icon.png"),
            ),

        ..Default::default()
    };
    eframe::run_native(
        "VST Manager",
        options,
        Box::new(|cc| Ok(Box::new(App::new(cc)))),
    )
}
