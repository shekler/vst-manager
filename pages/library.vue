<template>
  <div>
    <h1 class="text-4xl font-bold">Library</h1>
    <div class="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <div
        v-for="plugin in plugins"
        :key="plugin.name"
        class="from-onyx to-onyx/50 relative flex flex-col overflow-hidden rounded-lg bg-gradient-to-br"
      >
        <div
          class="pointer-events-none absolute top-0 left-0 size-32 -translate-y-1/2 rounded-full bg-white opacity-30 blur-[100px]"
        ></div>
        <div class="grid grow grid-cols-3 gap-4 p-4">
          <div class="relative">
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
            class="bg-powder/90 text-jet hover:border-powder/50 hover:bg-gradient hover:from-powder/10 hover:to-powder/20 hover:text-powder flex grow justify-center rounded-br-lg border border-transparent px-4 py-2 font-bold duration-200 hover:bg-transparent hover:bg-gradient-to-br"
          >
            Local Path
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface PluginResponse {
  success: boolean;
  plugins?: any[];
  message?: string;
}

const plugins = ref<any[]>([]);

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

onMounted(async () => {
  try {
    const response = await $fetch<PluginResponse>("/api/plugins/list");
    if (response.success && response.plugins) {
      plugins.value = response.plugins;
    } else {
      console.error("Failed to fetch plugins:", response.message);
    }
  } catch (error) {
    console.error("Error fetching plugins:", error);
  }
});
</script>
