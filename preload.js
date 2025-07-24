const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File system operations
  openFileExplorer: (path) => ipcRenderer.invoke("open-file-explorer", path),

  // App information
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // API endpoint resolution
  getApiBaseUrl: () => ipcRenderer.invoke("get-api-base-url"),

  // Database operations (if needed)
  getDatabasePath: () => ipcRenderer.invoke("get-database-path"),
});
