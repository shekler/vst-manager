interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const useSettings = () => {
  const settings = ref<Setting[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all settings
  const fetchSettings = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<Setting[]>>("/api/settings");
      if (response.success && response.data) {
        settings.value = response.data;
      } else {
        throw new Error("Failed to fetch settings");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to fetch settings";
      console.error("Error fetching settings:", err);
    } finally {
      loading.value = false;
    }
  };

  // Get setting by key
  const getSetting = async (key: string): Promise<Setting | null> => {
    try {
      const response = await $fetch<ApiResponse<Setting>>(`/api/settings/${key}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error("Error fetching setting:", err);
      return null;
    }
  };

  // Update setting
  const updateSetting = async (key: string, value: string): Promise<{ success: boolean; data?: Setting; message?: string }> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<Setting>>(`/api/settings/${key}`, {
        method: "PUT",
        body: { value },
      });

      if (response.success && response.data) {
        // Update the local settings array
        const index = settings.value.findIndex((s) => s.key === key);
        if (index !== -1) {
          settings.value[index] = response.data;
        }

        return {
          success: true,
          data: response.data,
          message: response.message,
        };
      } else {
        throw new Error("Failed to update setting");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update setting";
      console.error("Error updating setting:", err);
      return { success: false, message: error.value || undefined };
    } finally {
      loading.value = false;
    }
  };

  // Get setting value by key (from local state)
  const getSettingValue = (key: string): string => {
    const setting = settings.value.find((s) => s.key === key);
    return setting?.value || "";
  };

  // Get setting description by key (from local state)
  const getSettingDescription = (key: string): string => {
    const setting = settings.value.find((s) => s.key === key);
    return setting?.description || "";
  };

  // Validate paths
  const validatePaths = async (paths: string[]): Promise<Array<{ path: string; exists: boolean; error?: string }>> => {
    try {
      const response = await $fetch<ApiResponse<Array<{ path: string; exists: boolean; error?: string }>>>("/api/settings/validate-paths", {
        method: "POST",
        body: { paths },
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error("Failed to validate paths");
      }
    } catch (err: any) {
      console.error("Error validating paths:", err);
      return paths.map((path) => ({ path, exists: false, error: err.message || "Validation failed" }));
    }
  };

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    fetchSettings,
    getSetting,
    updateSetting,
    getSettingValue,
    getSettingDescription,
    validatePaths,
  };
};
