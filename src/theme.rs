//! App-wide egui visuals and text styles. Applied once at startup.

use eframe::egui::epaint::text::VariationCoords;
use eframe::egui::{self, FontData, FontDefinitions, FontFamily, FontId, FontTweak, TextStyle};
use std::sync::Arc;

mod tokens;

pub use tokens::color;
pub use tokens::size;

const EXO2_BYTES: &[u8] = include_bytes!("../assets/Exo2.ttf");
const EXO2_REGULAR: &str = "exo2_regular";
const EXO2_SEMIBOLD: &str = "exo2_semibold";

fn font_family() -> FontFamily {
    FontFamily::Name("font".into())
}

fn exo2_variation(weight: f32) -> FontData {
    FontData::from_static(EXO2_BYTES).tweak(FontTweak {
        coords: VariationCoords::new([(b"wght", weight)]),
        ..Default::default()
    })
}

/// Named text styles for `RichText::text_style(...)`.
pub mod text {
    use super::TextStyle;

    pub fn h1_style() -> TextStyle {
        TextStyle::Name("h1".into())
    }

    pub fn h2_style() -> TextStyle {
        TextStyle::Name("h2".into())
    }

    pub fn h3_style() -> TextStyle {
        TextStyle::Name("h3".into())
    }

    pub fn base_style() -> TextStyle {
        TextStyle::Name("base".into())
    }
}

pub mod button {
    use super::{color, egui, size};
    pub fn mint(ui: &mut egui::Ui, label: &str) -> egui::Response {
        let response = egui::Frame::new()
            .stroke(egui::Stroke::new(1.0, color::MINT))
            .fill(color::MINT)
            .corner_radius(egui::CornerRadius::same(2))
            .inner_margin(egui::vec2(12.0, 8.0))
            .show(ui, |ui| {
                ui.label(
                    egui::RichText::new(label)
                        .font(egui::FontId {
                            size: size::BASE,
                            family: super::font_family(),
                        })
                        .strong()
                        .color(color::ONYX),
                );
            })
            .response
            .interact(egui::Sense::click());

        if response.hovered() {
            ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
        }

        response
    }
    pub fn powder(ui: &mut egui::Ui, label: &str) -> egui::Response {
        let response = egui::Frame::new()
            .stroke(egui::Stroke::new(1.0, color::POWDER))
            .fill(color::POWDER)
            .corner_radius(egui::CornerRadius::same(2))
            .inner_margin(egui::vec2(12.0, 8.0))
            .show(ui, |ui| {
                ui.label(
                    egui::RichText::new(label)
                        .font(egui::FontId {
                            size: size::BASE,
                            family: super::font_family(),
                        })
                        .strong()
                        .color(color::ONYX),
                );
            })
            .response
            .interact(egui::Sense::click());

        if response.hovered() {
            ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
        }

        response
    }
    pub fn outline(ui: &mut egui::Ui, label: &str) -> egui::Response {
        let response = egui::Frame::new()
            .stroke(egui::Stroke::new(1.0, color::POWDER.gamma_multiply(0.5)))
            .fill(egui::Color32::TRANSPARENT)
            .corner_radius(egui::CornerRadius::same(2))
            .inner_margin(egui::vec2(12.0, 8.0))
            .show(ui, |ui| {
                ui.label(
                    egui::RichText::new(label)
                        .font(egui::FontId {
                            size: size::BASE,
                            family: super::font_family(),
                        })
                        .strong()
                        .color(color::POWDER.gamma_multiply(0.5)),
                );
            })
            .response
            .interact(egui::Sense::click());
        if response.hovered() {
            ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
        }
        response
    }
}

pub mod status {
    use super::{color, egui, size};

    /// Label color for a VST3 sub_category tag (scanner splits pipe-separated values).
    pub fn label_color(category: &str) -> egui::Color32 {
        use color::category as cat;

        match category {
            // Top-level
            "Fx" => cat::FX,
            "Instrument" => cat::INSTRUMENT,
            "Undefined" => cat::UNDEFINED,
            // Instruments
            "Synth" => cat::SYNTH,
            "Sampler" => cat::SAMPLER,
            "Drum" => cat::DRUM,
            "Piano" => cat::PIANO,
            "External" => cat::EXTERNAL,
            // Fx sub-types
            "Analyzer" => cat::ANALYZER,
            "Delay" => cat::DELAY,
            "Distortion" => cat::DISTORTION,
            "Dynamics" => cat::DYNAMICS,
            "Dynamics - Multiband" => cat::DYNAMICS_MULTIBAND,
            "EQ" => cat::EQ,
            "Filter" => cat::FILTER,
            "Modulation" => cat::MODULATION,
            "Reverb" => cat::REVERB,
            "Spatial" => cat::SPATIAL,
            "Surround" => cat::SURROUND,
            "Mastering" => cat::MASTERING,
            "Generator" => cat::GENERATOR,
            "Pitch Shift" => cat::PITCH_SHIFT,
            "Restoration" => cat::RESTORATION,
            "Vocals" => cat::VOCALS,
            "Channel Strip" => cat::CHANNEL_STRIP,
            "Tools" => cat::TOOLS,
            "Bass" => cat::BASS,
            "Guitar" => cat::GUITAR,
            "Drums" => cat::DRUMS,
            "Microphone" => cat::MICROPHONE,
            "Network" => cat::NETWORK,
            // Spatial / format / constraints
            "Ambisonics" => cat::AMBISONICS,
            "Up-Downmix" => cat::UP_DOWNMIX,
            "Mono" => cat::MONO,
            "Stereo" => cat::STEREO,
            "OnlyRT" | "OnlyARA" | "OnlyOfflineProcess" | "NoOfflineProcess" => cat::CONSTRAINT,
            _ => cat::UNDEFINED,
        }
    }

    pub fn default(ui: &mut egui::Ui, text: &str) -> egui::Response {
        egui::Frame::new()
            .corner_radius(egui::CornerRadius::same(2))
            .stroke(egui::Stroke::new(1.0, color::POWDER.gamma_multiply(0.5)))
            .inner_margin(egui::vec2(6.0, 3.0))
            .show(ui, |ui| {
                ui.label(
                    egui::RichText::new(text)
                        .color(color::POWDER.gamma_multiply(0.5))
                        .font(egui::FontId {
                            size: size::SMALL,
                            family: super::font_family(),
                        }),
                );
            })
            .response
    }

    pub fn mint(ui: &mut egui::Ui, text: &str) -> egui::Response {
        egui::Frame::new()
            .corner_radius(egui::CornerRadius::same(2))
            .stroke(egui::Stroke::new(1.0, color::MINT))
            .inner_margin(egui::vec2(6.0, 3.0))
            .show(ui, |ui| {
                ui.label(
                    egui::RichText::new(text)
                        .color(color::MINT)
                        .font(egui::FontId {
                            size: size::SMALL,
                            family: super::font_family(),
                        }),
                );
            })
            .response
    }

    pub fn category(ui: &mut egui::Ui, text: &str) -> egui::Response {
        let label_color = label_color(text);
        let stroke_color = label_color.gamma_multiply(0.75);

        egui::Frame::new()
            .corner_radius(egui::CornerRadius::same(2))
            .stroke(egui::Stroke::new(1.0, stroke_color))
            .inner_margin(egui::vec2(6.0, 3.0))
            .show(ui, |ui| {
                ui.label(
                    egui::RichText::new(text)
                        .color(label_color)
                        .font(egui::FontId {
                            size: size::SMALL,
                            family: super::font_family(),
                        }),
                );
            })
            .response
    }
}

/// Dark theme, font sizes, and text style registry.
pub fn apply(ctx: &egui::Context) {
    setup_fonts(ctx);
    ctx.set_theme(egui::Theme::Dark);

    let mut visuals = egui::Visuals::dark();
    visuals.window_fill = tokens::color::JET;
    visuals.hyperlink_color = tokens::color::MINT;
    visuals.interact_cursor = Some(egui::CursorIcon::PointingHand);
    visuals.override_text_color = Some(tokens::color::POWDER);

    ctx.all_styles_mut(|style| {
        style.visuals = visuals.clone();
        apply_text_styles(style);
    });
}

fn setup_fonts(ctx: &egui::Context) {
    let mut fonts = FontDefinitions::default();
    fonts
        .font_data
        .insert(EXO2_REGULAR.to_owned(), Arc::new(exo2_variation(400.0)));
    fonts
        .font_data
        .insert(EXO2_SEMIBOLD.to_owned(), Arc::new(exo2_variation(600.0)));
    fonts
        .families
        .entry(FontFamily::Proportional)
        .or_default()
        .insert(0, EXO2_REGULAR.to_owned());
    fonts
        .families
        .insert(font_family(), vec![EXO2_SEMIBOLD.to_owned()]);
    ctx.set_fonts(fonts);
}

fn apply_text_styles(style: &mut egui::Style) {
    let regular = |size| FontId::new(size, FontFamily::Proportional);
    let semibold = |size| FontId::new(size, font_family());

    style
        .text_styles
        .insert(text::h1_style(), semibold(tokens::size::H1));
    style
        .text_styles
        .insert(text::h2_style(), semibold(tokens::size::H2));
    style
        .text_styles
        .insert(text::h3_style(), semibold(tokens::size::H3));
    style
        .text_styles
        .insert(text::base_style(), regular(tokens::size::BASE));
}

fn nav_tab_color(selected: bool, hovered: bool) -> egui::Color32 {
    use tokens::color;

    if selected {
        color::MINT
    } else if hovered {
        color::POWDER
    } else {
        color::POWDER.gamma_multiply(0.80)
    }
}

/// Header nav tab: mint border when active, powder text when idle.
pub fn nav_tab(ui: &mut egui::Ui, label: &str, selected: bool) -> egui::Response {
    use tokens::{color, size};

    const PADDING: egui::Vec2 = egui::vec2(12.0, 6.0);
    const ACTIVE_RADIUS: u8 = 2;

    let font = FontId::new(size::H3, FontFamily::Proportional);
    let measure = ui
        .painter()
        .layout(label.to_owned(), font.clone(), color::POWDER, f32::INFINITY);
    let tab_size = measure.size() + PADDING * 2.0;

    let (rect, response) = ui.allocate_exact_size(tab_size, egui::Sense::click());

    if selected {
        ui.painter().rect_stroke(
            rect,
            egui::CornerRadius::same(ACTIVE_RADIUS),
            egui::Stroke::new(1.0, color::MINT),
            egui::StrokeKind::Middle,
        );
    }

    let text_color = nav_tab_color(selected, response.hovered());
    let galley = ui
        .painter()
        .layout(label.to_owned(), font, text_color, f32::INFINITY);
    let text_pos = rect.min + PADDING;
    ui.painter().galley(text_pos, galley, text_color);

    if response.hovered() {
        ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
    }

    response
}

/// Shared frame recipe for grouped content blocks.
pub fn group_frame(style: &egui::Style) -> egui::Frame {
    egui::Frame::group(style)
        .corner_radius(egui::CornerRadius::same(0))
        .stroke(egui::Stroke::NONE)
        .fill(egui::Color32::TRANSPARENT)
}

pub fn card_frame(style: &egui::Style) -> egui::Frame {
    egui::Frame::group(style)
        .inner_margin(16)
        .corner_radius(egui::CornerRadius::same(2))
        .stroke(egui::Stroke::NONE)
        .fill(tokens::color::ONYX.gamma_multiply(0.5))
}

/// Horizontal + vertical padding inside [`card_frame`].
pub fn card_inner_margin(style: &egui::Style) -> egui::Vec2 {
    card_frame(style).inner_margin.sum()
}

/// Inner content size for a grid cell of `cell_size` (outer card box).
pub fn card_content_size(cell_size: egui::Vec2, style: &egui::Style) -> egui::Vec2 {
    let margin = card_inner_margin(style);
    (cell_size - margin).max(egui::Vec2::ZERO)
}
