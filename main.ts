import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { createServer } from "http";
import { createReadStream } from "fs";
import { extname } from "path";
import { setupVstIPC } from "./server/api/vst-operations";
import { setupPluginsIPC } from "./server/api/plugins-operations";
import { setupSettingsIPC } from "./server/api/settings-operations";

// Import database initialization
import { initializeDatabase } from "./server/api/database";

let mainWindow: BrowserWindow;
let staticServer: any;

// Simple static file server for production
const createStaticServer = (port: number = 3001) => {
  const publicPath = path.join(app.getAppPath(), ".output", "public");

  return createServer((req, res) => {
    if (!req.url) {
      res.writeHead(404);
      res.end();
      return;
    }

    let filePath = path.join(publicPath, req.url === "/" ? "index.html" : req.url);

    // Security check to prevent directory traversal
    if (!filePath.startsWith(publicPath)) {
      res.writeHead(403);
      res.end();
      return;
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end();
      return;
    }

    const ext = extname(filePath);
    const contentType =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
        ".eot": "application/vnd.ms-fontobject",
      }[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    createReadStream(filePath).pipe(res);
  }).listen(port);
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: process.env.NODE_ENV === "development" ? path.join(__dirname, "preload.js") : path.join(__dirname, "preload.js"),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, "public", "icon.png"),
  });

  // Set CSP headers for security
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:*;"],
      },
    });
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    // Start static server for production
    staticServer = createStaticServer(3001);
    mainWindow.loadURL("http://localhost:3001");
  }
};

// IPC handlers
ipcMain.handle("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle("window-close", () => {
  mainWindow?.close();
});

ipcMain.handle("dialog-open-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "All Files", extensions: ["*"] },
      { name: "Text Files", extensions: ["txt", "md"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("dialog-save-file", async (_event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: "Text Files", extensions: ["txt"] },
      { name: "JSON Files", extensions: ["json"] },
    ],
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
    return result.filePath;
  }
  return null;
});

ipcMain.handle("app-get-version", () => {
  return app.getVersion();
});

ipcMain.handle("app-get-platform", () => {
  return process.platform;
});

// Simple store implementation (you might want to use electron-store instead)
const store = new Map();

ipcMain.handle("store-get", (_event, key) => {
  return store.get(key);
});

ipcMain.handle("store-set", (_event, key, value) => {
  store.set(key, value);
});

app.whenReady().then(async () => {
  // Initialize database on app startup
  try {
    console.log("Initializing database on app startup...");
    await initializeDatabase();
    console.log("Database initialized successfully on startup");
  } catch (error) {
    console.error("Failed to initialize database on startup:", error);
    // Don't throw here - let the app continue even if database init fails
  }

  setupVstIPC();
  setupPluginsIPC();
  setupSettingsIPC();
  createWindow();
});

app.on("window-all-closed", () => {
  if (staticServer) {
    staticServer.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
