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
  if (isElectron && app && app.getAppPath) {
    try {
      const appPath = app.getAppPath();
      console.log("App path:", appPath);
      console.log("Resources path:", process.resourcesPath);
      console.log("Is Electron:", isElectron);

      // Try multiple potential locations for the scanner
      const potentialPaths = [
        path.join(process.resourcesPath, "vst_scanner.exe"), // extraResource location (most reliable)
        path.join(path.dirname(appPath), "vst_scanner.exe"), // App root directory (alongside main executable)
        path.join(process.resourcesPath, "..", "vst_scanner.exe"), // Resources parent directory
        path.join(appPath + ".unpacked", "tools", "vst_scanner.exe"), // Standard asar unpacked location
        path.join(appPath, "tools", "vst_scanner.exe"), // Direct in app path
        path.join(process.resourcesPath, "app.asar.unpacked", "tools", "vst_scanner.exe"), // Resources path
        path.join(process.resourcesPath, "tools", "vst_scanner.exe"), // Direct in resources
        path.join(process.cwd(), "tools", "vst_scanner.exe"), // Current working directory
      ];

      // Check each potential path
      for (const potentialPath of potentialPaths) {
        try {
          const fs = require("fs");
          fs.accessSync(potentialPath, fs.constants.F_OK);
          console.log("Found scanner at:", potentialPath);
          return potentialPath;
        } catch (error) {
          console.log("Scanner not found at:", potentialPath);
        }
      }

      // If none found, return the first option as fallback
      console.log("Scanner not found in any location, using fallback");
      return potentialPaths[0];
    } catch (error) {
      console.error("Error getting app path:", error);
      // Fallback to current working directory
      return path.join(process.cwd(), "tools", "vst_scanner.exe");
    }
  } else {
    // Fallback - use current working directory
    return path.join(process.cwd(), "tools", "vst_scanner.exe");
  }
};
