// types/plugin.ts
export interface VstPlugin {
	id: string; // File path as unique ID
	name: string; // File name without extension
	path: string; // Full file path
}
