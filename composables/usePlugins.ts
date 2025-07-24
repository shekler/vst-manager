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

  // Fetch all plugins
  const fetchPlugins = async () => {
    // Prevent multiple simultaneous fetches
    if (loading.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<Plugin[]>>(`/api/plugins`);
      if (response.success && response.data) {
        plugins.value = response.data;
      } else {
        throw new Error("Failed to fetch plugins");
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
      const response = await $fetch<ApiResponse<Plugin[]>>(`/api/plugins/search?q=${encodeURIComponent(query)}`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err: any) {
      console.error("Error searching plugins:", err);
      return [];
    }
  };

  // Save plugin key
  const savePluginKey = async (pluginId: string, key: string): Promise<boolean> => {
    try {
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
