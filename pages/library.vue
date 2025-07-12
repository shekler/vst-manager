<template>
  <div>
    <h1 class="text-4xl font-bold">Library</h1>

    <!-- Filter Section -->
    <div class="from-onyx toonyx/50 mt-6 mb-8 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">Filters</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <!-- Search Filter -->
        <div class="flex flex-col gap-2">
          <label for="search" class="text-powder/70 text-sm font-bold"
            >Search</label
          >
          <input
            type="text"
            id="search"
            v-model="searchFilter"
            placeholder="Search plugins..."
            class="c-input c-input--search"
          />
        </div>

        <!-- Manufacturer Filter -->
        <div class="flex flex-col gap-2">
          <label for="manufacturer" class="text-powder/70 text-sm font-bold"
            >Manufacturer</label
          >
          <CustomSelect
            v-model="selectedManufacturer"
            :options="manufacturerOptions"
            placeholder="All Manufacturers"
            :show-search="uniqueManufacturers.length > 10"
          />
        </div>

        <!-- Type Filter -->
        <div class="flex flex-col gap-2">
          <label for="type" class="text-powder/70 text-sm font-bold"
            >Type</label
          >
          <CustomSelect
            v-model="selectedType"
            :options="typeOptions"
            placeholder="All Types"
            :show-search="uniqueTypes.length > 10"
          />
        </div>
      </div>

      <div class="mt-4 flex items-end justify-between">
        <!-- Results Count -->
        <div class="text-powder/50 text-sm">
          Showing {{ filteredPlugins.length }} of {{ plugins.length }} plugins
        </div>

        <div class="flex gap-2">
          <!-- Scan and Update Button -->
          <button
            @click="scanAndUpdate"
            :disabled="isScanning"
            class="c-button c-button--blue"
            :class="{ 'cursor-not-allowed opacity-50': isScanning }"
          >
            {{ isScanning ? "🔄 Scanning..." : "🔍 Scan & Update" }}
          </button>

          <!-- Clear Filters Button -->
          <button @click="clearFilters" class="c-button c-button--red">
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Plugin Grid -->
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <!-- Plugin library view -->
      <div
        v-for="plugin in filteredPlugins"
        :key="plugin.name"
        class="from-onyx to-onyx/50 relative flex flex-col overflow-hidden rounded-lg bg-gradient-to-br"
      >
        <div
          class="pointer-events-none absolute top-0 left-0 size-32 -translate-y-1/2 rounded-full bg-white opacity-30 blur-[100px]"
        ></div>
        <div class="grid grow grid-cols-3 gap-4 p-4">
          <div class="relative" v-if="plugin.image">
            <NuxtImg
              :src="plugin.image"
              :alt="`${plugin.name} Screenshot`"
              class="absolute inset-0 size-fit max-h-full max-w-full self-start justify-self-center"
            />
          </div>
          <div class="col-span-2 flex flex-col">
            <div class="leading-none">
              <div class="text-powder/50">{{ plugin.manufacturer }}</div>
              <h2 class="text-powder/90 text-xl font-bold">
                {{ plugin.name }}
              </h2>
            </div>

            <div
              class="text-powder/50 mt-2 flex flex-wrap justify-between gap-2 text-sm"
            >
              <div class="flex flex-col">
                <div class="font-bold">Version:</div>
                <div class="text-powder/70">{{ plugin.version }}</div>
              </div>
              <div
                class="bg-powder/20 text-powder/70 flex h-8 translate-x-4 items-center justify-center rounded-l-lg px-3 text-xs leading-[0] font-bold"
              >
                {{ plugin.type }}
              </div>
            </div>
            <div
              class="text-powder/50 mt-2 flex flex-wrap justify-between gap-2 text-sm"
            >
              <div class="flex flex-col">
                <div class="font-bold">Updated:</div>
                <div class="text-powder/70">
                  <NuxtTime
                    :datetime="plugin.last_updated"
                    :format="getDeviceFormat"
                  />
                </div>
              </div>
              <div class="flex flex-col">
                <div class="font-bold">Scanned:</div>
                <div class="text-powder/70">
                  <NuxtTime
                    :datetime="plugin.date_scanned"
                    :format="getDeviceFormat"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex">
          <a
            :href="plugin.url"
            target="_blank"
            class="bg-mint text-jet hover:border-mint/50 hover:bg-gradient hover:from-mint/10 hover:to-mint/20 hover:text-mint flex grow justify-center rounded-bl-lg border border-transparent px-4 py-2 font-bold duration-200 hover:bg-transparent hover:bg-gradient-to-br"
          >
            Website
          </a>
          <!-- open file explorer to plugin path -->
          <a
            :href="`explorer.exe ${plugin.path}`"
            target="_blank"
            class="bg-powder/90 text-jet hover:border-powder/50 hover:bg-gradient hover:from-powder/10 hover:to-powder/20 hover:text-powder flex grow justify-center border border-transparent px-4 py-2 font-bold duration-200 hover:bg-transparent hover:bg-gradient-to-br"
          >
            Local Path
          </a>
          <button
            class="text-powder hover:bg-jet/50 hover:border-powder/20 relative flex h-full cursor-pointer items-center justify-center rounded-br-lg border px-3 duration-200"
            :class="
              getPluginState(plugin.name).showKey
                ? 'bg-jet/50 border-powder/20'
                : 'bg-powder/20 border-transparent'
            "
            @mouseover="setPluginTooltip(plugin.name, true)"
            @mouseleave="setPluginTooltip(plugin.name, false)"
            @click="togglePluginKey(plugin.name)"
          >
            <!-- Tooltip -->
            <div
              v-if="getPluginState(plugin.name).showTooltip"
              class="bg-jet/50 border-powder/20 absolute right-1/2 bottom-1/2 w-max rounded-lg border px-3 py-2 text-sm backdrop-blur-md"
            >
              Open license key details
            </div>
            <IconKeyFilled class="size-5" />
          </button>
        </div>
        <!-- Key details -->
        <div
          class="bg-jet/50 border-powder/20 absolute inset-6 flex flex-col justify-between gap-2 rounded-lg border p-4 backdrop-blur-md"
          v-if="getPluginState(plugin.name).showKey"
        >
          <div class="text-powder/50">License key:</div>
          <fieldset
            class="c-input c-input--search flex w-full items-center justify-between gap-2"
          >
            <input
              class="text-powder/90 w-full border-none bg-transparent outline-none"
              :value="getPluginState(plugin.name).editedKey || plugin.key"
              @input="
                (event) =>
                  (getPluginState(plugin.name).editedKey = (
                    event.target as HTMLInputElement
                  ).value)
              "
              placeholder="Enter license key..."
            />
            <div class="text-powder/50 flex gap-2">
              <IconCopy
                class="hover:text-powder size-6 cursor-pointer"
                @click="copyToClipboard(plugin.key)"
              />
              <IconDeviceFloppy
                class="hover:text-powder size-6 cursor-pointer"
                @click="saveToDatabase(plugin.id, plugin.name)"
              />
            </div>
          </fieldset>
          <button
            class="c-button c-button--clear"
            @click="togglePluginKey(plugin.name)"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- No Results Message -->
    <div
      v-if="filteredPlugins.length === 0 && plugins.length > 0"
      class="mt-8 text-center"
    >
      <div class="text-powder/50 text-lg">
        No plugins match your current filters.
      </div>
      <button
        @click="clearFilters"
        class="c-button c-button--clear mx-auto mt-4"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { IconKeyFilled, IconCopy, IconDeviceFloppy } from "@tabler/icons-vue";
import { useFetch } from "#app";

// Import the custom select component
import CustomSelect from "~/components/CustomSelect.vue";

interface PluginResponse {
  success: boolean;
  plugins?: any[];
  message?: string;
}

interface UpdatePluginResponse {
  success: boolean;
  message: string;
  plugin: any;
}

interface ScanAndUpdateResponse {
  success: boolean;
  message: string;
  scannedCount?: number;
  totalPluginsCount?: number;
  scannedPaths?: string[];
  skippedPaths?: Array<{ path: string; error: string }>;
  error?: string;
}

// Reactive state
const searchFilter = ref("");
const selectedManufacturer = ref("");
const selectedType = ref("");
const plugins = ref<any[]>([]);
const pluginStates = ref<
  Record<string, { showKey: boolean; showTooltip: boolean; editedKey: string }>
>({});
const isScanning = ref(false);

const copyToClipboard = (key: string) => {
  navigator.clipboard.writeText(key);
};

const saveToDatabase = async (pluginId: string, pluginName: string) => {
  const editedKey = getPluginState(pluginName).editedKey;
  if (!editedKey) {
    console.log("No changes to save");
    return;
  }

  try {
    const { data } = await useFetch<UpdatePluginResponse>(
      "/api/plugins/update",
      {
        method: "POST",
        body: {
          pluginId,
          key: editedKey,
        },
      },
    );

    if (data.value?.success) {
      // Update the local plugin data
      const pluginIndex = plugins.value.findIndex((p) => p.id === pluginId);
      if (pluginIndex !== -1) {
        plugins.value[pluginIndex].key = editedKey;
        plugins.value[pluginIndex].last_updated =
          data.value.plugin.last_updated;
      }
      // Clear the edited key after successful save
      getPluginState(pluginName).editedKey = "";
      console.log("License key saved successfully");
    } else {
      console.error("Failed to save plugin:", data.value?.message);
    }
  } catch (error) {
    console.error("Error saving plugin:", error);
  }
};

// Get device's time format
const getDeviceFormat = (date: string) => {
  const dateFormat = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return dateFormat.toLocaleDateString(undefined, options);
};

// Computed properties for unique values
const uniqueManufacturers = computed(() => {
  const manufacturers = plugins.value.map((plugin) => plugin.manufacturer);
  return [...new Set(manufacturers)].sort();
});

const uniqueTypes = computed(() => {
  const types = plugins.value.map((plugin) => plugin.type);
  return [...new Set(types)].sort();
});

// Options for custom selects
const manufacturerOptions = computed(() => [
  { value: "", label: "All Manufacturers" },
  ...uniqueManufacturers.value.map((manufacturer) => ({
    value: manufacturer,
    label: manufacturer,
  })),
]);

const typeOptions = computed(() => [
  { value: "", label: "All Types" },
  ...uniqueTypes.value.map((type) => ({
    value: type,
    label: type,
  })),
]);

// Filtered plugins based on all filters
const filteredPlugins = computed(() => {
  return plugins.value.filter((plugin) => {
    // Search filter
    const searchMatch =
      !searchFilter.value ||
      plugin.name.toLowerCase().includes(searchFilter.value.toLowerCase()) ||
      plugin.manufacturer
        .toLowerCase()
        .includes(searchFilter.value.toLowerCase());

    // Manufacturer filter
    const manufacturerMatch =
      !selectedManufacturer.value ||
      plugin.manufacturer === selectedManufacturer.value;

    // Type filter
    const typeMatch = !selectedType.value || plugin.type === selectedType.value;

    return searchMatch && manufacturerMatch && typeMatch;
  });
});

// Helper functions for plugin state management
const getPluginState = (pluginName: string) => {
  if (!pluginStates.value[pluginName]) {
    pluginStates.value[pluginName] = {
      showKey: false,
      showTooltip: false,
      editedKey: "",
    };
  }
  return pluginStates.value[pluginName];
};

const setPluginTooltip = (pluginName: string, show: boolean) => {
  getPluginState(pluginName).showTooltip = show;
};

const togglePluginKey = (pluginName: string) => {
  const state = getPluginState(pluginName);
  state.showKey = !state.showKey;

  // Initialize edited key with current value when opening
  if (state.showKey) {
    const plugin = plugins.value.find((p) => p.name === pluginName);
    if (plugin) {
      state.editedKey = plugin.key || "";
    }
  }
};

// Clear all filters
const clearFilters = () => {
  searchFilter.value = "";
  selectedManufacturer.value = "";
  selectedType.value = "";
};

// Scan and update plugins
const scanAndUpdate = async () => {
  isScanning.value = true;

  try {
    const { data } = await useFetch<ScanAndUpdateResponse>(
      "/api/plugins/scan-and-update",
      {
        method: "POST",
      },
    );

    if (data.value?.success) {
      console.log("Scan and update successful:", data.value.message);
      // Show success message
      alert(
        `✅ ${data.value.message}\n\nScanned: ${data.value.scannedCount} plugins\nTotal: ${data.value.totalPluginsCount} plugins`,
      );
      // Refresh the plugins list
      await fetchPlugins();
    } else {
      console.error("Scan and update failed:", data.value?.message);
      alert(`❌ Scan failed: ${data.value?.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error during scan and update:", error);
    alert(
      `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    isScanning.value = false;
  }
};

// Fetch plugins function
const fetchPlugins = async () => {
  try {
    const { data } = await useFetch<PluginResponse>("/api/plugins/list");
    if (data.value?.success && data.value.plugins) {
      plugins.value = data.value.plugins;
    } else {
      console.error("Failed to fetch plugins:", data.value?.message);
    }
  } catch (error) {
    console.error("Error fetching plugins:", error);
  }
};

onMounted(async () => {
  await fetchPlugins();
});
</script>
