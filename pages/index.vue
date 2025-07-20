<template>
  <div>
    <h1 class="text-4xl font-bold">Library</h1>

    <!-- Database Import Section -->
    <div class="from-onyx to-onyx/50 mt-6 mb-4 rounded-lg bg-gradient-to-br p-6">
      <h2 class="text-powder/90 mb-4 text-xl font-bold">Database</h2>
      <div class="flex flex-col justify-between gap-8 lg:flex-row">
        <div class="flex flex-col gap-2">
          <VstScanner @scan-complete="handleScanComplete" />
          <p class="text-powder/70 text-sm">Scan for VST plugins using the paths configured in <NuxtLink to="/settings" class="text-mint hover:text-powder font-bold underline">Settings</NuxtLink>.</p>
        </div>

        <!-- Delete All Section -->
        <div class="flex flex-col gap-2 lg:items-end">
          <button @click="showDeleteConfirm = true" :disabled="loading" class="c-button c-button--red w-fit">
            {{ loading ? "Deleting..." : "Delete Plugins" }}
          </button>
          <p class="text-powder/70 text-sm">Clear database and all plugins (includes license keys).</p>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ModalWindow v-model="showDeleteConfirm" title="Confirm Deletion">
      <p class="text-powder/70 mt-2 text-sm">Are you sure you want to delete all plugins? License keys will be lost. This action cannot be undone.</p>

      <template #footer>
        <button @click="showDeleteConfirm = false" class="c-button c-button--clear flex-1">Cancel</button>
        <button @click="confirmDeleteAll" :disabled="loading" class="c-button c-button--red flex-1">
          {{ loading ? "Deleting..." : "Delete All" }}
        </button>
      </template>
    </ModalWindow>

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

        <!-- Type Filter -->
        <div class="flex flex-col gap-2">
          <label for="type" class="text-powder/70 text-sm font-bold">Type</label>
          <CustomSelect v-model="selectedType" :options="typeOptions" placeholder="All Types" :show-search="uniqueTypes.length > 10" />
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
      <p class="text-pretty">This is a beta version. Bugs and errors might occur. If you want to submit a bug issue, you can do so in <a href="https://github.com/shekler/vst-manager/issues" target="_blank" class="text-powder hover:text-red font-bold underline duration-200">GitHub</a>. Avoid saving sensitive data in the app.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mt-8 text-center">
      <div class="text-powder/50 text-lg"><IconLoader2 class="animate-spin" /> Loading plugins...</div>
    </div>

    <!-- Plugin Grid -->
    <div v-else-if="filteredPlugins.length > 0" class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <!-- Plugin library view -->
      <div v-for="plugin in filteredPlugins" :key="plugin.name" class="from-onyx to-onyx/50 relative flex flex-col overflow-hidden rounded-lg bg-gradient-to-br">
        <div class="pointer-events-none absolute top-0 left-0 size-32 -translate-y-1/2 rounded-full bg-white opacity-30 blur-[100px]"></div>
        <div class="grid grow grid-cols-3 gap-4 p-4">
          <div class="relative" v-if="plugin.image && plugin.image.trim()">
            <NuxtImg :src="plugin.image" :alt="`${plugin.name} Screenshot`" class="absolute inset-0 size-fit max-h-full max-w-full self-start justify-self-center" />
          </div>
          <div
            class="flex flex-col"
            :class="{
              'col-span-3': !plugin.image,
              'col-span-2': plugin.image,
            }"
          >
            <div class="leading-none">
              <div class="text-powder/50">{{ plugin.manufacturer || "Unknown" }}</div>
              <h2 class="text-powder/90 text-xl font-bold">
                {{ plugin.name || "Unknown Plugin" }}
              </h2>
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <div v-for="category in plugin.categories || []" :key="category" class="text-powder/70 border-powder/20 rounded border px-1.5 py-1 text-xs leading-none">
                {{ category }}
              </div>
            </div>

            <div class="text-powder/50 mt-2 flex flex-col text-sm">
              <div class="font-bold">Version:</div>
              <div class="text-powder/70">{{ plugin.version || "Unknown" }}</div>
            </div>
            <div class="text-powder/50 mt-2 flex flex-wrap justify-between gap-2 text-sm">
              <div class="flex flex-col">
                <div class="font-bold">Scanned:</div>
                <div class="text-powder/70">
                  <NuxtTime v-if="plugin.date_scanned" :datetime="plugin.date_scanned" :format="getDeviceFormat" />
                  <span v-else>Unknown</span>
                </div>
              </div>
              <div class="flex flex-col">
                <div class="font-bold">Plugin Type:</div>
                <div class="text-powder/70">
                  {{ plugin.sdkVersion || "Unknown" }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex">
          <a v-if="plugin.url" :href="plugin.url" target="_blank" class="bg-mint text-jet hover:border-mint/50 hover:bg-gradient hover:from-mint/10 hover:to-mint/20 hover:text-mint flex grow justify-center rounded-bl-lg border border-transparent px-4 py-2 font-bold duration-200 hover:bg-transparent hover:bg-gradient-to-br"> Website </a>
          <button v-else disabled class="bg-powder/20 text-powder/50 flex grow cursor-not-allowed justify-center rounded-bl-lg border border-transparent px-4 py-2 font-bold">No Website</button>
          <!-- open file explorer to plugin path -->
          <button v-if="plugin.path" class="bg-powder/90 text-jet hover:border-powder/50 hover:bg-gradient hover:from-powder/10 hover:to-powder/20 hover:text-powder flex grow cursor-pointer justify-center border border-transparent px-4 py-2 font-bold duration-200 hover:bg-transparent hover:bg-gradient-to-br" @click="showLocalPath[plugin.name] = !showLocalPath[plugin.name]">Local Path</button>
          <button v-else disabled class="bg-powder/20 text-powder/50 flex grow cursor-not-allowed justify-center border border-transparent px-4 py-2 font-bold">No Path</button>
          <div class="bg-jet/50 border-powder/20 absolute inset-6 flex flex-col justify-between gap-2 rounded-lg border p-4 backdrop-blur-md" v-if="showLocalPath[plugin.name] && plugin.path">
            {{ plugin.path }}
            <div class="flex gap-2">
              <button class="c-button c-button--clear w-full" @click="copyToClipboard(getPathToCopy(plugin.path))">Copy</button>
              <button class="c-button c-button--clear w-full" @click="openFileExplorer(getPathToCopy(plugin.path))">Open Folder</button>
              <button class="c-button c-button--clear w-full" @click="showLocalPath[plugin.name] = false">Close</button>
            </div>
          </div>
          <button class="text-powder hover:bg-jet/50 hover:border-powder/20 relative flex h-full cursor-pointer items-center justify-center rounded-br-lg border px-3 duration-200" :class="getPluginState(plugin.name).showKey ? 'bg-jet/50 border-powder/20' : 'bg-powder/20 border-transparent'" @mouseover="setPluginTooltip(plugin.name, true)" @mouseleave="setPluginTooltip(plugin.name, false)" @click="togglePluginKey(plugin.name)">
            <!-- Tooltip -->
            <div v-if="getPluginState(plugin.name).showTooltip" class="bg-jet/50 border-powder/20 absolute right-1/2 bottom-1/2 w-max rounded-lg border px-3 py-2 text-sm backdrop-blur-md">Open license key details</div>
            <IconKeyFilled class="size-5" />
          </button>
        </div>
        <!-- Key details -->
        <div class="bg-jet/50 border-powder/20 absolute inset-6 flex flex-col justify-between gap-2 rounded-lg border p-4 backdrop-blur-md" v-if="getPluginState(plugin.name).showKey">
          <div class="text-powder/50 flex items-center gap-2">
            License key:
            <div v-if="isPluginUpdating(plugin.id)" class="text-mint animate-pulse text-xs">Saving...</div>
          </div>
          <fieldset class="c-input c-input--search flex w-full items-center justify-between gap-2">
            <input class="text-powder/90 w-full border-none bg-transparent outline-none" :value="getPluginState(plugin.name).editedKey || plugin.key || ''" @input="(event) => (getPluginState(plugin.name).editedKey = (event.target as HTMLInputElement).value)" placeholder="Enter license key..." />
            <div class="text-powder/50 flex gap-2">
              <IconCopy class="hover:text-powder size-6 cursor-pointer" @click="copyToClipboard(plugin.key || '')" />
              <IconDeviceFloppy :class="['size-6 cursor-pointer', isPluginUpdating(plugin.id) ? 'text-mint animate-pulse' : 'hover:text-powder']" @click="saveToDatabase(plugin.id, plugin.name)" />
            </div>
          </fieldset>
          <button class="c-button c-button--clear" @click="togglePluginKey(plugin.name)">Close</button>
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
const { plugins, loading, error, fetchPlugins, updatePlugin, updatePluginKey, isPluginUpdating, deleteAllPlugins } = usePlugins();

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
const showDeleteConfirm = ref(false);
const pluginStates = ref<Record<string, { showKey: boolean; showTooltip: boolean; editedKey: string }>>({});
const showLocalPath = ref<Record<string, boolean>>({});
// Remove file name and extension from path
const getPathToCopy = (path: string) => {
  return path.split("\\").slice(0, -1).join("\\");
};

// Handle scan complete
const handleScanComplete = async (scanData: any) => {
  // Refresh the plugins list after scanning
  await fetchPlugins();
};

// Handle delete all plugins
const confirmDeleteAll = async () => {
  const result = await deleteAllPlugins();
  if (result.success) {
    success("All plugins deleted successfully");
  } else {
    showError(result.message || "Delete failed");
  }
  showDeleteConfirm.value = false;
};

const copyToClipboard = (key: string) => {
  navigator.clipboard.writeText(key);
  success("Copied to clipboard");
};

const saveToDatabase = async (pluginId: string, pluginName: string) => {
  const editedKey = getPluginState(pluginName).editedKey;
  if (!editedKey) {
    console.log("No changes to save");
    return;
  }

  try {
    const result = await updatePluginKey(pluginId, editedKey);

    if (result.success) {
      // Clear the edited key after successful save
      getPluginState(pluginName).editedKey = "";
      // Close the key editing panel
      getPluginState(pluginName).showKey = false;
      success("License key saved successfully");
    } else {
      showError("Failed to save license key: " + result.message);
    }
  } catch (error) {
    showError("Error saving plugin key");
    console.error("Error saving plugin:", error);
  }
};

// Get device's time format
const getDeviceFormat = (date: string) => {
  if (!date) return "";
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
  if (!plugins.value || !Array.isArray(plugins.value)) {
    return [];
  }
  const manufacturers = plugins.value.filter((plugin: any) => plugin && plugin.manufacturer).map((plugin: any) => plugin.manufacturer);
  return [...new Set(manufacturers)].sort();
});

const uniqueTypes = computed(() => {
  if (!plugins.value || !Array.isArray(plugins.value)) {
    return [];
  }
  const types = plugins.value.filter((plugin: any) => plugin && plugin.categories && Array.isArray(plugin.categories)).flatMap((plugin: any) => plugin.categories);
  return [...new Set(types)].sort();
});

// Options for custom selects
const manufacturerOptions = computed(() => [
  { value: "", label: "All Manufacturers" },
  ...uniqueManufacturers.value.map((manufacturer) => ({
    value: manufacturer as string,
    label: manufacturer as string,
  })),
]);

const typeOptions = computed(() => [
  { value: "", label: "All Types" },
  ...uniqueTypes.value.map((type) => ({
    value: type as string,
    label: type as string,
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
    const searchMatch = !searchFilter.value || (plugin.name && plugin.name.toLowerCase().includes(searchFilter.value.toLowerCase())) || (plugin.manufacturer && plugin.manufacturer.toLowerCase().includes(searchFilter.value.toLowerCase()));

    // Manufacturer filter
    const manufacturerMatch = !selectedManufacturer.value || plugin.manufacturer === selectedManufacturer.value;

    // Type filter
    const typeMatch = !selectedType.value || (plugin.categories && Array.isArray(plugin.categories) && plugin.categories.includes(selectedType.value));

    return searchMatch && manufacturerMatch && typeMatch;
  });
});

// Helper functions for plugin state management
const getPluginState = (pluginName: string) => {
  if (!pluginName || typeof pluginName !== "string") {
    return {
      showKey: false,
      showTooltip: false,
      editedKey: "",
    };
  }

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
    const plugin = plugins.value.find((p: any) => p.name === pluginName);
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
</script>
