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
  // Use Nuxt's useState for better state management
  const plugins = useState<Plugin[]>("plugins", () => []);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const updateQueue = ref<Map<string, Promise<any>>>(new Map());

  // Fetch all plugins
  const fetchPlugins = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = (await $fetch("/api")) as ApiResponse<Plugin[]>;
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
      const response = (await $fetch(`/api/plugins/${id}`)) as ApiResponse<Plugin>;
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
      const response = (await $fetch(`/api/plugins/search?q=${encodeURIComponent(query)}`)) as ApiResponse<Plugin[]>;
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
      const response = (await $fetch("/api/plugins/import", {
        method: "POST",
      })) as ApiResponse<null>;
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

  // Update plugin with optimistic updates
  const updatePlugin = async (id: string, updates: Partial<Plugin>): Promise<{ success: boolean; data?: Plugin; message?: string }> => {
    // Optimistic update - immediately update the UI
    const index = plugins.value.findIndex((p) => p.id === id);
    if (index !== -1) {
      const originalPlugin = { ...plugins.value[index] };
      plugins.value[index] = { ...plugins.value[index], ...updates };

      // Background database write
      (
        $fetch(`/api/plugins/${id}`, {
          method: "PUT",
          body: updates,
        }) as Promise<ApiResponse<Plugin>>
      )
        .then((response) => {
          if (response.success && response.data) {
            // Update with server response to ensure consistency
            plugins.value[index] = response.data;
          } else {
            // Revert on failure
            plugins.value[index] = originalPlugin;
            console.error("Failed to update plugin in database");
          }
        })
        .catch((err) => {
          // Revert on error
          plugins.value[index] = originalPlugin;
          console.error("Error updating plugin in database:", err);
        });

      return {
        success: true,
        data: plugins.value[index],
        message: "Plugin updated successfully",
      };
    }

    return {
      success: false,
      message: "Plugin not found",
    };
  };

  // Optimistic update for plugin keys (immediate UI update, background DB write)
  const updatePluginKey = async (id: string, key: string): Promise<{ success: boolean; message?: string }> => {
    const plugin = plugins.value.find((p) => p.id === id);
    if (!plugin) {
      return { success: false, message: "Plugin not found" };
    }

    // Store original value for potential rollback
    const originalKey = plugin.key;

    // Optimistic update - immediately update UI
    plugin.key = key;
    plugin.last_updated = new Date().toISOString().split("T")[0];

    // Background database write
    const updatePromise = $fetch<ApiResponse<Plugin>>(`/api/plugins/${id}`, {
      method: "PUT",
      body: { key, last_updated: plugin.last_updated },
    })
      .then((response) => {
        if (response.success && response.data) {
          // Update with server response to ensure consistency
          Object.assign(plugin, response.data);
          console.log("Plugin key saved to database successfully");
        } else {
          // Revert on failure
          plugin.key = originalKey;
          plugin.last_updated = new Date(originalKey ? plugin.date_scanned : Date.now()).toISOString().split("T")[0];
          console.error("Failed to save plugin key to database");
          throw new Error("Database update failed");
        }
      })
      .catch((err) => {
        // Revert on error
        plugin.key = originalKey;
        plugin.last_updated = new Date(originalKey ? plugin.date_scanned : Date.now()).toISOString().split("T")[0];
        console.error("Error saving plugin key to database:", err);
        throw err;
      })
      .finally(() => {
        // Remove from update queue
        updateQueue.value.delete(id);
      });

    // Track the update promise
    updateQueue.value.set(id, updatePromise);

    return { success: true, message: "Plugin key updated" };
  };

  // Check if a plugin is currently being updated
  const isPluginUpdating = (id: string): boolean => {
    return updateQueue.value.has(id);
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
    updatePluginKey,
    isPluginUpdating,
    deletePlugin,
    deleteAllPlugins,
    getStats,
  };
};
