<template>
  <div class="container mx-auto p-4">
    <h1 class="mb-6 text-3xl font-bold">VST Plugin Scanner</h1>

    <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
      <button
        @click="startScan"
        :disabled="isScanning"
        class="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 focus:outline-none"
        :class="{ 'cursor-not-allowed opacity-50': isScanning }"
      >
        {{ isScanning ? "Scanning..." : "Scan VST Plugins" }}
      </button>
      <p
        v-if="scanMessage"
        :class="{ 'text-green-600': scanSuccess, 'text-red-600': !scanSuccess }"
        class="mt-4"
      >
        {{ scanMessage }}
      </p>
      <div v-if="skippedPaths.length" class="mt-4 text-orange-600">
        <p>Some paths were skipped during the scan:</p>
        <ul class="list-disc pl-5 text-sm">
          <li v-for="(item, index) in skippedPaths" :key="index">
            <strong>{{ item.path }}</strong
            >: {{ item.error }}
          </li>
        </ul>
      </div>
    </div>

    <div class="rounded-lg bg-white p-6 shadow-md">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-semibold">
          Scanned Plugins ({{ filteredPlugins.length }})
        </h2>
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search plugins..."
            class="rounded border border-gray-300 px-3 py-1 text-sm"
          />
          <select
            v-model="vendorFilter"
            class="rounded border border-gray-300 px-3 py-1 text-sm"
          >
            <option value="">All Vendors</option>
            <option
              v-for="vendor in uniqueVendors"
              :key="vendor"
              :value="vendor"
            >
              {{ vendor }}
            </option>
          </select>
        </div>
      </div>

      <div
        v-if="plugins.length === 0 && !isScanning"
        class="py-8 text-center text-gray-500"
      >
        No plugins found yet. Click "Scan VST Plugins" to begin.
      </div>

      <div
        v-else-if="filteredPlugins.length === 0"
        class="py-8 text-center text-gray-500"
      >
        No plugins match your search criteria.
      </div>

      <div v-else class="grid gap-4">
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          class="rounded-lg border p-4 hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold">
                {{ plugin.name || "Unknown Name" }}
              </h3>
              <p class="text-gray-600">
                {{ plugin.vendor || "Unknown Vendor" }}
              </p>
              <div
                v-if="plugin.product && plugin.product !== plugin.name"
                class="text-sm text-gray-500"
              >
                Product: {{ plugin.product }}
              </div>
              <div v-if="plugin.version" class="text-sm text-gray-500">
                Version: {{ plugin.version }}
              </div>
            </div>
            <div class="ml-4 text-xs text-gray-400">
              {{ getPluginType(plugin.filePath) }}
            </div>
          </div>
          <div class="mt-2">
            <p class="text-xs break-all text-gray-500">
              <strong>Path:</strong> {{ plugin.filePath }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="filteredPlugins.length > 0" class="mt-6 text-sm text-gray-500">
        Showing {{ filteredPlugins.length }} of {{ plugins.length }} plugins
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const isScanning = ref(false);
const scanMessage = ref("");
const scanSuccess = ref(true);
const plugins = ref([]);
const skippedPaths = ref([]);
const searchQuery = ref("");
const vendorFilter = ref("");

// Computed properties for filtering
const uniqueVendors = computed(() => {
  const vendors = [
    ...new Set(
      plugins.value
        .map((p) => p.vendor)
        .filter((v) => v && v !== "Unknown Vendor"),
    ),
  ];
  return vendors.sort();
});

const filteredPlugins = computed(() => {
  let filtered = plugins.value;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (plugin) =>
        plugin.name?.toLowerCase().includes(query) ||
        plugin.vendor?.toLowerCase().includes(query) ||
        plugin.product?.toLowerCase().includes(query) ||
        plugin.filePath?.toLowerCase().includes(query),
    );
  }

  // Filter by vendor
  if (vendorFilter.value) {
    filtered = filtered.filter(
      (plugin) => plugin.vendor === vendorFilter.value,
    );
  }

  return filtered;
});

// Function to determine plugin type from file path
const getPluginType = (filePath) => {
  if (filePath.endsWith(".vst3")) {
    return "VST3";
  } else if (filePath.endsWith(".dll") || filePath.endsWith(".vst")) {
    return "VST2";
  }
  return "Unknown";
};

// Function to fetch plugins from the database via your Nuxt API
const fetchPlugins = async () => {
  try {
    const { data } = await useFetch("/api/vst/list");
    if (data.value && data.value.success) {
      plugins.value = data.value.plugins;
    } else {
      console.error("Failed to fetch plugins:", data.value?.message);
      scanMessage.value = "Failed to load existing plugins.";
      scanSuccess.value = false;
    }
  } catch (error) {
    console.error("Error fetching plugins:", error);
    scanMessage.value = `Error loading plugins: ${error.message}`;
    scanSuccess.value = false;
  }
};

// Function to trigger the VST scan on the server
const startScan = async () => {
  isScanning.value = true;
  scanMessage.value =
    "Starting VST scan... This might take a while depending on your system and number of plugins.";
  scanSuccess.value = true;
  skippedPaths.value = [];
  plugins.value = []; // Clear current list while scanning
  searchQuery.value = ""; // Clear search
  vendorFilter.value = ""; // Clear filter

  try {
    // Make a POST request to your server API to trigger the scan
    const { data } = await useFetch("/api/vst/scan", { method: "POST" });
    if (data.value && data.value.success) {
      scanMessage.value = `Scan complete! Found ${data.value.count} plugins.`;
      scanSuccess.value = true;
      skippedPaths.value = data.value.skippedPaths || [];
      await fetchPlugins(); // Refresh the displayed list after a successful scan
    } else {
      scanMessage.value = `Scan failed: ${data.value?.message || "Unknown error."}`;
      scanSuccess.value = false;
      skippedPaths.value = data.value?.skippedPaths || [];
    }
  } catch (error) {
    scanMessage.value = `An error occurred during scan: ${error.message}`;
    scanSuccess.value = false;
    console.error("Client-side scan request error:", error);
  } finally {
    isScanning.value = false;
  }
};

// Fetch existing plugins when the component is first mounted
onMounted(() => {
  fetchPlugins();
});
</script>
