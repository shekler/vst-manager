<!-- components/VstScanner.vue -->
<template>
  <div class="flex flex-col gap-4">
    <button @click="scanPlugins" :disabled="isScanning" class="c-button c-button--mint w-fit">
      <div v-if="isScanning" class="animate-spin">
        <IconLoader2 class="size-4 animate-spin" />
      </div>
      {{ isScanning ? "Scanning" : "Scan Plugins" }}
    </button>

    <Transition name="fade" mode="out-in">
      <div v-if="results" class="bg-jet/50 relative mt-4 rounded-lg p-6">
        <button @click="closeResults" class="text-powder/50 hover:text-powder/80 absolute top-2 right-2 transition-colors" title="Close results">
          <IconX class="size-5" />
        </button>
        <h3 class="text-powder/90 text-lg font-bold">Scan Results</h3>
        <p class="text-powder/70">Total plugins: {{ results.totalPlugins }}</p>
        <p class="text-powder/70">Valid plugins: {{ results.validPlugins }}</p>

        <div class="mt-4 space-y-2">
          <div v-for="plugin in results.plugins" :key="plugin.path">
            <p v-if="!plugin.isValid" class="rounded-md border border-red-400/20 bg-red-400/5 p-2 px-4">Error: {{ plugin.error }}</p>
          </div>
        </div>
      </div>
    </Transition>

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
import { IconX } from "@tabler/icons-vue";
const emit = defineEmits(["scan-complete"]);

const isScanning = ref(false);
const results = ref(null);
const showErrorModal = ref(false);
const errorMessage = ref("");
let resultsTimer = null;

const { success, error: showError } = useToast();

async function scanPlugins() {
  isScanning.value = true;
  results.value = null;

  // Clear any existing timer
  if (resultsTimer) {
    clearTimeout(resultsTimer);
    resultsTimer = null;
  }

  try {
    const response = await $fetch("/api/scan-vst-settings", {
      method: "POST",
    });

    results.value = response.data;

    // Set timer to clear results after 10 seconds
    resultsTimer = setTimeout(() => {
      results.value = null;
      resultsTimer = null;
    }, 10000);

    // Show success toast with scan results
    const { totalPlugins, validPlugins } = response.data;
    const invalidPlugins = totalPlugins - validPlugins;
    const message = `Scan complete! Found ${totalPlugins} plugins (${validPlugins} valid${invalidPlugins > 0 ? `, ${invalidPlugins} invalid` : ""})`;
    success(message);

    // Emit event to notify parent that scanning is complete
    emit("scan-complete", response.data);
  } catch (error) {
    console.error("Scan failed:", error);
    errorMessage.value = `Scan failed: ${error.message}`;
    showErrorModal.value = true;
    showError(`Scan failed: ${error.message}`);
  } finally {
    isScanning.value = false;
  }
}

function closeResults() {
  results.value = null;
  resultsTimer = null; // Clear timer when results are closed
}

// Clean up timer when component is unmounted
onUnmounted(() => {
  if (resultsTimer) {
    clearTimeout(resultsTimer);
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
