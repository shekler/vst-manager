<template>
  <div>
    <h1 class="text-4xl font-bold">Library</h1>

    <!-- Scan Section -->
    <div class="mt-6 mb-4 flex w-full gap-4">
      <div class="from-onyx to-onyx/50 w-full rounded-lg bg-gradient-to-br p-6">
        <h2 class="text-powder/90 mb-2 text-xl font-bold">Scanning</h2>
        <div class="flex flex-col gap-4">
          <p class="text-powder/70 text-sm">Scan for VST plugins using the paths configured in <NuxtLink to="/settings" class="text-mint hover:text-powder font-bold underline">Settings</NuxtLink>. Depending on your system, the defined paths and the plugins you have installed, the scan might take a while.</p>
          <VstScanner @scan-complete="handleScanComplete" />
        </div>
      </div>
      <div class="from-onyx to-onyx/50 w-full rounded-lg bg-gradient-to-br p-6">
        <h2 class="text-powder/90 mb-2 text-xl font-bold">Database</h2>
        <div class="flex flex-col gap-4">
          <p class="text-powder/70 text-sm">
            Options for exporting and importing the database as JSON. This can be used to backup your database or share it with others. <span class="font-bold"><span class="text-red">Note:</span> Importing a JSON file will overwrite your current database.</span>
          </p>
          <DatabaseOptions />
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="from-onyx to-onyx/50 mt-4 mb-4 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">Filters</h2>
      <div class="grid gap-4 lg:grid-cols-3">
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

        <!-- Category Filter -->
        <div class="flex flex-col gap-2">
          <label for="category" class="text-powder/70 text-sm font-bold">Category</label>
          <CustomSelect v-model="selectedCategory" :options="categoryOptions" placeholder="All Categories" :show-search="uniqueCategories.length > 10" />
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-end justify-between gap-2">
        <!-- Results Count -->
        <div class="text-powder/50 text-sm">Showing {{ filteredPlugins.length }} of {{ plugins.length }} plugins</div>

        <!-- Clear Filters Button -->
        <button @click="clearFilters" class="c-button c-button--red">Clear Filters</button>
      </div>
    </div>

    <div class="bg-red/10 text-red border-red mb-4 rounded-lg border p-4 text-center font-bold">
      <p class="text-pretty">This is an alpha version. Bugs and errors might occur. If you want to submit a bug, you can do so in <a href="https://github.com/shekler/vst-manager/issues" target="_blank" class="text-powder hover:text-red font-bold underline duration-200">GitHub</a>.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mt-8 text-center">
      <div class="text-powder/50 text-lg"><IconLoader2 class="animate-spin" /> Loading plugins...</div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="mt-8 text-center">
      <div class="bg-red/10 border-red text-red rounded-lg border p-4">
        <div class="mb-2 text-lg font-bold">Error Loading Plugins</div>
        <div class="text-sm">{{ error }}</div>
        <button @click="fetchPlugins" class="c-button c-button--red mt-4">Retry</button>
      </div>
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
              <div class="flex items-start justify-between gap-4">
                <h2 class="text-powder/90 shrink truncate text-lg font-bold">
                  {{ plugin.name || "Unknown Plugin" }}
                </h2>
                <span v-if="plugin.version" class="from-mint/20 to-mint/10 border-mint/50 text-mint rounded-md border bg-gradient-to-br px-2 py-1 text-xs">{{ plugin.version }}</span>
              </div>
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <span v-if="plugin.subCategories.length > 0" v-for="subCategory in plugin.subCategories" :key="subCategory" class="from-powder/10 border-powder/50 text-powder/70 rounded-md border bg-gradient-to-br px-2 py-1 text-xs">{{ subCategory }}</span>
              <span v-if="!plugin.isValid" class="bg-red/20 text-red border-red rounded-md border px-2 py-1 text-xs">Invalid</span>
            </div>

            <div class="mt-4 flex flex-col items-start gap-1 text-sm">
              <div class="font-bold">Install Location:</div>
              <div class="border-powder/20 flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1">
                <span class="text-powder/30 pointer-events-none truncate">{{ plugin.path }}</span>
                <IconCopy class="text-powder/70 hover:text-powder ml-2 size-4 shrink-0 cursor-pointer duration-200" @click="copyPath(plugin.path)" />
              </div>
            </div>

            <div class="mt-4 flex flex-col items-start gap-1 text-sm">
              <div class="font-bold">Key:</div>
              <div class="border-powder/20 relative w-full rounded-md border">
                <input v-model="plugin.key" class="text-powder/70 w-full truncate px-2 py-1" placeholder="Enter key" />
                <div class="text-powder/70 absolute top-1.5 right-2 flex shrink-0 items-center gap-2">
                  <IconDeviceFloppy v-if="plugin.key && plugin.key.length > 0" class="hover:text-powder size-4 cursor-pointer duration-200" @click="saveKey(plugin.id, plugin.key)" />
                  <IconDeviceFloppy v-else class="text-powder/30 size-4 cursor-not-allowed duration-200" />
                  <IconCopy v-if="plugin.key && plugin.key.length > 0" class="hover:text-powder size-4 cursor-pointer duration-200" @click="copyKey(plugin.key)" />
                  <IconCopy v-else class="text-powder/30 size-4 cursor-not-allowed duration-200" />
                </div>
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
import { ref, computed, onMounted } from "vue";
import { IconKeyFilled, IconCopy, IconDeviceFloppy, IconLoader2 } from "@tabler/icons-vue";

// Import the custom select component
import CustomSelect from "~/components/CustomSelect.vue";

// Use the plugins composable
const { plugins, loading, error, fetchPlugins, savePluginKey } = usePlugins();

// Use toast notifications
const { success, error: showError } = useToast();

// Use Electron composable
const { isElectron } = useElectron();

// Development mode check
const isDevelopment = computed(() => process.env.NODE_ENV === "development");

// Fetch plugins on client-side since SSR is disabled
onMounted(async () => {
  // Add a small delay to ensure Electron API is properly initialized
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Try to fetch plugins with retry mechanism
  let retryCount = 0;
  const maxRetries = 3;

  const attemptFetch = async () => {
    try {
      await fetchPlugins();
    } catch (err) {
      console.error(`Fetch attempt ${retryCount + 1} failed:`, err);
      retryCount++;

      if (retryCount < maxRetries) {
        console.log(`Retrying in 1 second... (${retryCount}/${maxRetries})`);
        setTimeout(attemptFetch, 1000);
      } else {
        console.error("Max retries reached, giving up");
      }
    }
  };

  await attemptFetch();
});

// Additional reactive state
const searchFilter = ref("");
const selectedManufacturer = ref("");
const selectedCategory = ref("");

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

const uniqueCategories = computed(() => {
  if (!plugins.value || !Array.isArray(plugins.value)) {
    return [];
  }
  const categories = plugins.value
    .filter((plugin: any) => plugin && plugin.subCategories)
    .map((plugin: any) => plugin.subCategories)
    .flat();
  return [...new Set(categories)].sort();
});

// Options for custom selects
const manufacturerOptions = computed(() => [
  { value: "", label: "All Manufacturers" },
  ...uniqueManufacturers.value.map((manufacturer) => ({
    value: manufacturer as string,
    label: manufacturer as string,
  })),
]);

const categoryOptions = computed(() => [
  { value: "", label: "All Categories" },
  ...uniqueCategories.value.map((category) => ({
    value: category as string,
    label: category as string,
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

    // Category filter
    const categoryMatch = !selectedCategory.value || plugin.subCategories.includes(selectedCategory.value);

    return searchMatch && manufacturerMatch && categoryMatch;
  });
});

// Clear all filters
const clearFilters = () => {
  searchFilter.value = "";
  selectedManufacturer.value = "";
  selectedCategory.value = "";
};

const copyPath = (path: string) => {
  const directory = path.split("\\").slice(0, -1).join("\\");
  navigator.clipboard.writeText(directory);
  success("Path copied to clipboard");
};

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key);
  success("Key copied to clipboard");
};

const saveKey = async (pluginId: string, key: string) => {
  const result = await savePluginKey(pluginId, key);
  if (result) {
    success("Key saved");
  } else {
    showError("Failed to save key");
  }
};
</script>
