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
export const getDataDir = (): string => {
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
export const getScannerPath = (): string => {
  if (isElectron && app && app.getAppPath) {
    try {
      // In Electron app, use the app's directory
      const appPath = app.getAppPath();
      // Check if we're in development or production
      if (process.env.NODE_ENV === "development") {
        // Development: scanner is in the project root
        return path.join(appPath, "tools", "vst_scanner.exe");
      } else {
        // Production: scanner should be in the app's resources
        // Try multiple possible locations
        const possiblePaths = [path.join(appPath, "tools", "vst_scanner.exe"), path.join(appPath, "resources", "tools", "vst_scanner.exe"), path.join(process.resourcesPath || appPath, "tools", "vst_scanner.exe"), path.join(process.resourcesPath || appPath, "vst_scanner.exe")];

        // Return the first path that exists (we'll check existence in the permission function)
        return possiblePaths[0];
      }
    } catch (error) {
      console.error("Error getting scanner path in Electron:", error);
      // Fallback to development path
      return path.join(process.cwd(), "tools", "vst_scanner.exe");
    }
  } else {
    // Development mode or web mode - use local path
    return path.join(process.cwd(), "tools", "vst_scanner.exe");
  }
};
