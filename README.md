# VST Manager

Desktop app (Rust + egui) that discovers and catalogs **VST / VST3** plugins on disk. Pick common install folders or a custom path, scan in the background, filter by vendor and category, and browse results in a scrollable grid.

Version: **0.3.0** · [vstmanager.com](https://www.vstmanager.com)

## Features

- **Library** — plugin grid with vendor / category filters, status line, and scan log
- **Settings** — toggle common VST/VST3/CLAP install locations; optional custom folder (typed or **Browse**)
- Background VST3 scan in Rust (`vst3-host`, isolated worker per plugin on Windows)
- Disk cache of plugin metadata (mtime-aware); startup can reload from cache
- Per-plugin actions: copy folder path, open folder in Explorer
- Path + selected folders persisted between sessions

## Requirements

- [Rust](https://rustup.rs/) (stable toolchain via rustup)
- **Windows** (primary target) — [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **Desktop development with C++** workload
- VST3 scanning lives under [`crates/scanner/vst3`](crates/scanner/vst3) (parity with [G:\\vst-scanner](G:/vst-scanner) C++ tool)

macOS folder presets exist in Settings; VST3 scan is exercised on Windows first.

## Run on Windows

From the project root:

```powershell
cargo run
```

First build downloads dependencies and may take several minutes. Later runs are faster.

Optional watch alias (needs `cargo-watch`):

```powershell
cargo dev
```

## Release build

```powershell
cargo build --release
```

Run:

```powershell
.\target\release\vst-manager.exe
```

For Windows scans, build the slim worker beside the app:

```powershell
cargo build -p vst_scanner
cargo build
```

Release builds should ship `vst_scanner.exe` next to `vst-manager.exe` (same folder). The GUI uses it for isolated per-plugin loads; without it, scans fall back to in-process timeouts.

## Usage

1. Open **Settings** — enable common plugin folders that exist on this machine, and/or set a custom folder
2. Open **Library** — click **Scan plugins**
3. Results appear in the grid; use sidebar filters (Vendor / Category)
4. **Clear plugins** wipes the on-disk cache and empties the library

Discovery walks `.vst3` bundles only (VST2 `.dll` deferred until a VST2 scanner exists). Junk paths such as `installerResources` and 32-bit `(x86)` VST3 on 64-bit Windows are skipped. VST3 metadata loads in-process via the Rust scanner (optional CLI: `vst_scanner.exe`).

If no valid folders are selected, the status line asks you to configure Settings first.

## Saved data

### Config

Last custom path and selected common folders:

| OS      | Location |
|---------|----------|
| Windows | `%APPDATA%\vst-manager\vst-manager\config\config.json` |
| Linux   | `~/.config/vst-manager/vst-manager/config.json` |
| macOS   | `~/Library/Application Support/vst-manager/vst-manager/config.json` |

Example:

```json
{
  "scan_path": "H:\\VSTPlugins",
  "selected_folders": [
    "C:\\Program Files\\Common Files\\VST3"
  ]
}
```

### Plugin cache

Scanned plugin metadata (invalidated when file mtime changes):

| OS      | Location |
|---------|----------|
| Windows | `%LOCALAPPDATA%\vst-manager\vst-manager\cache\plugin_cache.json` |
| Linux   | `~/.cache/vst-manager/vst-manager/plugin_cache.json` |
| macOS   | `~/Library/Caches/vst-manager/vst-manager/plugin_cache.json` |

### Scan reports (Markdown)

After each finished scan, the app writes a Markdown report (all plugins, warnings, errors):

| OS      | Location |
|---------|----------|
| Windows | `%LOCALAPPDATA%\vst-manager\vst-manager\cache\scan_reports\` |
| Linux   | `~/.cache/vst-manager/vst-manager/scan_reports/` |
| macOS   | `~/Library/Caches/vst-manager/vst-manager/scan_reports/` |

- `latest_scan_report.md` — overwritten each scan  
- `scan_<unix_ts>.md` — timestamped copy  

The scan log line `Scan report: …` shows the path; status bar after scan too.

## Project layout

```
vst-manager/
├── Cargo.toml
├── build.rs              # Embed Windows icon; rerun on scanner crates
├── crates/scanner/
│   ├── types/            # Shared ScanOutput / PluginInfo JSON types
│   └── vst3/             # VST3 scanner library + CLI (`vst_scanner.exe`)
├── assets/               # Icon, logo, fonts, UI icons
└── src/
    ├── main.rs           # Window bootstrap
    ├── app.rs            # App state, config, scan orchestration
    ├── pages/            # Library + Settings UI
    ├── scanner/          # Discover, cache, in-process VST3 scan
    └── theme/            # Colors, spacing, widgets
```

## Dependencies

| Crate | Role |
|-------|------|
| [eframe](https://github.com/emilk/egui) / [egui](https://github.com/emilk/egui) | Native window and immediate-mode UI |
| [egui_extras](https://github.com/emilk/egui) | Image loaders |
| [egui-thematic](https://crates.io/crates/egui-thematic) | Theming helpers |
| [rfd](https://github.com/ryanhaining/rfd) | Native folder dialog |
| [walkdir](https://github.com/BurntSushi/walkdir) | Recursive plugin path discovery |
| [serde](https://serde.rs/) / [serde_json](https://github.com/serde-rs/json) | Config + cache + scanner JSON |
| [directories](https://github.com/soc/directories-rs) | OS config / cache paths |
| [open](https://crates.io/crates/open) | Open folders / URLs |
| [imagesize](https://crates.io/crates/imagesize) | Image dimension helpers |
| [winresource](https://crates.io/crates/winresource) (build) | Embed Windows `.ico` |

## Development

```powershell
# Format
cargo fmt

# Check without running
cargo check

# Run
cargo run
```

## License

Not specified yet.
