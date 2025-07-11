<template>
  <section>
    <h1 class="text-4xl font-bold">Library</h1>
    <div class="mt-4 grid grid-cols-4 gap-4">
      <div
        v-for="plugin in plugins"
        :key="plugin.name"
        class="from-onyx to-onyx/50 relative flex flex-col overflow-hidden rounded-lg bg-gradient-to-br p-4"
      >
        <div
          class="pointer-events-none absolute top-0 left-0 size-32 -translate-y-1/2 rounded-full bg-white opacity-50 blur-[100px]"
        ></div>
        <div class="leading-none">
          <div class="text-powder/50">{{ plugin.manufacturer }}</div>
          <h2 class="text-powder/90 text-xl font-bold">{{ plugin.name }}</h2>
        </div>
        <div
          class="text-powder/50 mt-2 flex flex-wrap justify-between gap-2 text-sm"
        >
          <p><b>Version:</b> {{ plugin.version }}</p>
          <p><b>Type:</b> {{ plugin.type }}</p>
        </div>
        <div class="text-powder/50 mt-2 text-sm">
          <p><b>Updated:</b> {{ plugin.last_updated }}</p>
          <p><b>Scanned:</b> {{ plugin.date_scanned }}</p>
        </div>
        <a
          :href="plugin.url"
          target="_blank"
          class="text-mint/50 hover:text-mint mt-2 text-sm underline underline-offset-4 duration-200"
        >
          Manufacturer Website
        </a>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
interface PluginResponse {
  success: boolean;
  plugins?: any[];
  message?: string;
}

const plugins = ref<any[]>([]);

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
