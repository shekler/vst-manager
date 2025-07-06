<!-- pages/index.vue -->
<script setup lang="ts">
import { ref } from "vue";

// This type definition helps with TypeScript.
// You can expand it based on what vst-scanner provides.
interface VstPlugin {
	name: string;
	vendor: string;
	path: string;
	subCategories: string[];
}

interface ScanResult {
	vst2: VstPlugin[];
	vst3: VstPlugin[];
	au: VstPlugin[];
	ladspa: VstPlugin[];
}

const plugins = ref<ScanResult | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

async function startScan() {
	isLoading.value = true;
	error.value = null;
	plugins.value = null;

	try {
		// 'window.ipcRenderer' is made available by Electron's preload script
		// It's the bridge to the main process (our backend)
		const result: ScanResult = await window.ipcRenderer.invoke("scan-vsts");
		plugins.value = result;
	} catch (e: any) {
		console.error("Failed to scan VSTs:", e);
		error.value = e.message || "An unknown error occurred during the scan.";
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
	<div class="container">
		<header>
			<h1>VST Plugin Scanner</h1>
			<p>Click the button to scan default VST locations on your system using Electron's backend.</p>
		</header>

		<main>
			<button @click="startScan" :disabled="isLoading">
				{{ isLoading ? "Scanning..." : "Start Scan" }}
			</button>

			<div v-if="error" class="error-box"><strong>Scan Failed:</strong> {{ error }}</div>

			<div v-if="plugins" class="results">
				<div v-if="plugins.vst3.length" class="plugin-list">
					<h2>VST3 Plugins ({{ plugins.vst3.length }})</h2>
					<ul>
						<li v-for="plugin in plugins.vst3" :key="plugin.path">
							<strong>{{ plugin.name }}</strong> by {{ plugin.vendor }}
							<br />
							<small>{{ plugin.path }}</small>
						</li>
					</ul>
				</div>

				<!-- You can add similar lists for VST2, AU, etc. -->
				<div v-if="plugins.vst2.length" class="plugin-list">
					<h2>VST2 Plugins ({{ plugins.vst2.length }})</h2>
					<!-- ... list rendering ... -->
				</div>
			</div>
		</main>
	</div>
</template>

<style scoped>
.container {
	font-family: sans-serif;
	max-width: 800px;
	margin: 2rem auto;
	padding: 1rem;
}
header {
	text-align: center;
	border-bottom: 1px solid #eee;
	padding-bottom: 1rem;
	margin-bottom: 2rem;
}
button {
	display: block;
	margin: 0 auto 2rem auto;
	padding: 12px 24px;
	font-size: 1.2rem;
	cursor: pointer;
	background-color: #00dc82;
	color: #1e1e1e;
	border: none;
	border-radius: 8px;
}
button:disabled {
	background-color: #ccc;
	cursor: not-allowed;
}
.error-box {
	background-color: #ffdddd;
	border: 1px solid #ff8888;
	color: #d8000c;
	padding: 1rem;
	border-radius: 8px;
	margin-bottom: 2rem;
}
.plugin-list {
	margin-top: 2rem;
}
.plugin-list ul {
	list-style: none;
	padding: 0;
}
.plugin-list li {
	background-color: #f9f9f9;
	padding: 1rem;
	border-radius: 4px;
	margin-bottom: 0.5rem;
}
small {
	color: #666;
}
</style>
