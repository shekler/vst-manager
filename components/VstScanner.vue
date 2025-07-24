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

const { success, error: showError } = useToast();

async function scanPlugins() {
  isScanning.value = true;
  results.value = null;

  try {
    const response = await $fetch("/api/vst/scan", {
      method: "POST",
    });

    if (response.success) {
      results.value = response.results;
      success("Plugins scanned successfully!");
      emit("scan-complete", response.results);
    } else {
      errorMessage.value = response.error || "Scan failed";
      showErrorModal.value = true;
    }
  } catch (error) {
    console.error("Scan failed:", error);
    errorMessage.value = "Failed to connect to scanner service";
    showErrorModal.value = true;
  } finally {
    isScanning.value = false;
  }
}

async function getPluginData() {
  const response = usePlugins();
  return response.plugins;
}
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
