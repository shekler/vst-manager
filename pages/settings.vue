<template>
  <div>
    <h1 class="text-4xl font-bold">Settings</h1>

    <!-- File Paths Section -->
    <div class="from-onyx to-onyx/50 mt-6 mb-4 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">File Paths</h2>
      <p class="text-powder/70 mb-6 text-sm">Configure the directories where VST plugins are located. Use commas (,) to separate multiple paths.</p>

      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="text-powder/50 text-lg">Loading settings...</div>
      </div>

      <!-- Settings Form -->
      <div v-else class="space-y-6">
        <!-- VST Paths -->
        <div class="flex flex-col gap-2">
          <label for="vst_paths" class="text-powder/70 text-sm font-bold">VST Plugin Paths</label>
          <textarea id="vst_paths" v-model="vstPaths" rows="3" placeholder="Enter VST plugin directories..." class="c-input c-input--search resize-none" />
          <div class="text-powder/50 text-xs">
            {{ getSettingDescription("vst_paths") }}
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex items-center gap-4">
          <button @click="saveSettings" :disabled="loading || !hasChanges" class="c-button c-button--mint">
            {{ loading ? "Saving..." : "Save Settings" }}
          </button>
          <button @click="resetToDefaults" :disabled="loading" class="c-button c-button--red">Reset to Defaults</button>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="text-sm" :class="messageType === 'success' ? 'text-mint' : 'text-red-400'">
          {{ message }}
        </div>
      </div>
    </div>

    <!-- Path Validation Section -->
    <div class="from-onyx to-onyx/50 mt-4 mb-8 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">Path Validation</h2>
      <p class="text-powder/70 mb-4 text-sm">Test if the configured paths exist and are accessible.</p>

      <div class="space-y-4">
        <div v-for="(validation, index) in pathValidations" :key="index" class="flex items-center gap-3">
          <div class="flex-1">
            <div class="text-powder/90 font-bold">{{ validation.name }}</div>
            <div class="text-powder/50 text-sm">{{ validation.path }}</div>
          </div>
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full" :class="validation.exists ? 'bg-mint' : 'bg-red-400'"></div>
            <span class="text-powder/70 text-sm">
              {{ validation.exists ? "Valid" : "Invalid" }}
            </span>
          </div>
        </div>
      </div>

      <button @click="validatePathsLocally" :disabled="loading" class="c-button c-button--clear mt-4">Validate Paths</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useSettings } from "~/composables/useSettings";

// Use the settings composable
const { settings, loading, error, fetchSettings, updateSetting, getSettingValue, getSettingDescription, validatePaths } = useSettings();

// Fetch settings on server-side to prevent hydration mismatches
await fetchSettings();

// Reactive state for form inputs
const vstPaths = ref("");
const vst3Paths = ref("");
const auPaths = ref("");
const message = ref("");
const messageType = ref<"success" | "error">("success");
const pathValidations = ref<Array<{ name: string; path: string; exists: boolean }>>([]);

// Check if any settings have changed
const hasChanges = computed(() => {
  return vstPaths.value !== getSettingValue("vst_paths") || vst3Paths.value !== getSettingValue("vst3_paths") || auPaths.value !== getSettingValue("au_paths");
});

// Save all settings
const saveSettings = async () => {
  if (!hasChanges.value) return;

  try {
    const results = await Promise.all([updateSetting("vst_paths", vstPaths.value), updateSetting("vst3_paths", vst3Paths.value), updateSetting("au_paths", auPaths.value)]);

    const hasErrors = results.some((result: any) => !result.success);

    if (hasErrors) {
      message.value = "Some settings failed to save";
      messageType.value = "error";
    } else {
      message.value = "Settings saved successfully";
      messageType.value = "success";
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      message.value = "";
    }, 3000);
  } catch (error) {
    message.value = "Failed to save settings";
    messageType.value = "error";
    console.error("Error saving settings:", error);
  }
};

// Reset to default values
const resetToDefaults = () => {
  vstPaths.value = "C:\\Program Files\\VSTPlugins,C:\\Program Files (x86)\\VSTPlugins";
  vst3Paths.value = "C:\\Program Files\\Common Files\\VST3,C:\\Program Files (x86)\\Common Files\\VST3";
  auPaths.value = "/Library/Audio/Plug-Ins/Components,/Library/Audio/Plug-Ins/VST";
};

// Validate paths using the API
const validatePathsLocally = async () => {
  try {
    // Split paths by comma and filter out empty strings
    const vstPathList = vstPaths.value.split(",").filter((p) => p.trim());

    const allPaths = [...vstPathList];

    if (allPaths.length === 0) {
      pathValidations.value = [];
      return;
    }

    const validations = await validatePaths(allPaths);

    pathValidations.value = [{ name: "VST Paths", path: vstPaths.value, exists: vstPathList.length > 0 && vstPathList.every((p) => validations.find((v: any) => v.path === p)?.exists) }];
  } catch (error) {
    console.error("Error validating paths:", error);
    pathValidations.value = [
      { name: "VST Paths", path: vstPaths.value, exists: false },
      { name: "VST3 Paths", path: vst3Paths.value, exists: false },
    ];
  }
};

// Initialize form with current settings
const initializeForm = () => {
  vstPaths.value = getSettingValue("vst_paths");
  vst3Paths.value = getSettingValue("vst3_paths");
  auPaths.value = getSettingValue("au_paths");
};

// Initialize form after settings are fetched
initializeForm();
</script>

<style></style>
