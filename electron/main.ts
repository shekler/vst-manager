import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DIST = path.join(__dirname, "../.output/public");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../.output/public");

const VITE_DEV_SERVER_URL = "http://localhost:3000";

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			// preload: path.join(__dirname, "preload.js"),
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
