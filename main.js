const { app, BrowserWindow } = require("electron");
const path = require("path");

function isProduction() {
  return app.isPackaged;
}

let mainWindow;

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
    // Load static files directly - no server needed!
    const distPath = path.join(process.resourcesPath, "dist", "index.html");
    console.log("Loading static app from:", distPath);

    // Check if the file exists for debugging
    const fs = require("fs");
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      console.error("Dist file not found:", distPath);
      // Fallback - try alternative paths
      const altPath = path.join(__dirname, "../dist/index.html");
      console.log("Trying alternative path:", altPath);
      if (fs.existsSync(altPath)) {
        mainWindow.loadFile(altPath);
      } else {
        console.error("No dist files found!");
      }
    }
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

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    console.log("Blocked new window creation to:", navigationUrl);
  });
});
