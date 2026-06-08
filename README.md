# VST Manager

Desktop app (Rust + egui) that scans a folder for **WAV** and **MP3** files. Pick or type a directory path, save it between sessions, and list matching audio files recursively.

## Features

- Text field for folder path (typed or pasted)
- **Browse…** — native folder picker
- **Scan** — walks all subfolders and finds `.wav` / `.mp3` (case-insensitive)
- Scrollable list of full file paths
- Path persisted automatically (on edit, browse, scan, and app exit)

## Requirements

- [Rust](https://rustup.rs/) (stable toolchain via rustup)
- **Windows:** [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **Desktop development with C++** workload (needed to compile native GUI dependencies on first build)

## Run on Windows

From the project root:

```powershell
cargo run
```

First build downloads dependencies and may take several minutes. Later runs are faster.

## Release build

```powershell
cargo build --release
```

Run the executable:

```powershell
.\target\release\vst-manager.exe
```

In debug builds, a console window may appear for logging. Release builds hide the extra console window on Windows.

## Usage

1. Enter a folder path (e.g. `C:\Users\You\Music`) or click **Browse…**
2. Click **Scan**
3. Matching files appear in the list; the status line shows how many were found

If the path is empty, missing, or not a directory, the status line explains the problem.

## Saved settings

The last folder path is stored as JSON:

| OS      | Location |
|---------|----------|
| Windows | `%APPDATA%\vst-manager\vst-manager\config\config.json` |
| Linux   | `~/.config/vst-manager/vst-manager/config.json` |
| macOS   | `~/Library/Application Support/vst-manager/vst-manager/config.json` |

Example:

```json
{
  "scan_path": "C:\\Users\\You\\Music"
}
```

## Project layout

```
vst-manager/
├── Cargo.toml      # Dependencies and package metadata
├── src/
│   └── main.rs     # App entry, config, scan logic, UI
├── README.md       # Install, usage, config paths
└── CODE.md         # In-depth code and Rust concepts walkthrough
```

## Dependencies

| Crate | Role |
|-------|------|
| [eframe](https://github.com/emilk/egui) / [egui](https://github.com/emilk/egui) | Native window and immediate-mode UI |
| [rfd](https://github.com/ryanhaining/rfd) | Native file/folder dialogs |
| [walkdir](https://github.com/BurntSushi/walkdir) | Recursive directory traversal |
| [serde](https://serde.rs/) / [serde_json](https://github.com/serde-rs/json) | Load/save `config.json` |
| [directories](https://github.com/soc/directories-rs) | OS-appropriate config directory paths |

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
