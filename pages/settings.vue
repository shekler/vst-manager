<template>
  <div>
    <h1 class="text-4xl font-bold">Settings</h1>

    <!-- File Paths Section -->
    <div class="from-onyx to-onyx/50 mt-6 mb-4 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">File Paths</h2>
      <p class="text-powder/70 mb-6 text-sm">Configure the directories where VST plugins are located. Use the "Browse" button to securely select directories, or manually enter paths separated by commas (,).</p>

      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="text-powder/50 text-lg">Loading settings...</div>
      </div>

      <!-- Settings Form -->
      <div v-else class="space-y-6">
        <!-- VST Paths -->
        <div class="flex flex-col gap-2">
          <label for="vst_paths" class="text-powder/70 text-sm font-bold">VST Plugin Paths</label>

          <!-- Path input with browse button -->
          <div class="flex gap-2">
            <textarea id="vst_paths" v-model="vstPaths" rows="3" placeholder="Enter VST plugin directories..." class="c-input c-input--search flex-1 resize-none" />
            <div class="flex flex-col gap-2">
              <button @click="browseForDirectory" :disabled="loading" class="c-button c-button--clear whitespace-nowrap">Browse...</button>
              <button @click="clearPaths" :disabled="loading || !vstPaths" class="c-button c-button--red text-xs">Clear</button>
            </div>
          </div>

          <div class="text-powder/50 text-xs">
            {{ getSettingDescription("vst_paths") }}
          </div>

          <!-- Selected Paths Display -->
          <div v-if="parsedPaths.length > 0" class="mt-2">
            <div class="text-powder/70 mb-2 text-xs font-semibold">Current Paths:</div>
            <div class="flex flex-col gap-1">
              <div v-for="(path, index) in parsedPaths" :key="index" class="bg-onyx/30 flex items-center justify-between rounded px-3 py-2 text-xs">
                <span class="text-powder/80 font-mono">{{ path }}</span>
                <button @click="removePath(index)" class="ml-2 text-red-400 hover:text-red-300" title="Remove this path">×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <button @click="saveSettings" :disabled="loading || !hasChanges" class="c-button c-button--mint">
              {{ loading ? "Saving..." : "Save Settings" }}
            </button>
            <button @click="validatePathsLocally" :disabled="loading || parsedPaths.length === 0" class="c-button c-button--clear">Validate Paths</button>
            <button @click="testScanPermissions" :disabled="loading || parsedPaths.length === 0" class="c-button c-button--blue">Test Permissions</button>
          </div>
          <button @click="resetToDefaults" :disabled="loading" class="c-button c-button--red">Reset to Defaults</button>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="text-sm" :class="messageType === 'success' ? 'text-mint' : 'text-red-400'">
          {{ message }}
        </div>

        <!-- Path Validations -->
        <div v-if="pathValidations.length > 0" class="flex flex-col gap-2">
          <div class="text-powder/70 text-sm font-semibold">Path Validation Results:</div>
          <div v-for="validation in pathValidations" :key="validation.path">
            <div v-if="validation.exists" class="text-mint flex items-center gap-2 text-xs">
              <IconCheck class="size-4" />
              <span>{{ validation.path }} <span class="font-bold">| Valid Path</span></span>
            </div>
            <div v-else class="text-red flex items-center gap-2 text-xs">
              <IconExclamationCircle class="size-4" />
              <span>{{ validation.path }} <span class="text-xs font-bold">| Invalid Path</span></span>
            </div>
          </div>
        </div>

        <!-- Permission Test Results -->
        <div v-if="permissionResults" class="bg-onyx/30 mt-4 rounded p-4">
          <div class="text-powder/70 mb-2 text-sm font-semibold">Permission Test Results:</div>
          <div class="space-y-1 text-xs">
            <div :class="permissionResults.success ? 'text-mint' : 'text-red-400'">Overall Status: {{ permissionResults.success ? "All permissions OK" : "Permission issues detected" }}</div>
            <div v-if="permissionResults.details">
              <div v-for="(detail, path) in permissionResults.details" :key="path" class="ml-2">
                <span class="font-mono">{{ path }}:</span>
                <span :class="detail.accessible ? 'text-mint' : 'text-red-400'">
                  {{ detail.accessible ? " ✓ Accessible" : " ✗ Not accessible" }}
                </span>
                <span v-if="detail.error" class="text-xs text-red-300"> ({{ detail.error }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { useSettings } from "~/composables/useSettings";
import { IconCheck, IconExclamationCircle } from "@tabler/icons-vue";
import { defaultVstPaths } from "~/utils/constants";

// Use the settings composable
const { settings, loading, fetchSettings, updateSetting, getSettingValue, getSettingDescription, validatePaths } = useSettings();

// Fetch settings on server-side to prevent hydration mismatches
await fetchSettings();

// Reactive state for form inputs
const vstPaths = ref("");
const message = ref("");
const messageType = ref<"success" | "error">("success");
const pathValidations = ref<Array<{ path: string; exists: boolean }>>([]);
const permissionResults = ref<any>(null);

// Computed property to parse paths
const parsedPaths = computed(() => {
  return vstPaths.value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
});

// Check if any settings have changed
const hasChanges = computed(() => {
  return vstPaths.value !== getSettingValue("vst_paths");
});

// Check if we're in Electron environment
const isElectron = process.client && window.electronAPI;

// Browse for directory using Electron's secure dialog
const browseForDirectory = async () => {
  if (!isElectron) {
    message.value = "Directory browsing is only available in the desktop app";
    messageType.value = "error";
    return;
  }

  try {
    const result = await window.electronAPI.selectVstPath();

    if (result.success && result.path) {
      // Add the selected path to existing paths (avoid duplicates)
      const currentPaths = parsedPaths.value;
      if (!currentPaths.includes(result.path)) {
        const newPaths = [...currentPaths, result.path];
        vstPaths.value = newPaths.join(", ");

        message.value = `Added path: ${result.path}`;
        messageType.value = "success";

        // Clear message after 3 seconds
        setTimeout(() => {
          message.value = "";
        }, 3000);
      } else {
        message.value = "Path already exists in the list";
        messageType.value = "error";
        setTimeout(() => {
          message.value = "";
        }, 3000);
      }
    }
  } catch (error) {
    console.error("Error browsing for directory:", error);
    message.value = "Failed to browse for directory";
    messageType.value = "error";
  }
};

// Remove a specific path
const removePath = (index: number) => {
  const currentPaths = parsedPaths.value;
  currentPaths.splice(index, 1);
  vstPaths.value = currentPaths.join(", ");
};

// Clear all paths
const clearPaths = () => {
  vstPaths.value = "";
  pathValidations.value = [];
  permissionResults.value = null;
};

// Test scan permissions
const testScanPermissions = async () => {
  if (!isElectron) {
    message.value = "Permission testing is only available in the desktop app";
    messageType.value = "error";
    return;
  }

  try {
    // First save the current paths
    await saveSettings();

    // Then test permissions
    const result = await window.electronAPI.testVstPermissions(parsedPaths.value);
    permissionResults.value = result;

    if (result.success) {
      message.value = "All paths are accessible";
      messageType.value = "success";
    } else {
      message.value = "Some paths have permission issues";
      messageType.value = "error";
    }

    setTimeout(() => {
      message.value = "";
    }, 5000);
  } catch (error) {
    console.error("Error testing permissions:", error);
    message.value = "Failed to test permissions";
    messageType.value = "error";
  }
};

// Save all settings
const saveSettings = async () => {
  if (!hasChanges.value) return;

  try {
    const results = await Promise.all([updateSetting("vst_paths", vstPaths.value)]);

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
  vstPaths.value = defaultVstPaths;
  pathValidations.value = [];
  permissionResults.value = null;
};

// Validate paths using the API
const validatePathsLocally = async () => {
  try {
    if (parsedPaths.value.length === 0) {
      pathValidations.value = [];
      return;
    }

    const validations = await validatePaths(parsedPaths.value);

    // Map the validation results to the expected format
    pathValidations.value = validations.map((validation: any) => ({
      path: validation.path,
      exists: validation.exists,
    }));
  } catch (error) {
    console.error("Error validating paths:", error);
    // Create individual error entries for each path
    pathValidations.value = parsedPaths.value.map((path) => ({
      path,
      exists: false,
    }));
  }
};

// Initialize form with current settings
const initializeForm = () => {
  vstPaths.value = getSettingValue("vst_paths");
};

// Watch for settings to be loaded and initialize form
watch(
  () => settings.value,
  () => {
    if (settings.value.length > 0) {
      initializeForm();
    }
  },
  { immediate: true },
);
</script>
