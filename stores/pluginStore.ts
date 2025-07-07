// stores/pluginStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { VstPlugin } from "~/types/plugin";

export const usePluginStore = defineStore("plugins", () => {
	const allPlugins = ref<VstPlugin[]>([]);
	const searchTerm = ref("");

	const filteredPlugins = computed(() => {
		if (!searchTerm.value) return allPlugins.value;

		return allPlugins.value.filter((plugin) => plugin.name.toLowerCase().includes(searchTerm.value.toLowerCase()) || plugin.path.toLowerCase().includes(searchTerm.value.toLowerCase()));
	});

	function setPlugins(plugins: VstPlugin[]) {
		allPlugins.value = plugins;
	}

	function clearPlugins() {
		allPlugins.value = [];
	}

	return {
		allPlugins,
		searchTerm,
		filteredPlugins,
		setPlugins,
		clearPlugins,
	};
});
