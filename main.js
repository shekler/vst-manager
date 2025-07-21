const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let mainWindow;
let frontProcess;

function isProduction() {
  // Check if the app is packaged (production) or running in development
  return app.isPackaged;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  const frontPath = getPath();
  frontProcess = spawn("node", [frontPath], {
    detached: true,
    stdio: "inherit",
  });
  mainWindow.loadURL("http://localhost:3000");
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function getPath() {
  if (!isProduction()) {
    return path.join(__dirname, "../", ".output", "server", "index.mjs");
  } else {
    return path.join(__dirname, "../../", ".output", "server", "index.mjs");
  }
}

app.whenReady().then(() => {
  createWindow();
});
