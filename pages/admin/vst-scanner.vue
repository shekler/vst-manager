<template>
	<div class="container mx-auto p-4">
		<h1 class="text-3xl font-bold mb-6">VST Plugin Scanner</h1>

		<div class="bg-white p-6 rounded-lg shadow-md mb-8">
			<button @click="startScan" :disabled="isScanning" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" :class="{ 'opacity-50 cursor-not-allowed': isScanning }">
				{{ isScanning ? "Scanning..." : "Scan VST Plugins" }}
			</button>
			<p v-if="scanMessage" :class="{ 'text-green-600': scanSuccess, 'text-red-600': !scanSuccess }" class="mt-4">
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

		<div class="bg-white p-6 rounded-lg shadow-md">
			<h2 class="text-2xl font-semibold mb-4">Scanned Plugins ({{ plugins.length }})</h2>
			<ul class="space-y-2">
				<li v-if="plugins.length === 0 && !isScanning" class="text-gray-500">No plugins found yet. Click "Scan VST Plugins" to begin.</li>
				<li v-for="plugin in plugins" :key="plugin.id" class="border-b pb-2">
					<p><strong>Name:</strong> {{ plugin.name || "N/A" }}</p>
					<p><strong>Vendor:</strong> {{ plugin.vendor || "N/A" }}</p>
					<p v-if="plugin.product"><strong>Product:</strong> {{ plugin.product }}</p>
					<p v-if="plugin.version"><strong>Version:</strong> {{ plugin.version }}</p>
					<p class="text-sm text-gray-600 break-all"><strong>Path:</strong> {{ plugin.filePath }}</p>
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const isScanning = ref(false);
const scanMessage = ref("");
const scanSuccess = ref(true);
const plugins = ref([]);
const skippedPaths = ref([]);

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
	scanMessage.value = "Starting VST scan... This might take a while depending on your system and number of plugins.";
	scanSuccess.value = true;
	skippedPaths.value = [];
	plugins.value = []; // Clear current list while scanning

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
