<template>
  <div>
    <h1 class="text-4xl font-bold">Library</h1>

    <!-- Scan Section -->
    <div class="from-onyx to-onyx/50 mt-6 mb-4 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">Scan Plugins</h2>
      <div class="flex flex-col gap-2">
        <VstScanner @scan-complete="handleScanComplete" />
        <p class="text-powder/70 text-sm">Scan for VST plugins using the paths configured in <NuxtLink to="/settings" class="text-mint hover:text-powder font-bold underline">Settings</NuxtLink>.</p>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="from-onyx to-onyx/50 mt-4 mb-4 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">Filters</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <!-- Search Filter -->
        <div class="flex flex-col gap-2">
          <label for="search" class="text-powder/70 text-sm font-bold">Search</label>
          <input type="text" id="search" v-model="searchFilter" placeholder="Search plugins..." class="c-input c-input--search" />
        </div>

        <!-- Manufacturer Filter -->
        <div class="flex flex-col gap-2">
          <label for="manufacturer" class="text-powder/70 text-sm font-bold">Manufacturer</label>
          <CustomSelect v-model="selectedManufacturer" :options="manufacturerOptions" placeholder="All Manufacturers" :show-search="uniqueManufacturers.length > 10" />
        </div>
      </div>

      <div class="mt-4 flex items-end justify-between">
        <!-- Results Count -->
        <div class="text-powder/50 text-sm">Showing {{ filteredPlugins.length }} of {{ plugins.length }} plugins</div>

        <!-- Clear Filters Button -->
        <button @click="clearFilters" class="c-button c-button--red">Clear Filters</button>
      </div>
    </div>

    <div class="bg-red/10 text-red border-red mb-4 rounded-lg border p-4 text-center font-bold">
      <p class="text-pretty">This is an alpha version. Bugs and errors might occur. If you want to submit a bug, you can do so in <a href="https://github.com/shekler/vst-manager/issues" target="_blank" class="text-powder hover:text-red font-bold underline duration-200">GitHub</a>. Plugins are read-only from scan results.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mt-8 text-center">
      <div class="text-powder/50 text-lg"><IconLoader2 class="animate-spin" /> Loading plugins...</div>
    </div>

    <!-- Plugin Grid -->

    <div v-else-if="filteredPlugins" class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <!-- Plugin library view -->
      <div v-for="plugin in filteredPlugins" :key="plugin.id" class="from-onyx to-onyx/50 relative flex flex-col overflow-hidden rounded-lg bg-gradient-to-br">
        <div class="pointer-events-none absolute top-0 left-0 size-32 -translate-y-1/2 rounded-full bg-white opacity-30 blur-[100px]"></div>
        <div class="grid grow grid-cols-3 gap-4 p-4">
          <div class="col-span-3 flex flex-col">
            <div class="leading-none">
              <div class="text-powder/50">{{ plugin.vendor || "Unknown" }}</div>
              <h2 class="text-powder/90 text-xl font-bold">
                {{ plugin.name || "Unknown Plugin" }}
              </h2>
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <span class="bg-powder/20 text-powder/70 rounded-full px-2 py-1 text-xs">{{ plugin.category || "Unknown" }}</span>
              <span v-if="plugin.version" class="bg-powder/20 text-powder/70 rounded-full px-2 py-1 text-xs">{{ plugin.version }}</span>
              <span v-if="!plugin.isValid" class="bg-red/20 text-red rounded-full px-2 py-1 text-xs">Invalid</span>
            </div>

            <div class="text-powder/70 mt-4 text-sm">
              <div class="flex items-center gap-2">
                <span class="font-bold">Path:</span>
                <span class="truncate">{{ plugin.path }}</span>
              </div>
            </div>

            <div v-if="plugin.error" class="text-red/70 mt-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="font-bold">Error:</span>
                <span>{{ plugin.error }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results Message -->
    <div v-if="!loading && filteredPlugins.length === 0 && plugins.length > 0" class="mt-8 text-center">
      <div class="text-powder/50 text-lg">No plugins match your current filters.</div>
      <button @click="clearFilters" class="c-button c-button--clear mx-auto mt-4">Clear Filters</button>
    </div>

    <!-- No Plugins Message -->
    <div v-if="!loading && plugins.length === 0" class="mt-8 text-center">
      <div class="text-powder/50 text-lg">No plugins found. Please scan for VST plugins.</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { IconKeyFilled, IconCopy, IconDeviceFloppy, IconLoader2 } from "@tabler/icons-vue";

// Import the custom select component
import CustomSelect from "~/components/CustomSelect.vue";

// Use the plugins composable
const { plugins, loading, error, fetchPlugins } = usePlugins();

// Use toast notifications
const { success, error: showError } = useToast();

// Use Electron composable
const { openFileExplorer } = useElectron();

// Fetch plugins on server-side to prevent hydration mismatches
await fetchPlugins();

// Additional reactive state
const searchFilter = ref("");
const selectedManufacturer = ref("");
const selectedType = ref("");

// Handle scan complete
const handleScanComplete = async (scanData: any) => {
  // Refresh the plugins list after scanning
  await fetchPlugins();
};

// Computed properties for unique values
const uniqueManufacturers = computed(() => {
  if (!plugins.value || !Array.isArray(plugins.value)) {
    return [];
  }
  const manufacturers = plugins.value.filter((plugin: any) => plugin && plugin.vendor).map((plugin: any) => plugin.vendor);
  return [...new Set(manufacturers)].sort();
});

// Options for custom selects
const manufacturerOptions = computed(() => [
  { value: "", label: "All Manufacturers" },
  ...uniqueManufacturers.value.map((manufacturer) => ({
    value: manufacturer as string,
    label: manufacturer as string,
  })),
]);

// Filtered plugins based on all filters
const filteredPlugins = computed(() => {
  if (!plugins.value || !Array.isArray(plugins.value)) {
    return [];
  }

  return plugins.value.filter((plugin: any) => {
    if (!plugin || typeof plugin !== "object") {
      return false;
    }

    // Search filter
    const searchMatch = !searchFilter.value || (plugin.name && plugin.name.toLowerCase().includes(searchFilter.value.toLowerCase())) || (plugin.vendor && plugin.vendor.toLowerCase().includes(searchFilter.value.toLowerCase()));

    // Manufacturer filter
    const manufacturerMatch = !selectedManufacturer.value || plugin.vendor === selectedManufacturer.value;

    // Type filter
    const typeMatch = !selectedType.value || plugin.category === selectedType.value;

    return searchMatch && manufacturerMatch && typeMatch;
  });
});

// Clear all filters
const clearFilters = () => {
  searchFilter.value = "";
  selectedManufacturer.value = "";
  selectedType.value = "";
};
</script>
