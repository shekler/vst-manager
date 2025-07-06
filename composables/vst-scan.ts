import { ref } from "vue";
import type { VstPlugin } from "~/types/plugin";
import { mockPlugins } from "~/data/mock-plugins";

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
		windows: [
			"C:/Program Files/Common Files/VST3",
			"C:/Program Files/Steinberg/VSTPlugins",
			"C:/Program Files (x86)/Common Files/VST3",
			"C:/Program Files (x86)/Steinberg/VSTPlugins",
			// VST2 paths
			"C:/Program Files/Steinberg/VSTPlugins",
			"C:/Program Files (x86)/Steinberg/VSTPlugins",
			"C:/Program Files/Common Files/VST2",
			"C:/Program Files (x86)/Common Files/VST2",
		],
		mac: [
			"/Library/Audio/Plug-Ins/VST3",
			"~/Library/Audio/Plug-Ins/VST3",
			"/Applications",
			// VST2 paths
			"/Library/Audio/Plug-Ins/VST",
			"~/Library/Audio/Plug-Ins/VST",
		],
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
		// Fallback - return both
		return [...defaultPaths.windows, ...defaultPaths.mac];
	};

	// Function to scan a single directory recursively
	const scanDirectory = async (dirPath: string): Promise<VstPlugin[]> => {
		const plugins: VstPlugin[] = [];

		try {
			// Use Electron's ipcRenderer to access Node.js fs module
			if (isElectron()) {
				const result = await (window as any).electronAPI.scanDirectory(dirPath);
				return result;
			} else {
				// Running in browser - throw error
				throw new Error("VST scanning is only available in the Electron app. Please run the app using 'npm run dev' to start both Nuxt and Electron.");
			}
		} catch (error) {
			console.error(`Error scanning directory ${dirPath}:`, error);
			throw error;
		}

		return plugins;
	};

	// Function to load mock data for demonstration
	const loadMockData = async () => {
		isScanning.value = true;
		scanProgress.value = 0;
		scanError.value = null;
		vstScan.value = [];

		try {
			// Simulate scanning progress
			for (let i = 0; i <= 100; i += 10) {
				scanProgress.value = i;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Filter to only VST3 plugins for consistency
			const vst3Plugins = mockPlugins.filter((plugin) => plugin.format === "VST3");
			vstScan.value = vst3Plugins;
			scanProgress.value = 100;
		} catch (error) {
			scanError.value = error instanceof Error ? error.message : "Unknown error occurred";
			console.error("Mock data loading failed:", error);
		} finally {
			isScanning.value = false;
		}
	};

	// Main scanning function
	const scanForVst3Files = async (customPaths?: string[]) => {
		isScanning.value = true;
		scanProgress.value = 0;
		scanError.value = null;
		vstScan.value = [];

		try {
			// Check if running in Electron first
			if (!isElectron()) {
				throw new Error("VST scanning is only available in the Electron app. Please run the app using 'npm run dev' to start both Nuxt and Electron.");
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
					// Continue with other paths even if one fails
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

	// Function to get scan statistics
	const getScanStats = () => {
		if (!vstScan.value) return null;

		const total = vstScan.value.length;
		const byVendor = vstScan.value.reduce((acc, plugin) => {
			acc[plugin.vendor] = (acc[plugin.vendor] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const byBitness = vstScan.value.reduce((acc, plugin) => {
			acc[plugin.bitness] = (acc[plugin.bitness] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const byCategory = vstScan.value.reduce((acc, plugin) => {
			if (plugin.category) {
				acc[plugin.category] = (acc[plugin.category] || 0) + 1;
			}
			return acc;
		}, {} as Record<string, number>);

		const byLicense = vstScan.value.reduce((acc, plugin) => {
			if (plugin.license) {
				acc[plugin.license] = (acc[plugin.license] || 0) + 1;
			}
			return acc;
		}, {} as Record<string, number>);

		// Calculate total file size
		const totalSize = vstScan.value.reduce((sum, plugin) => {
			return sum + (plugin.fileSize || 0);
		}, 0);

		// Find newest and oldest plugins
		const pluginsWithDates = vstScan.value.filter((plugin) => plugin.installDate);
		const newestPlugin = pluginsWithDates.length > 0 ? pluginsWithDates.reduce((newest, plugin) => (plugin.installDate! > newest.installDate! ? plugin : newest)) : null;
		const oldestPlugin = pluginsWithDates.length > 0 ? pluginsWithDates.reduce((oldest, plugin) => (plugin.installDate! < oldest.installDate! ? plugin : oldest)) : null;

		return {
			total,
			byVendor,
			byBitness,
			byCategory,
			byLicense,
			totalSize,
			newestPlugin,
			oldestPlugin,
		};
	};

	return {
		vstScan,
		isScanning,
		scanProgress,
		scanError,
		scanForVst3Files,
		scanSpecificPaths,
		getScanStats,
		getPlatformPaths,
		isElectron,
		loadMockData,
	};
};
