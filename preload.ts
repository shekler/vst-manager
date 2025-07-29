import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),

  // File system operations
  openFile: () => ipcRenderer.invoke("dialog-open-file"),
  saveFile: (data: any) => ipcRenderer.invoke("dialog-save-file", data),

  // App info
  getVersion: () => ipcRenderer.invoke("app-get-version"),
  getPlatform: () => ipcRenderer.invoke("app-get-platform"),

  // Store/settings
  getStore: (key: string) => ipcRenderer.invoke("store-get", key),
  setStore: (key: string, value: any) => ipcRenderer.invoke("store-set", key, value),

  // VST operations
  exportPlugins: () => ipcRenderer.invoke("vst:exportPlugins"),
  importPlugins: (fileData: { name: string; content: string }) => ipcRenderer.invoke("vst:importPlugins", fileData),
  getPlugins: () => ipcRenderer.invoke("vst:getPlugins"),

  // Event listeners
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on("menu-action", (_event, action) => callback(action));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

export {};
