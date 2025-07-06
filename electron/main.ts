const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── electron
// │ ├── main.js
// │ └── preload.js
// ├─┬─┬ .output
// │ │ └── public
// │ │   ├── ...
// │ │   └── index.html
// │ │

process.env.DIST = path.join(__dirname, "../.output/public");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../.output/public");

const VITE_DEV_SERVER_URL = "http://localhost:3000";

// VST3 scanning functionality
async function scanDirectoryForVst3(dirPath: string): Promise<any[]> {
	const plugins: any[] = [];

	try {
		// Check if directory exists
		if (!fs.existsSync(dirPath)) {
			return plugins;
		}

		// Recursively scan directory
		const scanRecursive = (currentPath: string): void => {
			try {
				const items = fs.readdirSync(currentPath);

				for (const item of items) {
					const fullPath = path.join(currentPath, item);
					const stat = fs.statSync(fullPath);

					if (stat.isDirectory()) {
						// Recursively scan subdirectories
						scanRecursive(fullPath);
					} else if (stat.isFile() && item.toLowerCase().endsWith(".vst3")) {
						// Found a VST3 file
						const pluginInfo = extractPluginInfo(fullPath, item);
						if (pluginInfo) {
							plugins.push(pluginInfo);
						}
					}
				}
			} catch (error) {
				console.warn(`Error scanning directory ${currentPath}:`, error);
			}
		};

		scanRecursive(dirPath);
	} catch (error) {
		console.error(`Error scanning directory ${dirPath}:`, error);
	}

	return plugins;
}

function extractPluginInfo(filePath: string, fileName: string) {
	try {
		// Extract basic information from the file
		const name = path.parse(fileName).name;

		// Try to extract vendor from path or filename
		let vendor = "Unknown";
		const pathParts = filePath.split(path.sep);

		// Look for common vendor patterns in the path
		for (let i = pathParts.length - 2; i >= 0; i--) {
			const part = pathParts[i];
			if (part && part !== "VST3" && part !== "Plug-Ins" && part !== "Audio") {
				vendor = part;
				break;
			}
		}

		// Determine bitness based on file size and location
		let bitness: "64-bit" | "32-bit" | "Unknown" = "Unknown";
		try {
			const stats = fs.statSync(filePath);
			// This is a rough heuristic - 64-bit plugins are typically larger
			// In a real implementation, you'd need to parse the actual binary
			bitness = stats.size > 1000000 ? "64-bit" : "32-bit";
		} catch {
			bitness = "Unknown";
		}

		return {
			id: filePath, // Use full path as unique ID
			name: name,
			vendor: vendor,
			format: "VST3" as const,
			bitness: bitness,
			path: filePath,
			tags: [], // Empty tags array for now
		};
	} catch (error) {
		console.error(`Error extracting plugin info from ${filePath}:`, error);
		return null;
	}
}

// IPC handlers
ipcMain.handle("scanDirectory", async (event: any, dirPath: string) => {
	try {
		const plugins = await scanDirectoryForVst3(dirPath);
		return plugins;
	} catch (error) {
		console.error("Error in scanDirectory handler:", error);
		throw error;
	}
});

ipcMain.handle("getPlatform", () => {
	return process.platform;
});

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false,
		},
	});

	if (app.isPackaged) {
		win.loadFile(path.join(process.env.DIST!, "index.html"));
	} else {
		win.loadURL(VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	}
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.whenReady().then(createWindow);
