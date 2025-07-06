// electron/preload.js
// This file is intentionally left blank for this basic setup.
// It's the place to securely expose Node.js APIs to your renderer process
// using the contextBridge.

const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script starting...");

try {
	// Expose protected methods that allow the renderer process to use
	// the ipcRenderer without exposing the entire object
	contextBridge.exposeInMainWorld("electronAPI", {
		scanDirectory: (dirPath: string) => ipcRenderer.invoke("scanDirectory", dirPath),
		getPlatform: () => ipcRenderer.invoke("getPlatform"),
	});

	console.log("Preload script completed successfully");
} catch (error) {
	console.error("Error in preload script:", error);
}

// Type definitions for TypeScript
declare global {
	interface Window {
		electronAPI: {
			scanDirectory: (dirPath: string) => Promise<any[]>;
			getPlatform: () => Promise<string>;
		};
	}
}

// Export to make this a proper external module
export {};
