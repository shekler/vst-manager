<!-- components/VstScanner.vue -->
<template>
  <div class="flex flex-col gap-4">
    <button @click="scanPlugins" :disabled="isScanning" class="c-button c-button--mint w-fit">
      <div v-if="isScanning" class="animate-spin">
        <IconLoader2 class="size-4 animate-spin" />
      </div>
      {{ isScanning ? "Scanning" : "Scan Plugins" }}
    </button>

    <div v-if="results" class="border-powder/20 mt-4 rounded-lg border p-6">
      <h3 class="text-powder/90 text-lg font-bold">Scan Results</h3>
      <p class="text-powder/70">Total plugins: {{ results.totalPlugins }}</p>
      <p class="text-powder/70">Valid plugins: {{ results.validPlugins }}</p>

      <div class="mt-4 space-y-2">
        <div v-for="plugin in results.plugins" :key="plugin.path">
          <p v-if="!plugin.isValid" class="rounded-md border border-red-400/20 bg-red-400/5 p-2 px-4">Error: {{ plugin.error }}</p>
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
import { IconLoader2 } from "@tabler/icons-vue";
const emit = defineEmits(["scan-complete"]);

const isScanning = ref(false);
const results = ref(null);
const showErrorModal = ref(false);
const errorMessage = ref("");

async function scanPlugins() {
  isScanning.value = true;
  results.value = null;

  try {
    const response = await $fetch("/api/scan-vst-settings", {
      method: "POST",
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
