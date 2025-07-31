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

// Squirrel event handler with loading screen
function handleSquirrelEvent(): boolean {
  if (process.argv.length < 3) {
    return false;
  }

  const ChildProcess = require("child_process");
  const pathModule = require("path");

  const appFolder = pathModule.resolve(process.execPath, "..");
  const rootAtomFolder = pathModule.resolve(appFolder, "..");
  const updateDotExe = pathModule.resolve(pathModule.join(rootAtomFolder, "Update.exe"));
  const exeName = pathModule.basename(process.execPath);

  const spawn = function (command: string, args: string[]) {
    let spawnedProcess;
    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch (error) {
      console.error("Spawn error:", error);
    }
    return spawnedProcess;
  };

  const spawnUpdate = function (args: string[]) {
    // In development mode, Update.exe won't exist, so we'll mock it
    const fsModule = require("fs");
    if (!fsModule.existsSync(updateDotExe)) {
      console.log(`Mock spawnUpdate: ${args.join(" ")}`);
      return null;
    }
    return spawn(updateDotExe, args);
  };

  // Create loading window for installation events
  const createLoadingWindow = (message: string) => {
    const loadingWindow = new BrowserWindow({
      width: 400,
      height: 200,
      center: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      alwaysOnTop: true,
      frame: false,
      backgroundColor: "#2c3e50",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Check if pre-rendered Vue loading screen exists
    const loadingScreenPath = path.join(__dirname, "loading-screens", `${message.toLowerCase().replace(/\s+/g, "-").replace(/[.]/g, "")}.html`);
    const fsModule = require("fs");

    if (fsModule.existsSync(loadingScreenPath)) {
      // Load pre-rendered Vue component
      loadingWindow.loadFile(loadingScreenPath);
    } else {
      // Fallback to simple HTML (current implementation)
      const loadingHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 160px;
              text-align: center;
            }
            .spinner {
              border: 3px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 3px solid white;
              width: 30px;
              height: 30px;
              animation: spin 1s linear infinite;
              margin-bottom: 15px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h2 { margin: 0 0 10px 0; font-size: 18px; }
            p { margin: 0; opacity: 0.8; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>VST Manager</h2>
          <p>${message}</p>
        </body>
        </html>
      `;

      loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);
    }

    return loadingWindow;
  };

  const squirrelEvent = process.argv[2];
  switch (squirrelEvent) {
    case "--squirrel-install":
      console.log("Squirrel: Installing...");

      app.whenReady().then(() => {
        const installWindow = createLoadingWindow("Installing VST Manager...");
        spawnUpdate(["--createShortcut", exeName]);

        setTimeout(
          () => {
            installWindow.close();
            app.quit();
          },
          process.env.NODE_ENV === "development" ? 1000 : 2000,
        );
      });
      return true;

    case "--squirrel-updated":
      console.log("Squirrel: Updating...");

      app.whenReady().then(() => {
        const updateWindow = createLoadingWindow("Updating VST Manager...");
        spawnUpdate(["--createShortcut", exeName]);

        setTimeout(
          () => {
            updateWindow.close();
            app.quit();
          },
          process.env.NODE_ENV === "development" ? 1000 : 2000,
        );
      });
      return true;

    case "--squirrel-uninstall":
      console.log("Squirrel: Uninstalling...");

      app.whenReady().then(() => {
        const uninstallWindow = createLoadingWindow("Uninstalling VST Manager...");
        spawnUpdate(["--removeShortcut", exeName]);

        setTimeout(
          () => {
            uninstallWindow.close();
            app.quit();
          },
          process.env.NODE_ENV === "development" ? 1000 : 2000,
        );
      });
      return true;

    case "--squirrel-obsolete":
      console.log("Squirrel: Cleaning up old version...");
      app.quit();
      return true;

    case "--squirrel-firstrun":
      console.log("Squirrel: First run after installation");
      // Don't quit - let the app run normally but you could show a welcome screen
      return false;
  }

  return false;
}

// Handle Squirrel events BEFORE any other app logic
const isSquirrelEvent = handleSquirrelEvent();

// Only continue with normal app startup if no Squirrel event was detected
if (!isSquirrelEvent) {
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
      icon: path.join(__dirname, "public", "icon.png"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: process.env.NODE_ENV === "development" ? path.join(__dirname, "preload.js") : path.join(__dirname, "preload.js"),
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
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
} // End of normal app startup conditional
