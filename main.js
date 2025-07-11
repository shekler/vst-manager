const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

function isProduction() {
  return app.isPackaged;
}

let frontProcess;
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  // Start frontend
  const frontPath = getPath();
  frontProcess = spawn("node", [frontPath], {
    detached: true,
    stdio: "inherit",
  });
  mainWindow.loadURL("http://localhost:3000"); // or any other port defined
  // Handle window closed event properly
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

app.whenReady().then(createWindow);
