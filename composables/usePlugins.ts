interface Plugin {
  id: string;
  name: string;
  vendor: string;
  version: string;
  path: string;
  category: string;
  subCategories: string[];
  isValid: boolean;
  error: string | null;
  sdkVersion: string;
  cardinality: number;
  flags: number;
  cid: string;
  key?: string; // Add key field
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  query?: string;
}

export const usePlugins = () => {
  // Use Nuxt's useState for better state management with a stable key
  const plugins = useState<Plugin[]>("vst-manager-plugins", () => []);
  const loading = useState<boolean>("vst-manager-loading", () => false);
  const error = useState<string | null>("vst-manager-error", () => null);

  // Fetch all plugins using Electron IPC
  const fetchPlugins = async () => {
    // Prevent multiple simultaneous fetches
    if (loading.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      console.log("Fetching plugins via Electron IPC...");

      // Check if we're in Electron environment
      if (typeof window !== "undefined" && window.electronAPI) {
        // Use Electron IPC to get plugins from the database
        console.log("Using Electron IPC for plugin fetching");
        const { getPlugins } = useElectron();
        const response = await getPlugins();
        console.log("Electron API response:", response);
        if (response.success && response.data) {
          plugins.value = response.data;
          console.log(`Loaded ${response.data.length} plugins via Electron IPC`);
        } else {
          throw new Error(response.error || "Failed to fetch plugins");
        }
      } else {
        // Fallback to HTTP API for development
        console.log("Using HTTP API for plugin fetching");
        const response = await $fetch<ApiResponse<Plugin[]>>(`/api/plugins`);
        console.log("API response:", response);
        if (response.success && response.data) {
          plugins.value = response.data;
          console.log(`Loaded ${response.data.length} plugins`);
        } else {
          throw new Error("Failed to fetch plugins");
        }
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch plugins";
      console.error("Error fetching plugins:", err);
    } finally {
      loading.value = false;
    }
  };

  // Search plugins
  const searchPlugins = async (query: string): Promise<Plugin[]> => {
    try {
      // Check if we're in Electron environment
      if (typeof window !== "undefined" && window.electronAPI) {
        const { searchPlugins: searchPluginsIPC } = useElectron();
        const response = await searchPluginsIPC(query);
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      } else {
        // Fallback to HTTP API for development
        const response = await $fetch<ApiResponse<Plugin[]>>(`/api/plugins/search?q=${encodeURIComponent(query)}`);
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }
    } catch (err: any) {
      console.error("Error searching plugins:", err);
      return [];
    }
  };

  // Save plugin key
  const savePluginKey = async (pluginId: string, key: string): Promise<boolean> => {
    try {
      // Check if we're in Electron environment
      if (typeof window !== "undefined" && window.electronAPI) {
        const { savePluginKey: savePluginKeyIPC } = useElectron();
        const response = await savePluginKeyIPC(pluginId, key);

        if (response.success) {
          // Update the plugin in the local state
          const pluginIndex = plugins.value.findIndex((p) => p.id === pluginId);
          if (pluginIndex !== -1) {
            const currentPlugin = plugins.value[pluginIndex];
            plugins.value[pluginIndex] = {
              ...currentPlugin,
              key,
            } as Plugin;
          }
          return true;
        }
        return false;
      } else {
        // Fallback to HTTP API for development
        const response = await $fetch<ApiResponse<any>>(`/api/plugins/${pluginId}/key`, {
          method: "POST",
          body: { key },
        });

        if (response.success) {
          // Update the plugin in the local state
          const pluginIndex = plugins.value.findIndex((p) => p.id === pluginId);
          if (pluginIndex !== -1) {
            const currentPlugin = plugins.value[pluginIndex];
            plugins.value[pluginIndex] = {
              ...currentPlugin,
              key,
            } as Plugin;
          }
          return true;
        }
        return false;
      }
    } catch (err: any) {
      console.error("Error saving plugin key:", err);
      return false;
    }
  };

  return {
    plugins: readonly(plugins),
    loading: readonly(loading),
    error: readonly(error),
    fetchPlugins,
    searchPlugins,
    savePluginKey,
  };
};
