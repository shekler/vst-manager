const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const fs = require("fs");

function isProduction() {
  return app.isPackaged;
}

let mainWindow;
let server;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, "public/icon.png"),
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*; font-src 'self' data:;"],
      },
    });
  });

  // Load the app
  if (isProduction()) {
    // Find the build output folder
    let distPath;
    const possiblePaths = [path.join(process.resourcesPath, ".output/public"), path.join(process.resourcesPath, "dist"), path.join(__dirname, "../.output/public"), path.join(__dirname, ".output/public"), path.join(__dirname, "../dist"), path.join(__dirname, "dist")];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(path.join(testPath, "index.html"))) {
        distPath = testPath;
        break;
      }
    }

    if (!distPath) {
      console.error("Could not find dist folder in any expected location");
      console.log("Searched paths:", possiblePaths);
      return;
    }

    console.log("Serving static files from:", distPath);

    // Create express server to serve static files
    const expressApp = express();

    // Serve static files from the dist path at root
    expressApp.use("/", express.static(distPath));

    // Handle SPA routing - serve index.html for all routes
    expressApp.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    server = expressApp.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      console.log(`Static server running on port ${port}`);
      mainWindow.loadURL(`http://127.0.0.1:${port}`);
    });

    server.on("error", (err) => {
      console.error("Server error:", err);
    });
  } else {
    // In development, load from dev server
    console.log("Loading development app from localhost:3000");
    mainWindow.loadURL("http://localhost:3000");
  }

  // Handle window closed event
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Optional: Open DevTools in development
  if (!isProduction()) {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS, re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (server) {
    server.close();
  }
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    console.log("Blocked new window creation to:", navigationUrl);
  });
});
