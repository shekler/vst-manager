use crate::app::App;
use crate::scanner;
use crate::theme;
use eframe::egui::{self, Rect, UiBuilder};
use std::collections::{BTreeMap, HashSet};

const GRID_COLUMNS: usize = 3;
const GRID_GAP: f32 = 16.0;
/// Extra pixels above/below viewport to pre-render while scrolling.
const VIEWPORT_BUFFER: f32 = 120.0;
const ESTIMATED_GRID_ROW_HEIGHT: f32 = 80.0;
const SIDEBAR_WIDTH: f32 = 360.0;

pub fn show(app: &mut App, ui: &mut egui::Ui) {
    ui.with_layout(egui::Layout::left_to_right(egui::Align::Min), |ui| {
        // Fixed column — avoid `Panel::left` (defaults resizable + clips right stroke).
        ui.allocate_ui_with_layout(
            egui::vec2(SIDEBAR_WIDTH, ui.available_height()),
            egui::Layout::top_down(egui::Align::Min),
            |ui| {
                egui::Frame::new()
                    .stroke(egui::Stroke::new(
                        1.0,
                        theme::color::POWDER.gamma_multiply(0.2),
                    ))
                    .inner_margin(24)
                    .corner_radius(4)
                    .show(ui, |ui| {
                        ui.set_min_height(ui.max_rect().height());
                        show_sidebar(app, ui);
                    });
            },
        );

        ui.add_space(48.0);

        egui::CentralPanel::default()
            .frame(theme::group_frame(ui.style()))
            .show_inside(ui, |ui| show_content(app, ui));
    });
}

fn show_sidebar(app: &mut App, ui: &mut egui::Ui) {
    ui.label(
        egui::RichText::new("Filters")
            .text_style(theme::text::h3_style())
            .color(theme::color::POWDER),
    );
    ui.add_space(16.0);

    if app.scan_results.iter().all(|p| !p.is_valid) {
        ui.label(egui::RichText::new("No plugins loaded").small().weak());
        return;
    }

    let vendors = vendor_counts(&app.scan_results);
    let categories = category_counts(&app.scan_results);

    const GROUP_GAP: f32 = 24.0;
    let slot_height = ((ui.available_height() - GROUP_GAP) / 2.0).max(0.0);

    ui.allocate_ui_with_layout(
        egui::vec2(ui.available_width(), slot_height),
        egui::Layout::top_down(egui::Align::Min),
        |ui| {
            show_filter_group(
                ui,
                "Vendor",
                "vendor_filter",
                &vendors,
                &mut app.filter_vendors,
                &mut app.plugin_row_heights,
            );
        },
    );

    ui.add_space(GROUP_GAP);

    ui.allocate_ui_with_layout(
        egui::vec2(ui.available_width(), slot_height),
        egui::Layout::top_down(egui::Align::Min),
        |ui| {
            show_filter_group(
                ui,
                "Category",
                "category_filter",
                &categories,
                &mut app.filter_categories,
                &mut app.plugin_row_heights,
            );
        },
    );
}

fn show_filter_group(
    ui: &mut egui::Ui,
    title: &str,
    id_salt: &str,
    counts: &BTreeMap<String, usize>,
    selected: &mut HashSet<String>,
    row_heights: &mut Vec<f32>,
) {
    ui.horizontal(|ui| {
        ui.label(
            egui::RichText::new(title)
                .strong()
                .color(theme::color::POWDER.gamma_multiply(0.7))
                .text_style(theme::text::base_style()),
        );
        ui.with_layout(egui::Layout::right_to_left(egui::Align::BOTTOM), |ui| {
            if !selected.is_empty() && ui.link("Clear").clicked() {
                selected.clear();
                row_heights.clear();
            }
        });
    });
    ui.add_space(8.0);

    if counts.is_empty() {
        ui.label(egui::RichText::new("None").small().weak());
        return;
    }

    let list_height = ui.available_height();
    const ARROW_SIZE: egui::Vec2 = egui::vec2(16.0, 16.0);
    const ARROW_GAP: f32 = 6.0;
    let arrow_rail_w = ARROW_SIZE.x;

    ui.horizontal(|ui| {
        let scroll_width = (ui.available_width() - arrow_rail_w - ARROW_GAP).max(0.0);
        let scroll = ui
            .allocate_ui_with_layout(
                egui::vec2(scroll_width, list_height),
                egui::Layout::top_down(egui::Align::Min),
                |ui| {
                    egui::ScrollArea::vertical()
                        .id_salt(id_salt)
                        .max_height(list_height)
                        .min_scrolled_height(list_height)
                        .auto_shrink([false, false])
                        .show(ui, |ui| {
                            let mut filter_changed = false;
                            for (name, count) in counts {
                                let mut checked = selected.contains(name);
                                let label = format!("{name} ({count})");
                                if theme::checkbox::default(ui, &mut checked, &label).changed() {
                                    if checked {
                                        selected.insert(name.clone());
                                    } else {
                                        selected.remove(name);
                                    }
                                    filter_changed = true;
                                }
                            }
                            if filter_changed {
                                row_heights.clear();
                            }
                        })
                },
            )
            .inner;

        ui.add_space(ARROW_GAP);
        paint_scroll_arrow_rail(ui, &scroll, list_height, ARROW_SIZE);
    });
}

fn paint_scroll_arrow_rail<R>(
    ui: &mut egui::Ui,
    scroll: &egui::scroll_area::ScrollAreaOutput<R>,
    list_height: f32,
    arrow_size: egui::Vec2,
) {
    const EPS: f32 = 1.0;
    const ANIM_SECS: f32 = 0.20;

    let offset_y = scroll.state.offset.y;
    let view_h = scroll.inner_rect.height();
    let content_h = scroll.content_size.y;
    let page = view_h.max(0.0);
    let max_offset = (content_h - view_h).max(0.0);
    let scroll_id = scroll.id;
    let anim_id = scroll_id.with("smooth_y");
    let target_id = scroll_id.with("smooth_target");

    let tint = theme::color::POWDER.gamma_multiply(0.5);
    // Keep both images mounted — remount at scroll ends flashes egui's red load-error frame.
    let arrow = |visible: bool| {
        let color = if visible {
            tint
        } else {
            egui::Color32::TRANSPARENT
        };
        egui::Image::new(egui::include_image!("../../assets/arrow.svg"))
            .fit_to_exact_size(arrow_size)
            .tint(color)
            .show_loading_spinner(false)
            .sense(if visible {
                egui::Sense::click()
            } else {
                egui::Sense::hover()
            })
    };

    let mut page_delta = 0.0_f32;

    // Arrow enable uses target while animating so ends update before settle.
    let arrow_y = ui
        .ctx()
        .data(|d| d.get_temp::<f32>(target_id))
        .unwrap_or(offset_y);
    let can_up = arrow_y > EPS;
    let can_down = arrow_y + view_h < content_h - EPS;

    ui.allocate_ui_with_layout(
        egui::vec2(arrow_size.x, list_height),
        egui::Layout::top_down(egui::Align::Center),
        |ui| {
            let up = ui.add(arrow(can_up).rotate(std::f32::consts::PI, egui::vec2(0.5, 0.5)));
            if can_up && up.clicked() {
                page_delta -= page;
            }
            if can_up && up.hovered() {
                ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
            }

            ui.add_space((ui.available_height() - arrow_size.y).max(0.0));

            let down = ui.add(arrow(can_down));
            if can_down && down.clicked() {
                page_delta += page;
            }
            if can_down && down.hovered() {
                ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
            }
        },
    );

    if page_delta != 0.0 {
        let base = ui
            .ctx()
            .data(|d| d.get_temp::<f32>(target_id))
            .unwrap_or_else(|| {
                // Seed anim at current offset so first target change interpolates (no snap).
                let _ = ui.ctx().animate_value_with_time(anim_id, offset_y, 0.0);
                offset_y
            });
        let new_target = (base + page_delta).clamp(0.0, max_offset);
        ui.ctx().data_mut(|d| d.insert_temp(target_id, new_target));
    }

    if let Some(target) = ui.ctx().data(|d| d.get_temp::<f32>(target_id)) {
        let y = ui
            .ctx()
            .animate_value_with_time(anim_id, target, ANIM_SECS)
            .clamp(0.0, max_offset);
        let mut state = scroll.state.clone();
        state.offset.y = y;
        state.store(ui.ctx(), scroll_id);

        if (y - target).abs() < 0.5 {
            state.offset.y = target;
            state.store(ui.ctx(), scroll_id);
            ui.ctx().data_mut(|d| d.remove_temp::<f32>(target_id));
        }
    }
}

fn show_content(app: &mut App, ui: &mut egui::Ui) {
    let scan_label = if app.scanning {
        "Scanning..."
    } else {
        "Scan plugins"
    };
    ui.horizontal(|ui| {
        if !app.scanning && theme::button::mint(ui, scan_label).clicked() {
            app.start_scan();
        }
        if !app.scanning && theme::button::powder(ui, "Clear plugins").clicked() {
            app.clear_plugins();
        }
    });

    let invalid_count = app.scan_results.iter().filter(|p| !p.is_valid).count();

    if !app.status.is_empty() {
        ui.add_space(24.0);
        ui.horizontal(|ui| {
            ui.label(
                egui::RichText::new(&app.status)
                    .small()
                    .color(theme::color::POWDER.gamma_multiply(0.8))
                    .text_style(theme::text::base_style()),
            );
            if invalid_count > 0 {
                ui.with_layout(egui::Layout::right_to_left(egui::Align::BOTTOM), |ui| {
                    let label = if app.show_invalid_plugins {
                        "Hide invalid plugins"
                    } else {
                        "Show invalid plugins"
                    };
                    ui.scope(|ui| {
                        ui.visuals_mut().hyperlink_color = theme::color::RED;
                        if ui.link(label).clicked() {
                            app.show_invalid_plugins = !app.show_invalid_plugins;
                        }
                    });
                });
            }
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

    if app.show_invalid_plugins && invalid_count > 0 {
        show_invalid_plugins_section(app, ui);
    }

    let valid_plugins: Vec<&scanner::PluginInfo> = app
        .scan_results
        .iter()
        .filter(|p| p.is_valid)
        .filter(|p| app.filter_vendors.is_empty() || app.filter_vendors.contains(&p.vendor()))
        .filter(|p| matches_category_filter(p, &app.filter_categories))
        .collect();

    if valid_plugins.is_empty() {
        ui.label("No plugins match the current filters.");
        return;
    }

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
            show_plugins_viewport(ui, &valid_plugins, heights, viewport, false);
        });
}

fn show_invalid_plugins_section(app: &mut App, ui: &mut egui::Ui) {
    let invalid_plugins: Vec<&scanner::PluginInfo> =
        app.scan_results.iter().filter(|p| !p.is_valid).collect();

    ui.label(
        egui::RichText::new(format!("Invalid plugins ({})", invalid_plugins.len()))
            .text_style(theme::text::h3_style())
            .color(theme::color::POWDER),
    );
    ui.add_space(16.0);

    let grid_row_count = invalid_plugins.len().div_ceil(GRID_COLUMNS);
    let heights = &mut app.invalid_plugin_row_heights;
    if heights.len() != grid_row_count {
        heights.resize(grid_row_count, 0.0);
    }

    egui::ScrollArea::vertical()
        .id_salt("invalid_plugin_list")
        .max_height(320.0)
        .auto_shrink([false, false])
        .show_viewport(ui, |ui, viewport| {
            show_plugins_viewport(ui, &invalid_plugins, heights, viewport, true);
        });

    ui.add_space(24.0);
}

fn vendor_counts(plugins: &[scanner::PluginInfo]) -> BTreeMap<String, usize> {
    let mut counts = BTreeMap::new();
    for plugin in plugins.iter().filter(|p| p.is_valid) {
        *counts.entry(plugin.vendor()).or_insert(0) += 1;
    }
    counts
}

fn category_counts(plugins: &[scanner::PluginInfo]) -> BTreeMap<String, usize> {
    let mut counts = BTreeMap::new();
    for plugin in plugins.iter().filter(|p| p.is_valid) {
        if plugin.sub_categories.is_empty() {
            *counts.entry("Undefined".to_owned()).or_insert(0) += 1;
        } else {
            for category in &plugin.sub_categories {
                *counts.entry(category.clone()).or_insert(0) += 1;
            }
        }
    }
    counts
}

fn matches_category_filter(plugin: &scanner::PluginInfo, selected: &HashSet<String>) -> bool {
    if selected.is_empty() {
        return true;
    }
    if plugin.sub_categories.is_empty() {
        return selected.contains("Undefined");
    }
    plugin
        .sub_categories
        .iter()
        .any(|category| selected.contains(category))
}

fn show_plugins_viewport(
    ui: &mut egui::Ui,
    plugins: &[&scanner::PluginInfo],
    heights: &mut [f32],
    viewport: Rect,
    invalid: bool,
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
    let card_frame = if invalid {
        theme::invalid_card_frame(ui.style())
    } else {
        theme::card_frame(ui.style())
    };

    let mut layout_changed = false;
    for grid_row in range {
        let y_offset = offsets[grid_row];
        let row_height = row_heights[grid_row];
        let mut row_measured = 0.0f32;
        let content_width =
            theme::card_content_size(egui::vec2(col_width, row_height), ui.style()).x;

        for col in 0..GRID_COLUMNS {
            let index = grid_row * GRID_COLUMNS + col;
            if index >= count {
                break;
            }

            let x = content_left + col as f32 * (col_width + gap_x);
            // Tall max_rect so wrapped category rows can measure true height;
            // next frame uses updated `heights` for spacing.
            let rect = Rect::from_min_size(
                egui::pos2(x, content_top + y_offset),
                egui::vec2(col_width, row_height.max(1024.0)),
            );

            let measured = ui
                .scope_builder(UiBuilder::new().max_rect(rect), |ui| {
                    let response = card_frame.show(ui, |ui| {
                        ui.set_width(content_width);
                        show_plugin_card(ui, plugins[index], invalid);
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

fn show_plugin_card(ui: &mut egui::Ui, plugin: &scanner::PluginInfo, invalid: bool) {
    ui.horizontal_top(|ui| {
        ui.vertical(|ui| {
            let show_vendor = !invalid || !plugin.vendor.is_empty();
            if show_vendor {
                ui.label(
                    egui::RichText::new(plugin.vendor())
                        .strong()
                        .color(theme::color::POWDER.gamma_multiply(0.5))
                        .text_style(egui::TextStyle::Name("base".into())),
                );
            }
            let title = if invalid {
                plugin_file_name(&plugin.path)
            } else {
                plugin.name()
            };
            ui.label(
                egui::RichText::new(title)
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

    if !invalid {
        ui.add_space(16.0);

        ui.horizontal_wrapped(|ui| {
            ui.spacing_mut().item_spacing.y = 6.0;
            if plugin.sub_categories.is_empty() {
                theme::status::default(ui, "Undefined");
            } else {
                for category in &plugin.sub_categories {
                    theme::status::category(ui, category);
                }
            }
        });
    }

    ui.add_space(16.0);
    let install_paths = plugin.all_paths();
    for (path_idx, install_path) in install_paths.iter().enumerate() {
        if path_idx > 0 {
            ui.add_space(6.0);
        }
        ui.horizontal(|ui| {
            let folder_path = plugin_path_label(install_path);
            ui.label(
                egui::RichText::new(&folder_path)
                    .small()
                    .family(egui::FontFamily::Monospace)
                    .weak(),
            );

            let icon = |ui: &mut egui::Ui, image: egui::Image| {
                ui.add(
                    egui::Button::image(
                        image
                            .fit_to_exact_size(egui::vec2(16.0, 16.0))
                            .tint(theme::color::POWDER.gamma_multiply(0.7)),
                    )
                    .frame(false),
                )
            };

            let copy = icon(
                ui,
                egui::Image::new(egui::include_image!("../../assets/copy.svg")),
            );
            let feedback_id = copy.id.with(("path_copied", path_idx, *install_path));
            let now = ui.input(|i| i.time);
            if copy.clicked() {
                ui.ctx().copy_text(folder_path.clone());
                ui.ctx().data_mut(|d| d.insert_temp(feedback_id, now));
            }
            const COPIED_SECS: f64 = 2.0;
            let copied_at = ui.ctx().data(|d| d.get_temp::<f64>(feedback_id));
            if let Some(t0) = copied_at.filter(|&t0| now - t0 < COPIED_SECS) {
                egui::Popup::from_response(&copy)
                    .kind(egui::PopupKind::Tooltip)
                    .align(egui::RectAlign::TOP_START)
                    .gap(4.0)
                    .show(|ui| {
                        egui::Frame::NONE
                            .inner_margin(egui::vec2(3.0, 2.0))
                            .show(ui, |ui| {
                                ui.label(
                                    egui::RichText::new("File path copied")
                                        .color(theme::color::POWDER.gamma_multiply(0.7)),
                                );
                            });
                    });

                ui.ctx()
                    .request_repaint_after(std::time::Duration::from_secs_f64(
                        (COPIED_SECS - (now - t0)).max(0.0),
                    ));
            } else {
                if copied_at.is_some() {
                    ui.ctx().data_mut(|d| {
                        let _: Option<f64> = d.remove_temp(feedback_id);
                    });
                }
                copy.on_hover_text("Copy folder path");
            }

            if icon(
                ui,
                egui::Image::new(egui::include_image!("../../assets/folder.svg")),
            )
            .on_hover_text("Open folder")
            .clicked()
            {
                let _ = open::that(&folder_path);
            }
        });
    }

    if !plugin.error.is_empty() {
        ui.add_space(16.0);
        ui.label(
            egui::RichText::new(&plugin.error)
                .small()
                .color(theme::color::RED),
        );
    }
}

fn plugin_file_name(path: &str) -> String {
    std::path::Path::new(path)
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| path.to_owned())
}

fn plugin_path_label(path: &str) -> String {
    std::path::Path::new(path)
        .parent()
        .map(|p| p.to_string_lossy().into_owned())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| path.to_owned())
}
