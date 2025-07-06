// stores/pluginStore.ts
import { defineStore } from "pinia";
import type { VstPlugin } from "~/types/plugin";

export const usePluginStore = defineStore("plugins", () => {
	// ... existing refs (allPlugins, searchTerm)
	const allPlugins = ref<VstPlugin[]>([]);
	const searchTerm = ref("");

	// NEW: State for scan paths
	const scanPaths = ref<string[]>(["C:/Program Files/Steinberg/VSTPlugins", "C:/Program Files/Common Files/VST3"]);
	const newPath = ref(""); // For the input field

	function addPath() {
		if (newPath.value && !scanPaths.value.includes(newPath.value)) {
			scanPaths.value.push(newPath.value);
			newPath.value = ""; // Clear the input
		}
	}

	function removePath(pathToRemove: string) {
		scanPaths.value = scanPaths.value.filter((p) => p !== pathToRemove);
	}

	// ... existing functions and computed properties ...
	async function fetchData() {
		/* ... */
	}
	const filteredPlugins = computed(() => {
		/* ... */
	});

	return {
		allPlugins,
		searchTerm,
		filteredPlugins,
		fetchData,
		// Expose the new state and actions
		scanPaths,
		newPath,
		addPath,
		removePath,
	};
});
