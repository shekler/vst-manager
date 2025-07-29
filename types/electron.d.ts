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
  getPlugins: () => Promise<{ success: boolean; data?: any[]; count?: number; error?: string }>;

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
