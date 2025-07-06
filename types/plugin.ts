// types/plugin.ts
export interface VstPlugin {
	id: string; // A unique ID, like the file path
	name: string;
	vendor: string;
	manufacturer?: string; // More specific manufacturer info
	format: "VST2" | "VST3";
	bitness: "64-bit" | "32-bit" | "Unknown";
	path: string;
	tags: string[]; // For your tagging feature
	// Additional metadata
	fileSize?: number; // File size in bytes
	installDate?: Date; // When the file was created/modified
	version?: string; // Plugin version if available
	description?: string; // Plugin description
	category?: string; // Plugin category (Synth, Effect, etc.)
	website?: string; // Manufacturer website
	license?: string; // License type
}
