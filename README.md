# VST Manager

Desktop app (Rust + egui) that discovers and catalogs **VST / VST3** plugins on disk. Pick common install folders or a custom path, scan in the background, filter by vendor and category, and browse results in a scrollable grid.

Version: **0.3.0** · [vstmanager.com](https://www.vstmanager.com)

## Features

- **Library** — plugin grid with vendor / category filters, status line, and scan log
- **Settings** — toggle common VST/VST3/CLAP install locations; optional custom folder (typed or **Browse**)
- Background scan via bundled `vst_scanner.exe` (UI stays responsive)
- Disk cache of plugin metadata (mtime-aware); startup can reload from cache
- Per-plugin actions: copy folder path, open folder in Explorer
- Path + selected folders persisted between sessions

## Requirements

- [Rust](https://rustup.rs/) (stable toolchain via rustup)
- **Windows** (primary target) — [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **Desktop development with C++** workload
- `tools/vst_scanner.exe` — native plugin scanner; `build.rs` copies it next to the app binary on build

macOS folder presets exist in Settings, but scanning depends on `vst_scanner.exe` (Windows).

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

`vst_scanner.exe` is copied beside the binary (`target\debug\` or `target\release\`). Debug builds may show a console for logging; release builds hide it on Windows.

## Usage

1. Open **Settings** — enable common plugin folders that exist on this machine, and/or set a custom folder
2. Open **Library** — click **Scan plugins**
3. Results appear in the grid; use sidebar filters (Vendor / Category)
4. **Clear plugins** wipes the on-disk cache and empties the library

Discovery looks for `.vst3` bundles (file or folder) and `.dll` under selected roots. Metadata (name, vendor, version, categories, etc.) comes from `vst_scanner.exe`.

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

## Project layout

```
vst-manager/
├── Cargo.toml
├── build.rs              # Embed icon; copy tools/vst_scanner.exe → target/
├── tools/
│   └── vst_scanner.exe   # External plugin scanner (required for Scan)
├── assets/               # Icon, logo, fonts, UI icons
└── src/
    ├── main.rs           # Window bootstrap
    ├── app.rs            # App state, config, scan orchestration
    ├── pages/            # Library + Settings UI
    ├── scanner/          # Discover, cache, invoke vst_scanner
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
