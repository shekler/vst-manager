const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Set Content Security Policy
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*; frame-src 'none'; object-src 'none';"],
      },
    });
  });

  // Load the app URL
  win.loadURL("http://localhost:3000");

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }
}

// IPC Handlers
ipcMain.handle("open-file-explorer", async (event, filePath) => {
  try {
    await shell.openPath(filePath);
  } catch (error) {
    console.error("Failed to open file explorer:", error);
  }
});

ipcMain.handle("get-app-version", async () => {
  return app.getVersion();
});

ipcMain.handle("get-api-base-url", async () => {
  // In development, return localhost:3000
  // In production, this would be the packaged app's API endpoint
  return "http://localhost:3000";
});

ipcMain.handle("get-database-path", async () => {
  return path.join(process.cwd(), "data", "plugins.db");
});

// Handle app lifecycle
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
