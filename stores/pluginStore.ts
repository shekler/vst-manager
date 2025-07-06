// stores/pluginStore.ts
import { defineStore } from "pinia";
import { mockPlugins } from "~/data/mock-plugins";
import type { VstPlugin } from "~/types/plugin";

export const usePluginStore = defineStore("plugins", () => {
	const allPlugins = ref<VstPlugin[]>([]);
	const searchTerm = ref("");

	// Load the mock data when the store is created
	function loadMockData() {
		allPlugins.value = mockPlugins;
	}

	// A computed property to automatically filter plugins based on the search term
	const filteredPlugins = computed(() => {
		if (!searchTerm.value) {
			return allPlugins.value;
		}
		return allPlugins.value.filter((plugin) => plugin.name.toLowerCase().includes(searchTerm.value.toLowerCase()));
	});

	return {
		allPlugins,
		searchTerm,
		filteredPlugins,
		loadMockData,
	};
});
