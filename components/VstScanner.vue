<template>
	<div class="max-w-2xl mx-auto p-4">
		<!-- Header -->
		<div class="text-center mb-6">
			<h2 class="text-xl font-bold mb-2">VST3 Scanner</h2>
			<p class="text-gray-600">Scan for VST3 plugins on your system</p>
		</div>

		<!-- Electron Warning -->
		<div v-if="!isElectron()" class="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
			<p class="text-sm text-yellow-800">VST scanning requires Electron. Run <code class="bg-white px-1 rounded">npm run dev</code></p>
		</div>

		<!-- Scan Controls -->
		<div class="mb-6">
			<input v-model="customPath" type="text" placeholder="Enter custom path to scan (optional)" class="w-full p-2 border border-gray-300 rounded mb-3" :disabled="!isElectron()" />

			<div class="flex gap-2">
				<button @click="scanDefaultPaths" :disabled="isScanning || !isElectron()" class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
					{{ isScanning ? "Scanning..." : "Scan Default Paths" }}
				</button>

				<button @click="scanCustomPath" :disabled="isScanning || !customPath || !isElectron()" class="px-4 py-2 border border-gray-300 rounded disabled:opacity-50">Scan Custom Path</button>
			</div>
		</div>

		<!-- Progress Bar -->
		<div v-if="isScanning" class="mb-4">
			<div class="w-full bg-gray-200 rounded h-2 mb-2">
				<div class="bg-blue-500 h-2 rounded transition-all" :style="{ width: `${scanProgress}%` }"></div>
			</div>
			<div class="text-center text-sm text-gray-600">{{ Math.round(scanProgress) }}%</div>
		</div>

		<!-- Error Display -->
		<div v-if="scanError" class="mb-4 p-3 bg-red-100 border border-red-300 rounded">
			<p class="text-sm text-red-800">{{ scanError }}</p>
		</div>

		<!-- Results -->
		<div v-if="vstScan.length > 0" class="space-y-4">
			<h3 class="text-lg font-semibold">Found {{ vstScan.length }} plugins:</h3>

			<div class="border border-gray-200 rounded max-h-96 overflow-y-auto">
				<div v-for="plugin in vstScan" :key="plugin.id" class="p-3 border-b border-gray-100 hover:bg-gray-50">
					<div class="font-medium">{{ plugin.name }}</div>
					<div class="text-sm text-gray-600 truncate">{{ plugin.path }}</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else-if="!isScanning && !scanError" class="text-center py-8 text-gray-600">
			<p v-if="isElectron()">No plugins scanned yet. Click "Scan Default Paths" to start.</p>
			<p v-else>VST scanning is only available in the Electron app.</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useVstScan } from "~/composables/vst-scan";

const { vstScan, isScanning, scanProgress, scanError, scanForVst3Files, scanSpecificPaths, isElectron } = useVstScan();

const customPath = ref("");

const scanDefaultPaths = async () => {
	await scanForVst3Files();
};

const scanCustomPath = async () => {
	if (customPath.value) {
		await scanSpecificPaths([customPath.value]);
		customPath.value = "";
	}
};
</script>
