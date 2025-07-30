export const useElectron = () => {
  // Check if we're running in Electron with better detection
  const isElectron = process.client && typeof window !== "undefined" && window.electronAPI && typeof window.electronAPI.getPlugins === "function";

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
        console.log("Calling Electron IPC getPlugins...");
        const result = await window.electronAPI.getPlugins();
        console.log("Electron IPC getPlugins result:", result);
        return result;
      } catch (error) {
        console.error("Failed to get plugins via Electron IPC:", error);
        throw error;
      }
    } else {
      // Fallback to HTTP API for development
      console.log("Falling back to HTTP API for getPlugins...");
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

  // Settings operations
  const getSettings = async () => {
    if (isElectron && window.electronAPI?.getSettings) {
      try {
        return await window.electronAPI.getSettings();
      } catch (error) {
        console.error("Failed to get settings:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch("/api/settings");
    }
  };

  const getSetting = async (key: string) => {
    if (isElectron && window.electronAPI?.getSetting) {
      try {
        return await window.electronAPI.getSetting(key);
      } catch (error) {
        console.error("Failed to get setting:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch(`/api/settings/${key}`);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    if (isElectron && window.electronAPI?.updateSetting) {
      try {
        return await window.electronAPI.updateSetting(key, value);
      } catch (error) {
        console.error("Failed to update setting:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch(`/api/settings/${key}`, {
        method: "PUT",
        body: { value },
      });
    }
  };

  const validatePaths = async (paths: string[]) => {
    if (isElectron && window.electronAPI?.validatePaths) {
      try {
        return await window.electronAPI.validatePaths(paths);
      } catch (error) {
        console.error("Failed to validate paths:", error);
        throw error;
      }
    } else {
      // Fallback for web version - use HTTP API
      return await $fetch("/api/settings/validate-paths", {
        method: "POST",
        body: { paths },
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
    getSettings,
    getSetting,
    updateSetting,
    validatePaths,
  };
};
