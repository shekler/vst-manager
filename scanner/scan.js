// scanner/scan.js
const { scanner } = require("@j-rob/vst-scanner");
const AdmZip = require("adm-zip");
const fs = require("fs/promises");
const path = require("path");
const util = require("util");

const scanVstDll = util.promisify(scanner.scan);

// --- CONFIGURATION ---
// In a real app, this list would be passed from the UI.
// For now, we'll hardcode it to match the store's default.
const USER_DEFINED_PATHS = [
	"C:/Program Files/Steinberg/VSTPlugins",
	"C:/Program Files/Common Files/VST3",
	"C:/Program Files/VstPlugins", // Add another common one
];
// -------------------

async function findPluginFiles(dir) {
	// ... (this function is the same as before)
}

async function runScan(pathsToScan) {
	console.log("Starting scan based on user-defined paths...");
	const allFoundFiles = new Set(); // Use a Set to avoid duplicates

	for (const folder of pathsToScan) {
		try {
			console.log(`Searching in: ${folder}`);
			const files = await findPluginFiles(folder);
			files.forEach((file) => allFoundFiles.add(file));
		} catch (error) {
			console.warn(`Warning: Could not read folder ${folder}. It may not exist or permissions are denied.`);
		}
	}

	console.log(`\nFound ${allFoundFiles.size} total plugin files. Now parsing...`);
	const allPlugins = [];
	for (const filePath of allFoundFiles) {
		try {
			let pluginData;
			if (filePath.endsWith(".dll")) {
				// Use the specialized tool for the job
				const result = await scanVstDll(filePath);
				pluginData = {
					/* ... VST2 data ... */
				};
			} else if (filePath.endsWith(".vst3")) {
				// Use our pure JS method for the job
				const zip = new AdmZip(filePath);
				const entry = zip.getEntry("Contents/plugin.json");
				if (entry) {
					const metadata = JSON.parse(entry.getData().toString("utf8"));
					pluginData = {
						/* ... VST3 data ... */
					};
				}
			}
			if (pluginData) allPlugins.push(pluginData);
		} catch (error) {
			console.error(`  ✗ Failed to parse: ${path.basename(filePath)}`);
		}
	}

	// ... (Save to JSON file logic is the same as before) ...
	console.log(`\nScan complete! ${allPlugins.length} plugins successfully parsed.`);
}

// Run the scan with the user's paths
runScan(USER_DEFINED_PATHS);
