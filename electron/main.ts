// electron/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "node:url"; // <-- Import the helper
import vstScanner from "vst-scanner";
const { Scanner } = vstScanner;

// Recreate __dirname and __filename for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This is a basic setup from nuxt-electron
process.env.ROOT = path.join(__dirname, "..");
process.env.DIST = path.join(process.env.ROOT, "dist-electron");

let win: BrowserWindow | null;

function createWindow() {
	win = new BrowserWindow({
		webPreferences: {
			// The preload script is essential for the ipcRenderer bridge
			preload: path.join(__dirname, "preload.js"),
		},
	});

	const URL = process.env.VITE_DEV_SERVER_URL;
	win.loadURL(URL!);
}

app.on("ready", () => {
	createWindow();

	ipcMain.handle("scan-vsts", async () => {
		console.log("Received scan-vsts event from renderer.");
		const scanner = new Scanner();

		const result = await scanner.scan(
			{
				win32: ["C:\\Program Files\\Common Files\\VST3", "C:\\Program Files\\Steinberg\\VstPlugins"],
				darwin: ["/Library/Audio/Plug-Ins/VST", "/Library/Audio/Plug-Ins/VST3", "/Library/Audio/Plug-Ins/Components"],
			}[process.platform] ?? []
		);

		console.log(`Scan complete. Found ${result.vst3.length} VST3 plugins.`);
		return result;
	});
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
