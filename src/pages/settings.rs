use crate::app::App;
use crate::theme;
use eframe::egui;

pub fn show(app: &mut App, ui: &mut egui::Ui) {
    ui.label(
        egui::RichText::new("Settings")
            .text_style(theme::text::h1_style())
            .color(theme::color::MINT),
    );
    ui.add_space(8.0);

    ui.label("Default scan folder:");
    let response = ui.add(
        egui::TextEdit::singleline(&mut app.path_input)
            .desired_width(f32::INFINITY)
            .hint_text("C:\\Music or /home/user/Music"),
    );
    if response.changed() {
        app.persist_path();
    }

    ui.add_space(4.0);
    if ui.button("Browse…").clicked() {
        if let Some(folder) = rfd::FileDialog::new().pick_folder() {
            app.path_input = folder.display().to_string();
            app.persist_path();
        }
    }

    ui.add_space(8.0);
    ui.label(
        egui::RichText::new("Saved automatically to your app config directory.")
            .small()
            .weak(),
    );
}
