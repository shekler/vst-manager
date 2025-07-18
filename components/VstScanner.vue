<!-- components/VstScanner.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <label for="directory" class="text-powder/70 text-sm font-bold">VST Plugin Directory:</label>
      <input id="directory" v-model="directoryPath" type="text" placeholder="C:\Program Files\Common Files\VST3" class="c-input c-input--search" />
    </div>

    <button @click="scanPlugins" :disabled="isScanning" class="c-button c-button--mint">
      {{ isScanning ? "Scanning..." : "Scan Plugins" }}
    </button>

    <div v-if="results" class="bg-powder/10 mt-4 rounded-lg p-4">
      <h3 class="text-powder/90 text-lg font-bold">Scan Results</h3>
      <p class="text-powder/70">Total plugins: {{ results.totalPlugins }}</p>
      <p class="text-powder/70">Valid plugins: {{ results.validPlugins }}</p>

      <div class="mt-4 space-y-2">
        <div v-for="plugin in results.plugins" :key="plugin.path" class="border-powder/20 bg-powder/5 rounded border p-3" :class="{ 'border-red-400/20 bg-red-400/5': !plugin.isValid }">
          <h4 class="text-powder/90 font-bold">{{ plugin.name || "Unknown Plugin" }}</h4>
          <p v-if="plugin.isValid" class="text-powder/70 text-sm">
            Vendor: {{ plugin.vendor }}<br />
            Version: {{ plugin.version }}<br />
            Category: {{ plugin.category }}
          </p>
          <p v-else class="text-sm text-red-400">Error: {{ plugin.error }}</p>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <ModalWindow v-model="showErrorModal" title="Error">
      <p class="text-powder/70 mt-2 text-sm">
        {{ errorMessage }}
      </p>

      <template #footer>
        <button @click="showErrorModal = false" class="c-button c-button--clear">OK</button>
      </template>
    </ModalWindow>
  </div>
</template>

<script setup>
const emit = defineEmits(["scan-complete"]);

const directoryPath = ref("");
const isScanning = ref(false);
const results = ref(null);
const showErrorModal = ref(false);
const errorMessage = ref("");

async function scanPlugins() {
  if (!directoryPath.value) {
    errorMessage.value = "Please enter a directory path";
    showErrorModal.value = true;
    return;
  }

  isScanning.value = true;
  results.value = null;

  try {
    const response = await $fetch("/api/scan-vst", {
      method: "POST",
      body: {
        directoryPath: directoryPath.value,
      },
    });

    results.value = response.data;

    // Emit event to notify parent that scanning is complete
    emit("scan-complete", response.data);
  } catch (error) {
    console.error("Scan failed:", error);
    errorMessage.value = `Scan failed: ${error.message}`;
    showErrorModal.value = true;
  } finally {
    isScanning.value = false;
  }
}
</script>
