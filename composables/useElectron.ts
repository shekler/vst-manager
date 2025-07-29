interface ElectronAPI {
  openFile: () => Promise<string | null>;
  getVersion: () => Promise<string>;
  exportPlugins: () => Promise<any>;
  importPlugins: (fileData: { name: string; content: string }) => Promise<any>;
}

export const useElectron = () => {
  // Check if we're running in Electron
  const isElectron = process.client && window?.electronAPI;

  // Electron-specific functions
  const openFileExplorer = async (path: string) => {
    if (isElectron && window.electronAPI?.openFile) {
      try {
        await window.electronAPI.openFile();
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
    if (isElectron && window.electronAPI?.getVersion) {
      try {
        return await window.electronAPI.getVersion();
      } catch (error) {
        console.error("Failed to get app version:", error);
        return "Unknown";
      }
    }
    return "Web Version";
  };

  const exportPlugins = async () => {
    if (isElectron && window.electronAPI?.exportPlugins) {
      try {
        return await window.electronAPI.exportPlugins();
      } catch (error) {
        console.error("Failed to export plugins:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch("/api/vst/export");
    }
  };

  const importPlugins = async (fileData: { name: string; content: string }) => {
    if (isElectron && window.electronAPI?.importPlugins) {
      try {
        return await window.electronAPI.importPlugins(fileData);
      } catch (error) {
        console.error("Failed to import plugins:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      const formData = new FormData();
      const blob = new Blob([fileData.content], { type: "application/json" });
      const file = new File([blob], fileData.name, { type: "application/json" });
      formData.append("file", file);

      return await $fetch("/api/vst/import", {
        method: "POST",
        body: formData,
      });
    }
  };

  return {
    isElectron,
    openFileExplorer,
    getAppVersion,
    exportPlugins,
    importPlugins,
  };
};
