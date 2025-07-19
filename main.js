const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

function isProduction() {
  return app.isPackaged;
}

let mainWindow;
let frontProcess;

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
    const indexPath = path.join(process.resourcesPath, "index.html");
    console.log("Loading production app from:", indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    // In development, spawn the Nuxt dev server if not already running
    const nuxtPath = path.join(__dirname, "../node_modules/.bin/nuxt");
    const projectPath = path.join(__dirname, "../");

    frontProcess = spawn(nuxtPath, ["dev"], {
      cwd: projectPath,
      detached: true,
      stdio: "inherit",
    });

    // Wait a bit for the server to start, then load the app
    setTimeout(() => {
      console.log("Loading development app from localhost:3000");
      mainWindow.loadURL("http://localhost:3000");
    }, 2000);
  }

  // Handle window closed event properly
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // Kill the spawned process if it exists
  if (frontProcess) {
    frontProcess.kill();
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

// Handle app quit to clean up spawned processes
app.on("before-quit", () => {
  if (frontProcess) {
    frontProcess.kill();
  }
});
