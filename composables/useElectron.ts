interface ElectronAPI {
  openFile: () => Promise<string | null>;
  getVersion: () => Promise<string>;
  exportPlugins: () => Promise<any>;
  importPlugins: (fileData: { name: string; content: string }) => Promise<any>;
  getPlugins: () => Promise<any>;
  scanPlugins: () => Promise<any>;
  deletePlugins: () => Promise<any>;
  downloadPlugins: () => Promise<any>;
  searchPlugins: (query: string) => Promise<any>;
  savePluginKey: (pluginId: string, key: string) => Promise<any>;
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

  const getPlugins = async () => {
    if (isElectron && window.electronAPI?.getPlugins) {
      try {
        return await window.electronAPI.getPlugins();
      } catch (error) {
        console.error("Failed to get plugins:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch("/api/plugins");
    }
  };

  const scanPlugins = async () => {
    if (isElectron && window.electronAPI?.scanPlugins) {
      try {
        return await window.electronAPI.scanPlugins();
      } catch (error) {
        console.error("Failed to scan plugins:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch("/api/vst/scan", { method: "POST" });
    }
  };

  const deletePlugins = async () => {
    if (isElectron && window.electronAPI?.deletePlugins) {
      try {
        return await window.electronAPI.deletePlugins();
      } catch (error) {
        console.error("Failed to delete plugins:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch("/api/vst/delete");
    }
  };

  const downloadPlugins = async () => {
    if (isElectron && window.electronAPI?.downloadPlugins) {
      try {
        return await window.electronAPI.downloadPlugins();
      } catch (error) {
        console.error("Failed to download plugins:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch("/api/vst/download");
    }
  };

  const searchPlugins = async (query: string) => {
    if (isElectron && window.electronAPI?.searchPlugins) {
      try {
        return await window.electronAPI.searchPlugins(query);
      } catch (error) {
        console.error("Failed to search plugins:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch(`/api/plugins/search?q=${encodeURIComponent(query)}`);
    }
  };

  const savePluginKey = async (pluginId: string, key: string) => {
    if (isElectron && window.electronAPI?.savePluginKey) {
      try {
        return await window.electronAPI.savePluginKey(pluginId, key);
      } catch (error) {
        console.error("Failed to save plugin key:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch(`/api/plugins/${pluginId}/key`, {
        method: "POST",
        body: { key },
      });
    }
  };

  return {
    isElectron,
    openFileExplorer,
    getAppVersion,
    exportPlugins,
    importPlugins,
    getPlugins,
    scanPlugins,
    deletePlugins,
    downloadPlugins,
    searchPlugins,
    savePluginKey,
  };
};
