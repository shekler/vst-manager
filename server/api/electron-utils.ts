import path from "path";

// Shared Electron utilities and detection logic

// Check if we're in Electron environment - more robust detection
export const isElectron = typeof process !== "undefined" && (process.type === "browser" || process.versions?.electron || process.env?.ELECTRON_IS_DEV);

// Conditionally import Electron modules
let electronApp: any;
let electronIpcMain: any;

if (isElectron) {
  try {
    const electron = require("electron");
    electronApp = electron.app;
    electronIpcMain = electron.ipcMain;
    console.log("Electron modules imported successfully");
  } catch (error) {
    console.log("Electron not available, running in web mode");
  }
} else {
  console.log("Not in Electron environment, running in web mode");
}

// Export the Electron modules for use in other files
export const app = electronApp;
export const ipcMain = electronIpcMain;

// Utility function to get the data directory path
export const getDataDir = () => {
  if (isElectron && app && app.getPath) {
    try {
      return path.join(app.getPath("userData"), "data");
    } catch (error) {
      console.error("Error getting user data path:", error);
      return "data";
    }
  } else {
    // Development mode or web mode - use local path
    return "data";
  }
};

// Utility function to get the database path
export const getDbPath = () => {
  return path.join(getDataDir(), "plugins.db");
};

// Utility function to get the scanned plugins JSON path
export const getScannedPluginsPath = () => {
  return path.join(getDataDir(), "scanned-plugins.json");
};

// Utility function to get the scanner path
export const getScannerPath = () => {
  // Always use the scanner from the project's tools directory
  return path.join(process.cwd(), "tools", "vst_scanner.exe");
};
