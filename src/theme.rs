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
    use super::{FontId, TextStyle, color, egui, size};

    const PADDING: egui::Vec2 = egui::vec2(10.0, 6.0);
    const RADIUS: u8 = 4;

    struct Colors {
        fill: egui::Color32,
        stroke: egui::Color32,
        text: egui::Color32,
    }

    fn apply_state(visuals: &mut egui::style::WidgetVisuals, colors: Colors) {
        visuals.weak_bg_fill = colors.fill;
        visuals.bg_fill = colors.fill;
        visuals.bg_stroke = egui::Stroke::new(1.0, colors.stroke);
        visuals.fg_stroke = egui::Stroke::new(1.0, colors.text);
        visuals.corner_radius = egui::CornerRadius::same(RADIUS);
        visuals.expansion = 0.0;
    }

    /// Themed [`egui::Button`] — scope overrides widget visuals, keeps default hover/active.
    fn styled(
        ui: &mut egui::Ui,
        label: &str,
        idle: Colors,
        hover: Colors,
        active: Colors,
    ) -> egui::Response {
        ui.scope(|ui| {
            let style = ui.style_mut();
            style.spacing.button_padding = PADDING;
            // Let per-state `fg_stroke` drive text color (global override would pin POWDER).
            style.visuals.override_text_color = None;
            style.text_styles.insert(
                TextStyle::Button,
                FontId::new(size::BASE, super::font_family()),
            );

            apply_state(&mut style.visuals.widgets.inactive, idle);
            apply_state(&mut style.visuals.widgets.hovered, hover);
            apply_state(&mut style.visuals.widgets.active, active);

            ui.add(egui::Button::new(label))
        })
        .inner
    }

    pub fn mint(ui: &mut egui::Ui, label: &str) -> egui::Response {
        styled(
            ui,
            label,
            Colors {
                fill: color::MINT,
                stroke: color::MINT,
                text: color::ONYX,
            },
            Colors {
                fill: color::ONYX,
                stroke: color::MINT.gamma_multiply(0.3),
                text: color::MINT,
            },
            Colors {
                fill: color::ONYX,
                stroke: color::MINT.gamma_multiply(0.3),
                text: color::MINT,
            },
        )
    }

    pub fn powder(ui: &mut egui::Ui, label: &str) -> egui::Response {
        styled(
            ui,
            label,
            Colors {
                fill: color::POWDER,
                stroke: color::POWDER,
                text: color::ONYX,
            },
            Colors {
                fill: color::ONYX,
                stroke: color::POWDER.gamma_multiply(0.3),
                text: color::POWDER,
            },
            Colors {
                fill: color::ONYX,
                stroke: color::POWDER.gamma_multiply(0.3),
                text: color::POWDER,
            },
        )
    }

    pub fn outline(ui: &mut egui::Ui, label: &str) -> egui::Response {
        let muted = color::POWDER.gamma_multiply(0.5);
        styled(
            ui,
            label,
            Colors {
                fill: egui::Color32::TRANSPARENT,
                stroke: muted,
                text: muted,
            },
            Colors {
                fill: egui::Color32::TRANSPARENT,
                stroke: color::POWDER,
                text: color::POWDER,
            },
            Colors {
                fill: color::POWDER.gamma_multiply(0.12),
                stroke: color::POWDER,
                text: color::POWDER,
            },
        )
    }
}

pub mod checkbox {
    use super::{FontFamily, FontId, TextStyle, color, egui, size};

    const BOX_SIZE: f32 = 14.0;
    const CHECK_SIZE: f32 = 8.0;
    const ICON_GAP: f32 = 8.0;
    const RADIUS: u8 = 2;

    struct Colors {
        fill: egui::Color32,
        stroke: egui::Color32,
        check: egui::Color32,
        text: egui::Color32,
    }

    fn apply_state(visuals: &mut egui::style::WidgetVisuals, colors: &Colors) {
        visuals.bg_fill = colors.fill;
        visuals.weak_bg_fill = colors.fill;
        visuals.bg_stroke = egui::Stroke::new(1.0, colors.stroke);
        visuals.fg_stroke = egui::Stroke::new(1.5, colors.check);
        visuals.corner_radius = egui::CornerRadius::same(RADIUS);
        visuals.expansion = 0.0;
    }

    fn pick_text(
        state: egui::widget_style::WidgetState,
        idle: &Colors,
        hover: &Colors,
        active: &Colors,
    ) -> egui::Color32 {
        match state {
            egui::widget_style::WidgetState::Active => active.text,
            egui::widget_style::WidgetState::Hovered => hover.text,
            _ => idle.text,
        }
    }

    fn styled(
        ui: &mut egui::Ui,
        checked: &mut bool,
        label: &str,
        idle: Colors,
        hover: Colors,
        active: Colors,
    ) -> egui::Response {
        ui.scope(|ui| {
            let style = ui.style_mut();
            style.spacing.icon_width = BOX_SIZE;
            style.spacing.icon_width_inner = CHECK_SIZE;
            style.spacing.icon_spacing = ICON_GAP;
            style.visuals.override_text_color = None;
            style.text_styles.insert(
                TextStyle::Body,
                FontId::new(size::BASE, FontFamily::Proportional),
            );

            apply_state(&mut style.visuals.widgets.inactive, &idle);
            apply_state(&mut style.visuals.widgets.hovered, &hover);
            apply_state(&mut style.visuals.widgets.active, &active);

            // Peek last-frame state so label color can differ from check mark (`fg_stroke`).
            let state = ui
                .ctx()
                .read_response(ui.next_auto_id())
                .map(|r| r.widget_state())
                .unwrap_or_default();
            let text_color = pick_text(state, &idle, &hover, &active);

            let text = egui::RichText::new(label)
                .font(FontId::new(size::BASE, FontFamily::Proportional))
                .color(text_color);

            ui.add(egui::Checkbox::new(checked, text))
        })
        .inner
    }

    /// Default filter-style checkbox (powder idle, mint when checked / hovered).
    pub fn default(ui: &mut egui::Ui, checked: &mut bool, label: &str) -> egui::Response {
        let muted = color::POWDER.gamma_multiply(0.55);
        if *checked {
            styled(
                ui,
                checked,
                label,
                Colors {
                    fill: color::MINT,
                    stroke: color::MINT,
                    check: color::ONYX,
                    text: color::POWDER,
                },
                Colors {
                    fill: color::RED,
                    stroke: color::RED,
                    check: color::ONYX,
                    text: color::POWDER,
                },
                Colors {
                    fill: color::RED,
                    stroke: color::RED,
                    check: color::ONYX,
                    text: color::POWDER,
                },
            )
        } else {
            styled(
                ui,
                checked,
                label,
                Colors {
                    fill: egui::Color32::TRANSPARENT,
                    stroke: muted,
                    check: muted,
                    text: muted,
                },
                Colors {
                    fill: color::MINT.gamma_multiply(0.2),
                    stroke: color::MINT,
                    check: color::MINT,
                    text: color::POWDER,
                },
                Colors {
                    fill: color::MINT.gamma_multiply(0.2),
                    stroke: color::MINT,
                    check: color::MINT,
                    text: color::POWDER,
                },
            )
        }
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

    fn badge(
        ui: &mut egui::Ui,
        text: &str,
        stroke: egui::Color32,
        text_color: egui::Color32,
        background: egui::Color32,
    ) -> egui::Response {
        const PAD: egui::Vec2 = egui::vec2(6.0, 3.0);

        let label = egui::RichText::new(text)
            .font(egui::FontId::new(size::SMALL, super::font_family()))
            .color(text_color);

        // Exact size up-front — Frame inside horizontal_wrapped alone won't wrap (egui#3054).
        let text_size = ui.fonts_mut(|f| {
            f.layout_no_wrap(
                text.to_owned(),
                egui::FontId::new(size::SMALL, super::font_family()),
                text_color,
            )
            .size()
        });
        let desired = text_size + PAD * 2.0 + egui::vec2(2.0, 2.0);

        ui.allocate_ui(desired, |ui| {
            egui::Frame::new()
                .corner_radius(egui::CornerRadius::same(2))
                .stroke(egui::Stroke::new(1.0, stroke))
                .inner_margin(PAD)
                .fill(background)
                .show(ui, |ui| {
                    ui.label(label);
                });
        })
        .response
    }

    pub fn default(ui: &mut egui::Ui, text: &str) -> egui::Response {
        let color = color::POWDER.gamma_multiply(0.7);
        badge(ui, text, color, color, egui::Color32::TRANSPARENT)
    }

    pub fn mint(ui: &mut egui::Ui, text: &str) -> egui::Response {
        badge(
            ui,
            text,
            color::MINT,
            color::MINT,
            egui::Color32::TRANSPARENT,
        )
    }

    pub fn category(ui: &mut egui::Ui, text: &str) -> egui::Response {
        let text_color = label_color(text);
        badge(
            ui,
            text,
            text_color.gamma_multiply(0.75),
            text_color,
            text_color.gamma_multiply(0.1),
        )
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
    visuals.popup_shadow = egui::Shadow::NONE;

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
    style
        .text_styles
        .insert(TextStyle::Small, regular(tokens::size::SMALL));
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

    let font = FontId::new(size::H3, FontFamily::Proportional);
    let measure = ui
        .painter()
        .layout(label.to_owned(), font.clone(), color::POWDER, f32::INFINITY);
    let tab_size = measure.size() + PADDING * 2.0;

    let (rect, response) = ui.allocate_exact_size(tab_size, egui::Sense::click());

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
        .stroke(egui::Stroke::new(
            1.0,
            tokens::color::POWDER.gamma_multiply(0.1),
        ))
        .fill(tokens::color::ONYX.gamma_multiply(0.5))
}

pub fn invalid_card_frame(style: &egui::Style) -> egui::Frame {
    let red = tokens::color::RED;
    egui::Frame::group(style)
        .inner_margin(16)
        .corner_radius(egui::CornerRadius::same(2))
        .stroke(egui::Stroke::new(1.0, red))
        .fill(egui::Color32::from_rgba_unmultiplied(
            red.r(),
            red.g(),
            red.b(),
            26, // ~10% alpha
        ))
}

/// Horizontal + vertical padding inside [`card_frame`] (margins + stroke).
pub fn card_inner_margin(style: &egui::Style) -> egui::Vec2 {
    card_frame(style).total_margin().sum()
}

/// Inner content size for a grid cell of `cell_size` (outer card box).
pub fn card_content_size(cell_size: egui::Vec2, style: &egui::Style) -> egui::Vec2 {
    let margin = card_inner_margin(style);
    (cell_size - margin).max(egui::Vec2::ZERO)
}
