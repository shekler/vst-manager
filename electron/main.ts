const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

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
process.env.VITE_PUBLIC = process.env.DIST;

const VITE_DEV_SERVER_URL = "http://localhost:3000";

// Simple VST3 file scanning
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
            // Found a VST3 file - extract basic info
            const pluginInfo = extractBasicPluginInfo(fullPath, item);
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

function extractBasicPluginInfo(filePath: string, fileName: string) {
  try {
    // Extract just the file name without extension
    const name = path.parse(fileName).name;

    return {
      id: filePath,
      name: name,
      path: filePath,
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
    // Robust path resolution for packaged app
    const indexHtml = path.resolve(
      __dirname,
      "..",
      ".output",
      "public",
      "index.html",
    );
    win.loadFile(indexHtml);
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
