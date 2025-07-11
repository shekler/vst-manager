<template>
  <div class="container mx-auto p-6">
    <h1 class="mb-6 text-3xl font-bold">Plugin Database Crawler</h1>

    <div class="mb-6 rounded-lg bg-white p-6 shadow-md">
      <h2 class="mb-4 text-xl font-semibold">
        Crawl External Plugin Databases
      </h2>

      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Select Sources:
        </label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="checkbox"
              v-model="selectedSources"
              value="pluginboutique"
              class="mr-2"
            />
            Plugin Boutique
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              v-model="selectedSources"
              value="kvr"
              class="mr-2"
            />
            KVR Audio
          </label>
        </div>
      </div>

      <button
        @click="startCrawl"
        :disabled="isCrawling"
        class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
      >
        {{ isCrawling ? "Crawling..." : "Start Crawl" }}
      </button>
    </div>

    <!-- Results -->
    <div v-if="crawlResults" class="rounded-lg bg-white p-6 shadow-md">
      <h3 class="mb-4 text-lg font-semibold">Crawl Results</h3>

      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded bg-blue-50 p-4">
          <div class="text-2xl font-bold text-blue-600">
            {{ crawlResults.count }}
          </div>
          <div class="text-sm text-gray-600">Total Plugins</div>
        </div>
        <div class="rounded bg-green-50 p-4">
          <div class="text-2xl font-bold text-green-600">
            {{ crawlResults.manufacturers?.length || 0 }}
          </div>
          <div class="text-sm text-gray-600">Manufacturers</div>
        </div>
        <div class="rounded bg-purple-50 p-4">
          <div class="text-2xl font-bold text-purple-600">
            {{ crawlResults.sources?.length || 0 }}
          </div>
          <div class="text-sm text-gray-600">Sources</div>
        </div>
      </div>

      <!-- Sample Data -->
      <div v-if="crawlResults.data && crawlResults.data.length > 0">
        <h4 class="mb-2 font-semibold">Sample Data (First 10):</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-2 text-left">Name</th>
                <th class="px-4 py-2 text-left">Manufacturer</th>
                <th class="px-4 py-2 text-left">Source</th>
                <th class="px-4 py-2 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="plugin in crawlResults.data"
                :key="plugin.name"
                class="border-b"
              >
                <td class="px-4 py-2">{{ plugin.name }}</td>
                <td class="px-4 py-2">{{ plugin.manufacturer }}</td>
                <td class="px-4 py-2">{{ plugin.source }}</td>
                <td class="px-4 py-2">{{ plugin.price || "N/A" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <div class="text-red-800">{{ errorMessage }}</div>
    </div>

    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4"
    >
      <div class="text-green-800">{{ successMessage }}</div>
    </div>
  </div>
</template>

<script setup>
const selectedSources = ref(["pluginboutique"]);
const isCrawling = ref(false);
const crawlResults = ref(null);
const errorMessage = ref("");
const successMessage = ref("");

const startCrawl = async () => {
  if (selectedSources.value.length === 0) {
    errorMessage.value = "Please select at least one source to crawl.";
    return;
  }

  isCrawling.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const sources = selectedSources.value.join(",");
    const { data } = await useFetch(`/api/plugins/crawl?sources=${sources}`, {
      method: "POST",
    });

    if (data.value && data.value.success) {
      crawlResults.value = data.value;
      successMessage.value = data.value.message;
    } else {
      errorMessage.value = data.value?.message || "Crawl failed";
    }
  } catch (error) {
    errorMessage.value = `Error during crawl: ${error.message}`;
    console.error("Crawl error:", error);
  } finally {
    isCrawling.value = false;
  }
};
</script>
