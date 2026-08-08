use crate::pages;
use crate::scanner;
use crate::theme;
use directories::ProjectDirs;
use eframe::egui;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::mpsc;
use std::thread;

const APP_QUALIFIER: &str = "com";
const APP_ORGANIZATION: &str = "vst-manager";
const APP_NAME: &str = "vst-manager";

#[derive(Default, Serialize, Deserialize)]
struct Config {
    scan_path: String,
    #[serde(default)]
    selected_folders: Vec<String>,
}

impl Config {
    fn path() -> Option<PathBuf> {
        ProjectDirs::from(APP_QUALIFIER, APP_ORGANIZATION, APP_NAME)
            .map(|dirs| dirs.config_dir().join("config.json"))
    }

    fn load() -> Self {
        let Some(path) = Self::path() else {
            return Self::default();
        };
        std::fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    fn save(&self) {
        let Some(path) = Self::path() else {
            return;
        };
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(self) {
            let _ = std::fs::write(path, json);
        }
    }
}

enum ScanMsg {
    Log(String),
    Done(Result<scanner::ScanReport, String>),
}

#[derive(Clone, Copy, PartialEq, Eq, Default)]
enum Page {
    #[default]
    Library,
    Settings,
}

pub struct App {
    current_page: Page,
    pub(crate) path_input: String,
    /// Checked common default plugin folders (absolute paths).
    pub(crate) selected_folders: HashSet<String>,
    pub(crate) scan_results: Vec<scanner::PluginInfo>,
    /// Measured grid-row heights for virtual scrolling (`0` = not measured yet).
    pub(crate) plugin_row_heights: Vec<f32>,
    /// Selected vendor names; empty = no vendor filter.
    pub(crate) filter_vendors: HashSet<String>,
    /// Selected category names; empty = no category filter.
    pub(crate) filter_categories: HashSet<String>,
    pub(crate) status: String,
    pub(crate) scan_log: Vec<String>,
    pub(crate) scanning: bool,
    scan_rx: Option<mpsc::Receiver<ScanMsg>>,
}

fn prune_vendor_filter(selected: &mut HashSet<String>, plugins: &[scanner::PluginInfo]) {
    let available: HashSet<String> = plugins
        .iter()
        .filter(|p| p.is_valid)
        .map(|p| p.vendor())
        .collect();
    selected.retain(|name| available.contains(name));
}

fn prune_category_filter(selected: &mut HashSet<String>, plugins: &[scanner::PluginInfo]) {
    let available: HashSet<String> = plugins
        .iter()
        .filter(|p| p.is_valid)
        .flat_map(|p| {
            if p.sub_categories.is_empty() {
                vec!["Undefined".to_owned()]
            } else {
                p.sub_categories.clone()
            }
        })
        .collect();
    selected.retain(|name| available.contains(name));
}

fn scan_roots_from(selected_folders: &HashSet<String>, path_input: &str) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = selected_folders.iter().map(PathBuf::from).collect();
    let custom = path_input.trim();
    if !custom.is_empty() {
        let custom_path = PathBuf::from(custom);
        if !roots.iter().any(|root| root == &custom_path) {
            roots.push(custom_path);
        }
    }
    roots.sort();
    roots.dedup();
    roots
}

fn initial_cached_results(roots: &[PathBuf]) -> (Vec<scanner::PluginInfo>, String) {
    if roots.is_empty() {
        return (Vec::new(), String::new());
    }

    let plugins = scanner::load_cached_plugins(roots);
    if plugins.is_empty() {
        return (Vec::new(), String::new());
    }

    let valid = plugins.iter().filter(|p| p.is_valid).count();
    let status = format!(
        "Loaded {} plugin(s) from cache ({valid} valid). Click Scan to refresh.",
        plugins.len()
    );
    (plugins, status)
}

impl App {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        egui_extras::install_image_loaders(&cc.egui_ctx);
        theme::apply(&cc.egui_ctx);
        let config = Config::load();
        let path_input = config.scan_path;
        let selected_folders: HashSet<String> = config.selected_folders.into_iter().collect();
        let roots = scan_roots_from(&selected_folders, &path_input);
        let (scan_results, status) = initial_cached_results(&roots);
        Self {
            current_page: Page::default(),
            path_input,
            selected_folders,
            scan_results,
            plugin_row_heights: Vec::new(),
            filter_vendors: HashSet::new(),
            filter_categories: HashSet::new(),
            status,
            scan_log: Vec::new(),
            scanning: false,
            scan_rx: None,
        }
    }

    pub(crate) fn persist_path(&self) {
        let mut selected_folders: Vec<String> = self.selected_folders.iter().cloned().collect();
        selected_folders.sort();
        Config {
            scan_path: self.path_input.clone(),
            selected_folders,
        }
        .save();
    }

    pub(crate) fn scan_roots(&self) -> Vec<PathBuf> {
        scan_roots_from(&self.selected_folders, &self.path_input)
    }

    fn poll_scan(&mut self, ctx: &egui::Context) {
        let Some(rx) = &self.scan_rx else {
            return;
        };

        let mut finished = false;
        while let Ok(msg) = rx.try_recv() {
            match msg {
                ScanMsg::Log(line) => self.scan_log.push(line),
                ScanMsg::Done(result) => {
                    finished = true;
                    self.scanning = false;
                    match result {
                        Ok(report) => {
                            self.scan_results = report.plugins;
                            self.plugin_row_heights.clear();
                            prune_vendor_filter(
                                &mut self.filter_vendors,
                                &self.scan_results,
                            );
                            prune_category_filter(
                                &mut self.filter_categories,
                                &self.scan_results,
                            );
                            self.status = format!(
                                "Scanned — {} valid / {} total ({} cached, {} shard(s))",
                                report.valid,
                                report.total,
                                report.from_cache,
                                report.shards_scanned
                            );
                        }
                        Err(err) => self.status = err,
                    }
                }
            }
        }

        if finished {
            self.scan_rx = None;
        } else if self.scanning {
            ctx.request_repaint();
        }
    }

    pub(crate) fn clear_plugins(&mut self) {
        if self.scanning {
            return;
        }
        match scanner::clear_plugin_cache() {
            Ok(()) => {
                self.scan_results.clear();
                self.plugin_row_heights.clear();
                self.filter_vendors.clear();
                self.filter_categories.clear();
                self.scan_log.clear();
                self.status = "Plugin cache cleared.".into();
            }
            Err(err) => self.status = err,
        }
    }

    pub(crate) fn start_scan(&mut self) {
        if self.scanning {
            return;
        }

        self.persist_path();
        self.scan_log.clear();

        let roots: Vec<PathBuf> = self
            .scan_roots()
            .into_iter()
            .filter(|root| root.is_dir())
            .collect();
        if roots.is_empty() {
            self.status =
                "Select common plugin folders or set a custom folder in Settings first.".into();
            return;
        }

        let (tx, rx) = mpsc::channel();
        self.scan_rx = Some(rx);
        self.scanning = true;
        let folder_count = roots.len();
        self.status = format!("Scanning {folder_count} folder(s)…");

        thread::spawn(move || {
            let (log_tx, log_rx) = mpsc::channel();
            let ui_tx = tx.clone();
            let _log_forwarder = thread::spawn(move || {
                while let Ok(line) = log_rx.recv() {
                    let _ = ui_tx.send(ScanMsg::Log(line));
                }
            });

            let result = scanner::scan_directories_with_sender(&roots, log_tx);
            let _ = tx.send(ScanMsg::Done(result));
        });
    }

    fn show_header(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            ui.add(
                egui::Image::new(egui::include_image!("../assets/logo.png"))
                    .fit_to_exact_size(egui::vec2(180.0, 36.0)),
            );
            ui.add_space(48.0);
            if theme::nav_tab(ui, "Library", self.current_page == Page::Library).clicked() {
                self.current_page = Page::Library;
            }
            ui.add_space(24.0);
            if theme::nav_tab(ui, "Settings", self.current_page == Page::Settings).clicked() {
                self.current_page = Page::Settings;
            }
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Min), |ui| {
                if theme::button::mint(ui, "Dev blog").clicked() {
                    open::that("https://www.vstmanager.com/blog").unwrap();
                };
                if theme::button::outline(ui, &format!("v{}", env!("CARGO_PKG_VERSION"))).clicked()
                {
                    open::that("https://www.vstmanager.com").unwrap();
                };
            });
        });
    }
}

impl eframe::App for App {
    fn clear_color(&self, visuals: &egui::Visuals) -> [f32; 4] {
        visuals.window_fill().to_normalized_gamma_f32()
    }

    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        let ctx = ui.ctx().clone();
        self.poll_scan(&ctx);

        egui::Frame::new().inner_margin(32).show(ui, |ui| {
            egui::Panel::top("header_panel")
                .show_separator_line(false)
                .frame(theme::group_frame(ui.style()))
                .show_inside(ui, |ui| self.show_header(ui));
            ui.add(egui::Separator::default().spacing(48.0));
            egui::CentralPanel::default()
                .frame(theme::group_frame(ui.style()))
                .show_inside(ui, |ui| match self.current_page {
                    Page::Library => pages::library::show(self, ui),
                    Page::Settings => pages::settings::show(self, ui),
                });
        });
    }

    fn on_exit(&mut self) {
        self.persist_path();
    }
}
