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
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <button @click="saveSettings" :disabled="loading || !hasChanges" class="c-button c-button--mint">
              {{ loading ? "Saving..." : "Save Settings" }}
            </button>
            <button @click="validatePathsLocally" class="c-button c-button--clear">Validate Paths</button>
          </div>
          <button @click="resetToDefaults" :disabled="loading" class="c-button c-button--red">Reset to Defaults</button>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="text-sm" :class="messageType === 'success' ? 'text-mint' : 'text-red-400'">
          {{ message }}
        </div>
        <div v-if="pathValidations.length > 0" class="flex flex-col gap-2">
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

// Check if any settings have changed
const hasChanges = computed(() => {
  return vstPaths.value !== getSettingValue("vst_paths");
});

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
};

// Validate paths using the API
const validatePathsLocally = async () => {
  try {
    // Split paths by comma and filter out empty strings
    const vstPathList = vstPaths.value
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);

    if (vstPathList.length === 0) {
      pathValidations.value = [];
      return;
    }

    const validations = await validatePaths(vstPathList);

    // Map the validation results to the expected format
    pathValidations.value = validations.map((validation: any) => ({
      path: validation.path,
      exists: validation.exists,
    }));
  } catch (error) {
    console.error("Error validating paths:", error);
    // Create individual error entries for each path
    const vstPathList = vstPaths.value
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
    pathValidations.value = vstPathList.map((path) => ({
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

<style></style>
