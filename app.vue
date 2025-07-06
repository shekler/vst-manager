<!-- app.vue -->
<script setup lang="ts">
import { usePluginStore } from "~/stores/pluginStore";

const pluginStore = usePluginStore();

// Load the mock data when the component mounts
onMounted(() => {
	pluginStore.loadMockData();
});
</script>

<template>
	<div class="bg-gray-900 text-white min-h-screen p-8 font-sans">
		<div class="max-w-7xl mx-auto">
			<h1 class="text-4xl font-bold mb-4">VST Plugin Manager</h1>

			<!-- Search Bar -->
			<div class="mb-6">
				<input type="text" v-model="pluginStore.searchTerm" placeholder="Search for a plugin..." class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
			</div>

			<!-- Plugin Table -->
			<div class="bg-gray-800 rounded-lg overflow-hidden">
				<table class="min-w-full">
					<thead class="bg-gray-700">
						<tr>
							<th class="p-3 text-left">Name</th>
							<th class="p-3 text-left">Vendor</th>
							<th class="p-3 text-left">Format</th>
							<th class="p-3 text-left">Bitness</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="plugin in pluginStore.filteredPlugins" :key="plugin.id" class="border-b border-gray-700 hover:bg-gray-700/50">
							<td class="p-3 font-semibold">{{ plugin.name }}</td>
							<td class="p-3 text-gray-400">{{ plugin.vendor }}</td>
							<td class="p-3">
								<span
									:class="{
										'bg-blue-500/20 text-blue-300': plugin.format === 'VST3',
										'bg-green-500/20 text-green-300': plugin.format === 'VST2',
									}"
									class="px-2 py-1 text-sm rounded-full"
									>{{ plugin.format }}</span
								>
							</td>
							<td class="p-3 text-gray-400">{{ plugin.bitness }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>
