<template>
  <div class="p-8">
    <h1 class="mb-8 text-4xl font-bold">Database Test</h1>

    <div class="space-y-6">
      <!-- Import Section -->
      <div class="rounded-lg bg-gray-800 p-6">
        <h2 class="mb-4 text-2xl font-bold">Import Data</h2>
        <button
          @click="handleImport"
          :disabled="loading"
          class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-500"
        >
          {{ loading ? "Importing..." : "Import from JSON" }}
        </button>
        <div v-if="error" class="mt-2 text-red-400">{{ error }}</div>
        <div v-if="importResult" class="mt-2 text-green-400">
          {{ importResult }}
        </div>
      </div>

      <!-- Stats Section -->
      <div class="rounded-lg bg-gray-800 p-6">
        <h2 class="mb-4 text-2xl font-bold">Database Statistics</h2>
        <button
          @click="loadStats"
          class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Load Stats
        </button>
        <div v-if="stats" class="mt-4">
          <p><strong>Total Plugins:</strong> {{ stats.total }}</p>
          <p><strong>By Type:</strong></p>
          <ul class="ml-4">
            <li v-for="(count, type) in stats.byType" :key="type">
              {{ type }}: {{ count }}
            </li>
          </ul>
          <p><strong>By Manufacturer:</strong></p>
          <ul class="ml-4">
            <li
              v-for="(count, manufacturer) in stats.byManufacturer"
              :key="manufacturer"
            >
              {{ manufacturer }}: {{ count }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Plugins List -->
      <div class="rounded-lg bg-gray-800 p-6">
        <h2 class="mb-4 text-2xl font-bold">Plugins ({{ plugins.length }})</h2>
        <button
          @click="loadPlugins"
          class="mb-4 rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
        >
          Load Plugins
        </button>
        <div class="max-h-96 space-y-2 overflow-y-auto">
          <div
            v-for="plugin in plugins"
            :key="plugin.id"
            class="rounded bg-gray-700 p-3"
          >
            <div class="font-bold">{{ plugin.name }}</div>
            <div class="text-sm text-gray-300">
              {{ plugin.manufacturer }} - {{ plugin.type }}
            </div>
            <div class="text-xs text-gray-400">{{ plugin.path }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const plugins = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const importResult = ref("");
const stats = ref<any>(null);

const handleImport = async () => {
  loading.value = true;
  error.value = "";
  importResult.value = "";

  try {
    const response = await $fetch<{
      success: boolean;
      count?: number;
      message?: string;
    }>("/api/plugins/import", { method: "POST" });
    if (response.success) {
      importResult.value = `Successfully imported ${response.count} plugins`;
      await loadPlugins();
    } else {
      error.value = "Import failed";
    }
  } catch (err: any) {
    error.value = err.message || "Import failed";
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await $fetch<{ success: boolean; data?: any }>(
      "/api/plugins/stats",
    );
    if (response.success && response.data) {
      stats.value = response.data;
    }
  } catch (err: any) {
    console.error("Error loading stats:", err);
  }
};

const loadPlugins = async () => {
  try {
    const response = await $fetch<{ success: boolean; data?: any[] }>(
      "/api/plugins",
    );
    if (response.success && response.data) {
      plugins.value = response.data;
    }
  } catch (err: any) {
    console.error("Error loading plugins:", err);
  }
};
</script>
