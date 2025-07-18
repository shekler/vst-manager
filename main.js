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
    },
    icon: path.join(__dirname, "public/icon.png"),
  });

  // Load the app
  if (isProduction()) {
    // In production, load from the packaged static files
    // The files are in the resources folder when packaged
    const indexPath = path.join(process.resourcesPath, ".output/public/index.html");
    console.log("Loading production app from:", indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    // In development, load from localhost
    console.log("Loading development app from localhost:3000");
    mainWindow.loadURL("http://localhost:3000");
  }

  // Handle window closed event properly
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// Quit when all windows are closed
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
