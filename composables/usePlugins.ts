interface Plugin {
  id: string;
  name: string;
  path: string;
  manufacturer: string;
  url: string;
  image: string;
  version: string;
  categories: string[];
  key: string;
  date_scanned: string;
  last_updated: string;
  sdkVersion: string;
}

interface PluginStats {
  total: number;
  byType: Record<string, number>;
  byManufacturer: Record<string, number>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  query?: string;
}

export const usePlugins = () => {
  const plugins = ref<Plugin[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all plugins
  const fetchPlugins = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<Plugin[]>>("/api/plugins");
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

  // Get plugin by ID
  const getPlugin = async (id: string): Promise<Plugin | null> => {
    try {
      const response = await $fetch<ApiResponse<Plugin>>(`/api/plugins/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error("Error fetching plugin:", err);
      return null;
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

  // Import plugins from JSON
  const importPlugins = async (): Promise<{
    success: boolean;
    count?: number;
    message?: string;
  }> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<null>>("/api/plugins/import", {
        method: "POST",
      });
      if (response.success) {
        // Refresh the plugins list after import
        await fetchPlugins();
        return {
          success: true,
          count: response.count,
          message: response.message,
        };
      } else {
        throw new Error("Failed to import plugins");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to import plugins";
      console.error("Error importing plugins:", err);
      return { success: false, message: error.value || undefined };
    } finally {
      loading.value = false;
    }
  };

  // Update plugin
  const updatePlugin = async (id: string, updates: Partial<Plugin>): Promise<{ success: boolean; data?: Plugin; message?: string }> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<Plugin>>(`/api/plugins/${id}`, {
        method: "PUT",
        body: updates,
      });

      if (response.success && response.data) {
        // Update the local plugins array
        const index = plugins.value.findIndex((p) => p.id === id);
        if (index !== -1) {
          plugins.value[index] = { ...plugins.value[index], ...updates };
        }

        return {
          success: true,
          data: response.data,
          message: response.message,
        };
      } else {
        throw new Error("Failed to update plugin");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update plugin";
      console.error("Error updating plugin:", err);
      return { success: false, message: error.value || undefined };
    } finally {
      loading.value = false;
    }
  };

  // Delete plugin
  const deletePlugin = async (id: string): Promise<{ success: boolean; message?: string }> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<null>>(`/api/plugins/${id}`, {
        method: "DELETE",
      });

      if (response.success) {
        // Remove the plugin from the local array
        const index = plugins.value.findIndex((p) => p.id === id);
        if (index !== -1) {
          plugins.value.splice(index, 1);
        }

        return {
          success: true,
          message: response.message,
        };
      } else {
        throw new Error("Failed to delete plugin");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete plugin";
      console.error("Error deleting plugin:", err);
      return { success: false, message: error.value || undefined };
    } finally {
      loading.value = false;
    }
  };

  // Delete all plugins
  const deleteAllPlugins = async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<null>>("/api/plugins/delete-all", {
        method: "POST",
      });

      if (response.success) {
        // Clear the local plugins array
        plugins.value = [];

        return {
          success: true,
          message: response.message,
        };
      } else {
        throw new Error("Failed to delete all plugins");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete all plugins";
      console.error("Error deleting all plugins:", err);
      return { success: false, message: error.value || undefined };
    } finally {
      loading.value = false;
    }
  };

  // Get database statistics
  const getStats = async (): Promise<PluginStats | null> => {
    try {
      const response = await $fetch<ApiResponse<PluginStats>>("/api/plugins/stats");
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      return null;
    }
  };

  return {
    plugins: readonly(plugins),
    loading: readonly(loading),
    error: readonly(error),
    fetchPlugins,
    getPlugin,
    searchPlugins,
    importPlugins,
    updatePlugin,
    deletePlugin,
    deleteAllPlugins,
    getStats,
  };
};
