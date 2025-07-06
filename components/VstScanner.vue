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
					<div v-if="scanStats.byCategory" class="text-center">
						<div class="text-xs text-gray-500 mb-1">Categories</div>
						<div class="text-lg font-bold text-blue-600">
							{{ Object.keys(scanStats.byCategory).length }}
						</div>
					</div>
					<div v-if="scanStats.totalSize" class="text-center">
						<div class="text-xs text-gray-500 mb-1">Total Size</div>
						<div class="text-lg font-bold text-blue-600">
							{{ formatFileSize(scanStats.totalSize) }}
						</div>
					</div>
				</div>
			</div>

			<!-- Statistics Summary -->
			<div v-if="scanStats && (scanStats.byCategory || scanStats.byLicense || scanStats.newestPlugin || scanStats.oldestPlugin)" class="mb-6 p-4 bg-gray-50 rounded-lg">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
					<div v-if="scanStats.byCategory">
						<div class="font-medium text-gray-700 mb-2">Top Categories</div>
						<div class="space-y-1">
							<div v-for="[category, count] in Object.entries(scanStats.byCategory).slice(0, 3)" :key="category" class="flex justify-between">
								<span class="text-gray-600">{{ category }}</span>
								<span class="font-medium">{{ count }}</span>
							</div>
						</div>
					</div>

					<div v-if="scanStats.byLicense">
						<div class="font-medium text-gray-700 mb-2">Licenses</div>
						<div class="space-y-1">
							<div v-for="[license, count] in Object.entries(scanStats.byLicense)" :key="license" class="flex justify-between">
								<span class="text-gray-600">{{ license }}</span>
								<span class="font-medium">{{ count }}</span>
							</div>
						</div>
					</div>

					<div v-if="scanStats.newestPlugin">
						<div class="font-medium text-gray-700 mb-2">Newest Plugin</div>
						<div class="text-gray-600">{{ scanStats.newestPlugin.name }}</div>
						<div class="text-xs text-gray-500">{{ formatDate(scanStats.newestPlugin.installDate!) }}</div>
					</div>

					<div v-if="scanStats.oldestPlugin">
						<div class="font-medium text-gray-700 mb-2">Oldest Plugin</div>
						<div class="text-gray-600">{{ scanStats.oldestPlugin.name }}</div>
						<div class="text-xs text-gray-500">{{ formatDate(scanStats.oldestPlugin.installDate!) }}</div>
					</div>
				</div>
			</div>

			<!-- Plugins List -->
			<div class="space-y-4">
				<div v-for="plugin in vstScan" :key="plugin.id" class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
					<!-- Header Row -->
					<div class="flex justify-between items-start mb-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3 mb-2">
								<h4 class="text-lg font-semibold text-gray-900 truncate">
									{{ plugin.name }}
								</h4>
								<div class="flex gap-2">
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{{ plugin.format }}
									</span>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
										{{ plugin.bitness }}
									</span>
									<span v-if="plugin.category" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
										{{ plugin.category }}
									</span>
									<span v-if="plugin.license" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
										{{ plugin.license }}
									</span>
								</div>
							</div>
							<div class="text-sm text-gray-600 mb-1">
								<strong>Vendor:</strong> {{ plugin.vendor }}
								<span v-if="plugin.manufacturer && plugin.manufacturer !== plugin.vendor" class="text-gray-500"> ({{ plugin.manufacturer }}) </span>
							</div>
							<div v-if="plugin.version" class="text-sm text-gray-600 mb-1"><strong>Version:</strong> {{ plugin.version }}</div>
						</div>
					</div>

					<!-- Description -->
					<div v-if="plugin.description" class="mb-4">
						<p class="text-sm text-gray-700 leading-relaxed">{{ plugin.description }}</p>
					</div>

					<!-- Metadata Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-sm">
						<div v-if="plugin.fileSize" class="flex items-center gap-2">
							<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
							<span class="text-gray-600"><strong>Size:</strong> {{ formatFileSize(plugin.fileSize) }}</span>
						</div>

						<div v-if="plugin.installDate" class="flex items-center gap-2">
							<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
							</svg>
							<span class="text-gray-600"><strong>Installed:</strong> {{ formatDate(plugin.installDate) }}</span>
						</div>

						<div v-if="plugin.website" class="flex items-center gap-2">
							<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
							</svg>
							<a :href="plugin.website" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
								<strong>Website</strong>
							</a>
						</div>
					</div>

					<!-- Tags -->
					<div v-if="plugin.tags && plugin.tags.length > 0" class="mb-4">
						<div class="flex flex-wrap gap-2">
							<span v-for="tag in plugin.tags" :key="tag" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
								{{ tag }}
							</span>
						</div>
					</div>

					<!-- File Path -->
					<div class="border-t border-gray-100 pt-3">
						<div class="text-xs text-gray-500 font-mono break-all"><strong>Path:</strong> {{ plugin.path }}</div>
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

// Utility functions
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (date: Date): string => {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
};

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
