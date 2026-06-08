use crate::app::App;
use crate::scanner;
use crate::theme;
use eframe::egui::{self, Rect, UiBuilder};

const GRID_COLUMNS: usize = 3;
const GRID_GAP: f32 = 16.0;
/// Extra pixels above/below viewport to pre-render while scrolling.
const VIEWPORT_BUFFER: f32 = 120.0;
const ESTIMATED_GRID_ROW_HEIGHT: f32 = 80.0;

pub fn show(app: &mut App, ui: &mut egui::Ui) {
    let scan_label = if app.scanning {
        "Scanning..."
    } else {
        "Scan plugins"
    };
    ui.horizontal(|ui| {
        if !app.scanning && theme::button::mint(ui, scan_label).clicked() {
            app.start_scan();
        }
        ui.add_space(12.0);
        if !app.scanning && theme::button::powder(ui, "Clear plugins").clicked() {
            app.clear_plugins();
        }
    });

    if !app.status.is_empty() {
        ui.add_space(24.0);
        ui.horizontal(|ui| {
            ui.label(
                egui::RichText::new(&app.status)
                    .small()
                    .color(theme::color::POWDER.gamma_multiply(0.8))
                    .text_style(theme::text::base_style()),
            );
            ui.with_layout(egui::Layout::right_to_left(egui::Align::BOTTOM), |ui| {
                ui.link("Show invalid plugins")
            });
        });
        ui.add_space(24.0);
    }

    if !app.scan_log.is_empty() {
        ui.collapsing("Scan log", |ui| {
            egui::ScrollArea::vertical()
                .max_height(240.0)
                .auto_shrink([false, false])
                .stick_to_bottom(true)
                .show(ui, |ui| {
                    for line in &app.scan_log {
                        ui.label(
                            egui::RichText::new(line)
                                .small()
                                .family(egui::FontFamily::Monospace),
                        );
                    }
                });
        });
        ui.add_space(24.0);
    }

    if app.scan_results.is_empty() {
        let hint = if app.scanning {
            "Scan in progress…"
        } else {
            "No plugins yet. Set default scan folder in Settings, then Scan."
        };
        ui.label(hint);
        return;
    }

    let valid_plugins: Vec<&scanner::PluginInfo> =
        app.scan_results.iter().filter(|p| p.is_valid).collect();
    let plugin_count = valid_plugins.len();
    let grid_row_count = plugin_count.div_ceil(GRID_COLUMNS);
    let heights = &mut app.plugin_row_heights;
    if heights.len() != grid_row_count {
        heights.resize(grid_row_count, 0.0);
    }

    egui::ScrollArea::vertical()
        .id_salt("plugin_list")
        .auto_shrink([false, false])
        .show_viewport(ui, |ui, viewport| {
            show_plugins_viewport(ui, &valid_plugins, heights, viewport);
        });
}

fn show_plugins_viewport(
    ui: &mut egui::Ui,
    plugins: &[&scanner::PluginInfo],
    heights: &mut [f32],
    viewport: Rect,
) {
    let count = plugins.len();
    if count == 0 {
        return;
    }

    let grid_row_count = count.div_ceil(GRID_COLUMNS);
    let row_heights: Vec<f32> = (0..grid_row_count)
        .map(|row| effective_grid_row_height(heights.get(row).copied().unwrap_or(0.0)))
        .collect();

    let gap_x = GRID_GAP;
    let gap_y = GRID_GAP;

    let mut offsets = Vec::with_capacity(grid_row_count);
    let mut y = 0.0;
    for &h in &row_heights {
        offsets.push(y);
        y += h + gap_y;
    }
    let total_height = if grid_row_count > 0 { y - gap_y } else { 0.0 };

    ui.set_min_height(total_height.max(0.0));

    let view_min = viewport.min.y - VIEWPORT_BUFFER;
    let view_max = viewport.max.y + VIEWPORT_BUFFER;
    let range = visible_row_range(grid_row_count, &offsets, &row_heights, view_min, view_max);

    let content_left = ui.max_rect().left();
    let content_top = ui.max_rect().top();
    let content_width = ui.max_rect().width();
    let col_width = (content_width - gap_x * (GRID_COLUMNS - 1) as f32) / GRID_COLUMNS as f32;
    let card_frame = theme::card_frame(ui.style());

    let mut layout_changed = false;
    for grid_row in range {
        let y_offset = offsets[grid_row];
        let row_height = row_heights[grid_row];
        let mut row_measured = 0.0f32;
        let content_size = theme::card_content_size(egui::vec2(col_width, row_height), ui.style());

        for col in 0..GRID_COLUMNS {
            let index = grid_row * GRID_COLUMNS + col;
            if index >= count {
                break;
            }

            let x = content_left + col as f32 * (col_width + gap_x);
            let rect = Rect::from_min_size(
                egui::pos2(x, content_top + y_offset),
                egui::vec2(col_width, row_height),
            );

            let measured = ui
                .scope_builder(UiBuilder::new().max_rect(rect), |ui| {
                    let response = card_frame.show(ui, |ui| {
                        ui.set_width(content_size.x);
                        ui.set_min_height(content_size.y);
                        show_plugin_card(ui, plugins[index]);
                    });
                    response.response.rect.height()
                })
                .inner;

            row_measured = row_measured.max(measured);
        }

        if row_measured > 0.0 {
            let prev = heights[grid_row];
            if prev == 0.0 || (prev - row_measured).abs() > 1.0 {
                heights[grid_row] = row_measured;
                layout_changed = true;
            }
        }
    }

    if layout_changed {
        ui.ctx().request_repaint();
    }
}

fn visible_row_range(
    count: usize,
    offsets: &[f32],
    heights: &[f32],
    view_min: f32,
    view_max: f32,
) -> std::ops::Range<usize> {
    let mut start = 0;
    while start < count && offsets[start] + heights[start] < view_min {
        start += 1;
    }

    let mut end = start;
    while end < count && offsets[end] < view_max {
        end += 1;
    }

    start..end
}

fn effective_grid_row_height(measured: f32) -> f32 {
    if measured > 0.0 {
        measured
    } else {
        ESTIMATED_GRID_ROW_HEIGHT
    }
}

fn show_plugin_card(ui: &mut egui::Ui, plugin: &scanner::PluginInfo) {
    ui.horizontal_top(|ui| {
        ui.vertical(|ui| {
            ui.label(
                egui::RichText::new(plugin.vendor())
                    .strong()
                    .color(theme::color::POWDER.gamma_multiply(0.5))
                    .text_style(egui::TextStyle::Name("base".into())),
            );
            ui.label(
                egui::RichText::new(plugin.name())
                    .strong()
                    .color(theme::color::POWDER)
                    .text_style(egui::TextStyle::Name("h3".into())),
            );
        });

        ui.with_layout(egui::Layout::right_to_left(egui::Align::TOP), |ui| {
            if !plugin.version.is_empty() {
                theme::status::mint(ui, &format!("v{}", plugin.version));
            }
            let format = plugin.format_label();
            if !format.is_empty() {
                theme::status::default(ui, &format.to_uppercase());
            }
            if !plugin.size.is_empty() {
                theme::status::default(ui, &plugin.size);
            }
        });
    });

    ui.add_space(16.0);

    ui.horizontal_wrapped(|ui| {
        if plugin.sub_categories.is_empty() {
            theme::status::default(ui, "Undefined");
        } else {
            for category in &plugin.sub_categories {
                theme::status::category(ui, category);
            }
        }
    });

    ui.add_space(16.0);
    ui.label(
        egui::RichText::new(plugin_path_label(&plugin.path))
            .small()
            .family(egui::FontFamily::Monospace)
            .weak(),
    );

    if !plugin.error.is_empty() {
        ui.add_space(16.0);
        ui.label(
            egui::RichText::new(&plugin.error)
                .small()
                .color(theme::color::RED),
        );
    }
}

fn plugin_path_label(path: &str) -> String {
    std::path::Path::new(path)
        .parent()
        .map(|p| p.to_string_lossy().into_owned())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| path.to_owned())
}
