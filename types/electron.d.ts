interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;

  // File system operations
  openFile: () => Promise<string | null>;
  saveFile: (data: any) => Promise<string | null>;

  // App info
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;

  // Store/settings
  getStore: (key: string) => Promise<any>;
  setStore: (key: string, value: any) => Promise<void>;

  // VST operations
  exportPlugins: () => Promise<{ success: boolean; message?: string; filePath?: string; error?: string }>;
  importPlugins: (fileData: { name: string; content: string }) => Promise<{ success: boolean; message?: string; count?: number; error?: string }>;
  scanPlugins: () => Promise<any>;
  deletePlugins: () => Promise<any>;
  downloadPlugins: () => Promise<any>;
  checkPermissions: () => Promise<{ success: boolean; checks?: any; error?: string }>;

  // Plugins operations
  getPlugins: () => Promise<{ success: boolean; data?: any[]; count?: number; error?: string }>;
  searchPlugins: (query: string) => Promise<{ success: boolean; data?: any[]; count?: number; query?: string; error?: string }>;
  savePluginKey: (pluginId: string, key: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Settings operations
  getSettings: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getSetting: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateSetting: (key: string, value: string) => Promise<{ success: boolean; data?: any; message?: string; error?: string }>;
  validatePaths: (paths: string[]) => Promise<{ success: boolean; data?: Array<{ path: string; exists: boolean; error?: string }>; error?: string }>;

  // Event listeners
  onMenuAction: (callback: (action: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
