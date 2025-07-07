// types/plugin.ts
export interface VstPlugin {
	id: string; // A unique ID, like the file path
	name: string;
	vendor: string;
	format: "VST2" | "VST3";
	bitness: "64-bit" | "32-bit" | "Unknown";
	path: string;
	tags: string[]; // For your tagging feature
	// Additional metadata extracted from VST3 binary
	version?: string;
	category?: string;
	subCategory?: string;
	description?: string;
	url?: string;
}
