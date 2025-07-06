<!-- app.vue -->
<script setup lang="ts">
import { usePluginStore } from "~/stores/pluginStore";
import ScanSettings from "~/components/ScanSettings.vue"; // Import it

const pluginStore = usePluginStore();
onMounted(() => {
	pluginStore.fetchData();
});
</script>

<template>
	<div class="bg-gray-900 text-white min-h-screen p-8 font-sans">
		<div class="max-w-7xl mx-auto">
			<h1 class="text-4xl font-bold mb-4">VST Plugin Manager</h1>

			<!-- Add the new component here -->
			<ScanSettings />

			<!-- Add a Scan Button -->
			<button class="w-full bg-green-600 hover:bg-green-500 p-4 rounded-lg text-xl font-bold mb-6">Start Scan</button>

			<!-- ... rest of the template (search bar, table) ... -->
		</div>
	</div>
</template>
