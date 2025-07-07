import { ref } from "vue";
import type { VstPlugin } from "~/types/plugin";

export const useVstScan = () => {
	const vstScan = ref<VstPlugin[]>([]);
	const isScanning = ref(false);
	const scanProgress = ref(0);
	const scanError = ref<string | null>(null);

	// Check if running in Electron
	const isElectron = () => {
		return typeof window !== "undefined" && (window as any).electronAPI;
	};

	// Common VST3 paths for Windows and Mac
	const defaultPaths = {
		windows: ["C:/Program Files/Common Files/VST3", "C:/Program Files/Steinberg/VSTPlugins"],
		mac: ["/Library/Audio/Plug-Ins/VST3", "~/Library/Audio/Plug-Ins/VST3"],
	};

	// Function to get platform-specific paths
	const getPlatformPaths = () => {
		if (typeof window !== "undefined" && window.navigator) {
			const platform = window.navigator.platform.toLowerCase();
			if (platform.includes("win")) {
				return defaultPaths.windows;
			} else if (platform.includes("mac")) {
				return defaultPaths.mac;
			}
		}
		return [...defaultPaths.windows, ...defaultPaths.mac];
	};

	// Function to scan a single directory recursively
	const scanDirectory = async (dirPath: string): Promise<VstPlugin[]> => {
		try {
			if (isElectron()) {
				const result = await (window as any).electronAPI.scanDirectory(dirPath);
				return result;
			} else {
				throw new Error("VST scanning is only available in the Electron app. Please run 'npm run dev'.");
			}
		} catch (error) {
			console.error(`Error scanning directory ${dirPath}:`, error);
			throw error;
		}
	};

	// Main scanning function
	const scanForVst3Files = async (customPaths?: string[]) => {
		isScanning.value = true;
		scanProgress.value = 0;
		scanError.value = null;
		vstScan.value = [];

		try {
			if (!isElectron()) {
				throw new Error("VST scanning is only available in the Electron app. Please run 'npm run dev'.");
			}

			const pathsToScan = customPaths || getPlatformPaths();
			const allPlugins: VstPlugin[] = [];

			for (let i = 0; i < pathsToScan.length; i++) {
				const path = pathsToScan[i];
				scanProgress.value = (i / pathsToScan.length) * 100;

				try {
					const pluginsInPath = await scanDirectory(path);
					allPlugins.push(...pluginsInPath);
				} catch (error) {
					console.warn(`Failed to scan path: ${path}`, error);
				}
			}

			// Remove duplicates based on file path
			const uniquePlugins = allPlugins.filter((plugin, index, self) => index === self.findIndex((p) => p.path === plugin.path));

			vstScan.value = uniquePlugins;
			scanProgress.value = 100;
		} catch (error) {
			scanError.value = error instanceof Error ? error.message : "Unknown error occurred";
			console.error("VST scan failed:", error);
		} finally {
			isScanning.value = false;
		}
	};

	// Function to scan specific paths
	const scanSpecificPaths = async (paths: string[]) => {
		await scanForVst3Files(paths);
	};

	return {
		vstScan,
		isScanning,
		scanProgress,
		scanError,
		scanForVst3Files,
		scanSpecificPaths,
		getPlatformPaths,
		isElectron,
	};
};
