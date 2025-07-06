<!-- components/ScanSettings.vue -->
<script setup lang="ts">
import { usePluginStore } from "~/stores/pluginStore";
const pluginStore = usePluginStore();
</script>

<template>
	<div class="bg-gray-800 p-6 rounded-lg mb-6">
		<h2 class="text-2xl font-bold mb-4">Scan Folders</h2>
		<ul class="space-y-2 mb-4">
			<li v-for="path in pluginStore.scanPaths" :key="path" class="flex justify-between items-center bg-gray-700 p-2 rounded">
				<span class="font-mono text-sm">{{ path }}</span>
				<button @click="pluginStore.removePath(path)" class="text-red-400 hover:text-red-300">Remove</button>
			</li>
		</ul>
		<div class="flex space-x-2">
			<input type="text" v-model="pluginStore.newPath" @keyup.enter="pluginStore.addPath" placeholder="Add a new folder path..." class="flex-grow p-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
			<button @click="pluginStore.addPath" class="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold">Add</button>
		</div>
	</div>
</template>
