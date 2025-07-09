<template>
  <div class="mx-auto max-w-2xl p-4">
    <!-- Header -->
    <div class="mb-6 text-center">
      <h2 class="mb-2 text-xl font-bold">VST3 Scanner</h2>
      <p class="text-gray-600">Scan for VST3 plugins on your system</p>
    </div>

    <!-- Electron Warning -->
    <div
      v-if="!isElectron()"
      class="mb-4 rounded border border-yellow-300 bg-yellow-100 p-3"
    >
      <p class="text-sm text-yellow-800">
        VST scanning requires Electron. Run
        <code class="rounded bg-white px-1">npm run dev</code>
      </p>
    </div>

    <!-- Scan Controls -->
    <div class="mb-6">
      <input
        v-model="customPath"
        type="text"
        placeholder="Enter custom path to scan (optional)"
        class="mb-3 w-full rounded border border-gray-300 p-2"
        :disabled="!isElectron()"
      />

      <div class="flex gap-2">
        <button
          @click="scanDefaultPaths"
          :disabled="isScanning || !isElectron()"
          class="from-bright to-orange rounded bg-gradient-to-r px-4 py-2 font-bold text-black disabled:opacity-50"
        >
          {{ isScanning ? "Scanning..." : "Scan Default Paths" }}
        </button>

        <button
          @click="scanCustomPath"
          :disabled="isScanning || !customPath || !isElectron()"
          class="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
        >
          Scan Custom Path
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="isScanning" class="mb-4">
      <div class="mb-2 h-2 w-full rounded bg-gray-200 font-bold">
        <div
          class="from-bright to-orange h-2 rounded bg-gradient-to-r text-black transition-all"
          :style="{ width: `${scanProgress}%` }"
        ></div>
      </div>
      <div class="text-center text-sm text-gray-600">
        {{ Math.round(scanProgress) }}%
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="scanError"
      class="mb-4 rounded border border-red-300 bg-red-100 p-3"
    >
      <p class="text-sm text-red-800">{{ scanError }}</p>
    </div>

    <!-- Results -->
    <div v-if="vstScan.length > 0" class="space-y-4">
      <h3 class="text-lg font-semibold">Found {{ vstScan.length }} plugins:</h3>

      <div class="max-h-96 overflow-y-auto rounded border border-gray-200">
        <div
          v-for="plugin in vstScan"
          :key="plugin.id"
          class="border-b border-gray-100 p-3 hover:bg-gray-50"
        >
          <div class="font-medium">{{ plugin.name }}</div>
          <div class="truncate text-sm text-gray-600">{{ plugin.path }}</div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!isScanning && !scanError"
      class="py-8 text-center text-gray-600"
    >
      <p v-if="isElectron()">
        No plugins scanned yet. Click "Scan Default Paths" to start.
      </p>
      <p v-else>VST scanning is only available in the Electron app.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useVstScan } from "~/composables/vst-scan";

const {
  vstScan,
  isScanning,
  scanProgress,
  scanError,
  scanForVst3Files,
  scanSpecificPaths,
  isElectron,
} = useVstScan();

const customPath = ref("");

const scanDefaultPaths = async () => {
  await scanForVst3Files();
};

const scanCustomPath = async () => {
  if (customPath.value) {
    await scanSpecificPaths([customPath.value]);
    customPath.value = "";
  }
};
</script>
