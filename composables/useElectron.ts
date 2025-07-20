interface ElectronAPI {
  openFileExplorer: (path: string) => Promise<void>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const useElectron = () => {
  // Check if we're running in Electron
  const isElectron = process.client && window?.electronAPI;

  // Electron-specific functions
  const openFileExplorer = async (path: string) => {
    if (isElectron && window.electronAPI?.openFileExplorer) {
      try {
        await window.electronAPI.openFileExplorer(path);
      } catch (error) {
        console.error("Failed to open file explorer:", error);
      }
    } else {
      // Fallback for web version - copy path to clipboard
      await navigator.clipboard.writeText(path);
      // You could show a toast notification here
    }
  };

  const getAppVersion = async (): Promise<string> => {
    if (isElectron && window.electronAPI?.getAppVersion) {
      try {
        return await window.electronAPI.getAppVersion();
      } catch (error) {
        console.error("Failed to get app version:", error);
        return "Unknown";
      }
    }
    return "Web Version";
  };

  return {
    isElectron,
    openFileExplorer,
    getAppVersion,
  };
};
