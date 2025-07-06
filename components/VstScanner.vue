<template>
	<div class="max-w-4xl mx-auto p-6">
		<!-- Header -->
		<div class="text-center mb-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-2">VST3 Scanner</h2>
			<p class="text-gray-600">Scan for VST3 plugins on your system</p>
		</div>

		<!-- Electron Not Available Warning -->
		<div v-if="!isElectron()" class="mb-6">
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-amber-800">Electron Required</h3>
						<div class="mt-2 text-sm text-amber-700">
							<p class="mb-2">VST scanning requires the Electron app to access your file system.</p>
							<p class="text-sm">To use the scanner, run: <code class="bg-gray-100 px-2 py-1 rounded">npm run dev</code></p>
							<div class="mt-3">
								<button @click="loadMockData" :disabled="isScanning" class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
									{{ isScanning ? "Loading Demo..." : "Try Demo with Mock Data" }}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Scan Controls -->
		<div class="space-y-4 mb-8">
			<input v-model="customPath" type="text" placeholder="Enter custom path to scan (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!isElectron()" />

			<div class="flex gap-3 flex-wrap">
				<button @click="scanDefaultPaths" :disabled="isScanning || !isElectron()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
					<svg v-if="isScanning" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					{{ isScanning ? "Scanning..." : "Scan Default Paths" }}
				</button>

				<button @click="scanCustomPath" :disabled="isScanning || !customPath || !isElectron()" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">Scan Custom Path</button>
			</div>
		</div>

		<!-- Progress Bar -->
		<div v-if="isScanning" class="mb-6">
			<div class="w-full bg-gray-200 rounded-full h-2 mb-2">
				<div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${scanProgress}%` }"></div>
			</div>
			<div class="text-center text-sm text-gray-600">{{ Math.round(scanProgress) }}%</div>
		</div>

		<!-- Error Display -->
		<div v-if="scanError" class="mb-6">
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Error</h3>
						<div class="mt-2 text-sm text-red-700">
							{{ scanError }}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Results -->
		<div v-if="vstScan.length > 0" class="space-y-6">
			<!-- Results Header -->
			<div class="flex justify-between items-center pb-4 border-b border-gray-200">
				<h3 class="text-xl font-semibold text-gray-900">Scan Results ({{ vstScan.length }} plugins found)</h3>

				<div v-if="scanStats" class="flex gap-6">
					<div class="text-center">
						<div class="text-xs text-gray-500 mb-1">Total</div>
						<div class="text-lg font-bold text-blue-600">{{ scanStats.total }}</div>
					</div>
					<div v-if="scanStats.byVendor" class="text-center">
						<div class="text-xs text-gray-500 mb-1">Vendors</div>
						<div class="text-lg font-bold text-blue-600">
							{{ Object.keys(scanStats.byVendor).length }}
						</div>
					</div>
				</div>
			</div>

			<!-- Plugins List -->
			<div class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
				<div v-for="plugin in vstScan" :key="plugin.id" class="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
					<div class="flex-1 min-w-0">
						<div class="font-semibold text-gray-900 mb-1 truncate">
							{{ plugin.name }}
						</div>
						<div class="text-sm text-gray-600 mb-1">
							{{ plugin.vendor }}
						</div>
						<div class="text-xs text-gray-500 font-mono break-all">
							{{ plugin.path }}
						</div>
					</div>

					<div class="flex gap-2 ml-4 flex-shrink-0">
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
							{{ plugin.format }}
						</span>
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
							{{ plugin.bitness }}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else-if="!isScanning && !scanError" class="text-center py-12 text-gray-600">
			<p v-if="isElectron()" class="text-lg">No plugins scanned yet. Click "Scan Default Paths" to start.</p>
			<p v-else class="text-lg">VST scanning is only available in the Electron app.</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useVstScan } from "~/composables/vst-scan";

const { vstScan, isScanning, scanProgress, scanError, scanForVst3Files, scanSpecificPaths, getScanStats, isElectron, loadMockData } = useVstScan();

const customPath = ref("");

const scanStats = computed(() => getScanStats());

const scanDefaultPaths = async () => {
	await scanForVst3Files();
};

const scanCustomPath = async () => {
	if (customPath.value) {
		await scanSpecificPaths([customPath.value]);
		customPath.value = ""; // Clear after scanning
	}
};
</script>
