use crate::app::App;
use crate::theme;
use eframe::egui;
use std::path::PathBuf;

pub struct DefaultFolder {
    pub label: &'static str,
    pub path: String,
}

/// Common VST/VST3/CLAP install locations for the current OS.
pub fn default_vst_folders() -> Vec<DefaultFolder> {
    #[cfg(target_os = "windows")]
    {
        let pf = std::env::var("ProgramFiles").unwrap_or_else(|_| r"C:\Program Files".into());
        let pf86 =
            std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| r"C:\Program Files (x86)".into());
        let mut folders = vec![
            DefaultFolder {
                label: "VST3 (64-bit)",
                path: format!(r"{pf}\Common Files\VST3"),
            },
            DefaultFolder {
                label: "VST3 (32-bit)",
                path: format!(r"{pf86}\Common Files\VST3"),
            },
            DefaultFolder {
                label: "VST2 (64-bit)",
                path: format!(r"{pf}\Common Files\VST2"),
            },
            DefaultFolder {
                label: "VST2 (32-bit)",
                path: format!(r"{pf86}\Common Files\VST2"),
            },
            DefaultFolder {
                label: "VSTPlugins",
                path: format!(r"{pf}\VSTPlugins"),
            },
            DefaultFolder {
                label: "Steinberg VSTPlugins",
                path: format!(r"{pf}\Steinberg\VSTPlugins"),
            },
            DefaultFolder {
                label: "Steinberg VST2",
                path: format!(r"{pf}\Common Files\Steinberg\VST2"),
            },
            DefaultFolder {
                label: "Steinberg VSTPlugins (32-bit)",
                path: format!(r"{pf86}\Steinberg\VstPlugins"),
            },
            DefaultFolder {
                label: "CLAP",
                path: format!(r"{pf}\Common Files\CLAP"),
            },
        ];
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            folders.push(DefaultFolder {
                label: "VST3 (per-user)",
                path: format!(r"{local}\Programs\Common\VST3"),
            });
        }
        folders
    }

    #[cfg(target_os = "macos")]
    {
        let mut folders = vec![
            DefaultFolder {
                label: "VST3 (system)",
                path: "/Library/Audio/Plug-Ins/VST3".into(),
            },
            DefaultFolder {
                label: "VST2 (system)",
                path: "/Library/Audio/Plug-Ins/VST".into(),
            },
            DefaultFolder {
                label: "CLAP (system)",
                path: "/Library/Audio/Plug-Ins/CLAP".into(),
            },
        ];
        if let Ok(home) = std::env::var("HOME") {
            let home = PathBuf::from(home);
            folders.extend([
                DefaultFolder {
                    label: "VST3 (user)",
                    path: home
                        .join("Library/Audio/Plug-Ins/VST3")
                        .display()
                        .to_string(),
                },
                DefaultFolder {
                    label: "VST2 (user)",
                    path: home
                        .join("Library/Audio/Plug-Ins/VST")
                        .display()
                        .to_string(),
                },
                DefaultFolder {
                    label: "CLAP (user)",
                    path: home
                        .join("Library/Audio/Plug-Ins/CLAP")
                        .display()
                        .to_string(),
                },
            ]);
        }
        folders
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Vec::new()
    }
}

pub fn show(app: &mut App, ui: &mut egui::Ui) {
    ui.label(
        egui::RichText::new("Settings")
            .text_style(theme::text::h1_style())
            .color(theme::color::MINT),
    );
    ui.add_space(8.0);

    ui.label(
        egui::RichText::new("Common plugin folders")
            .text_style(theme::text::h3_style())
            .color(theme::color::POWDER),
    );
    ui.add_space(8.0);

    let folders: Vec<_> = default_vst_folders()
        .into_iter()
        .filter(|folder| PathBuf::from(&folder.path).is_dir())
        .collect();
    if folders.is_empty() {
        ui.label(
            egui::RichText::new("No common plugin folders found — use a custom folder below.")
                .small()
                .weak(),
        );
    } else {
        let mut changed = false;
        for folder in &folders {
            let mut checked = app.selected_folders.contains(&folder.path);
            let label = format!("{} — {}", folder.label, folder.path);
            if theme::checkbox::default(ui, &mut checked, &label).changed() {
                if checked {
                    app.selected_folders.insert(folder.path.clone());
                } else {
                    app.selected_folders.remove(&folder.path);
                }
                changed = true;
            }
        }
        if changed {
            app.persist_path();
        }
    }

    ui.add_space(16.0);
    ui.label(
        egui::RichText::new("Select custom folder")
            .text_style(theme::text::h3_style())
            .color(theme::color::POWDER),
    );
    ui.add_space(8.0);

    let response = egui::Frame::NONE
        .inner_margin(egui::vec2(10.0, 6.0))
        .corner_radius(4)
        .fill(theme::color::ONYX)
        .stroke(egui::Stroke::new(
            1.0,
            theme::color::POWDER.gamma_multiply(0.3),
        ))
        .show(ui, |ui| {
            ui.add(
                egui::TextEdit::singleline(&mut app.path_input)
                    .frame(egui::Frame::NONE)
                    .desired_width(f32::INFINITY)
                    .hint_text("C:\\home\\user\\plugins"),
            )
        })
        .inner;
    if response.changed() {
        app.persist_path();
    }

    ui.add_space(4.0);
    if theme::button::powder(ui, "Browse directories").clicked() {
        if let Some(folder) = rfd::FileDialog::new().pick_folder() {
            app.path_input = folder.display().to_string();
            app.persist_path();
        }
    }

    ui.add_space(24.0);
    ui.label(
        egui::RichText::new("Scanning")
            .text_style(theme::text::h3_style())
            .color(theme::color::POWDER),
    );
    ui.add_space(8.0);

    const CHECKBOX_TEXT_INDENT: f32 = 22.0; // box + gap (matches theme checkbox)
    const NOTE_FONT_SIZE: f32 = 12.0;

    let mut scan_license = app.scan_license_protected;
    ui.vertical(|ui| {
        if theme::checkbox::default(
            ui,
            &mut scan_license,
            "Scan license-protected plugins (PACE / iLok)",
        )
        .changed()
        {
            app.scan_license_protected = scan_license;
            app.persist_path();
        }
        ui.horizontal(|ui| {
            ui.add_space(CHECKBOX_TEXT_INDENT);
            ui.label(
                egui::RichText::new(
                    "Disable this feature if you have issues with scanning license-protected \
                     plugins. Those will be skipped if disabled.",
                )
                .font(egui::FontId::new(
                    NOTE_FONT_SIZE,
                    egui::FontFamily::Proportional,
                ))
                .color(theme::color::POWDER.gamma_multiply(0.7)),
            );
        });
    });

    ui.add_space(16.0);
    ui.label(
        egui::RichText::new("Saved automatically to your app config directory.")
            .small()
            .weak(),
    );
}
