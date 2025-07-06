// scanner/scan.js
const { scan } = require("vst-scanner");
const fs = require("fs/promises");
const path = require("path");

// --- CONFIGURATION ---
const USER_DEFINED_PATHS = [
	"E:/Recording/VSTPlugins",
	// Add any other paths you have here
];
// -------------------

async function runScan(pathsToScan) {
	console.log("Starting scan with `vst-scanner`...");
	const allPlugins = [];
	const scannedPaths = new Set();

	for (const folder of pathsToScan) {
		try {
			// Try multiple approaches to handle the path correctly
			let scanPath = folder;

			// First, try to resolve as absolute path
			if (!path.isAbsolute(folder)) {
				scanPath = path.resolve(folder);
			}

			// Convert to Windows-style path if on Windows
			if (process.platform === "win32") {
				scanPath = scanPath.replace(/\//g, "\\");
			}

			console.log(`Original path: ${folder}`);
			console.log(`Resolved path: ${scanPath}`);
			console.log(`Current working directory: ${process.cwd()}`);

			// Ensure the path exists before scanning
			try {
				await fs.access(scanPath);
				console.log(`✓ Path exists and is accessible`);
			} catch (accessError) {
				console.error(`✗ Path does not exist or is not accessible: ${scanPath}`);
				continue;
			}

			// Try changing to the drive root first, then use relative path
			const originalCwd = process.cwd();
			const driveRoot = scanPath.split("\\")[0] + "\\";

			console.log(`Changing to drive root: ${driveRoot}`);
			process.chdir(driveRoot);

			// Use relative path from drive root
			const relativePath = scanPath.substring(driveRoot.length);
			console.log(`Using relative path: ${relativePath}`);

			const results = await scan(relativePath);

			// Restore original working directory
			process.chdir(originalCwd);

			const foundPlugins = { ...results.vst2, ...results.vst3 };

			for (const pluginPath in foundPlugins) {
				if (scannedPaths.has(pluginPath)) {
					continue;
				}
				const pluginData = foundPlugins[pluginPath];
				allPlugins.push({
					id: pluginPath,
					name: pluginData.name,
					vendor: pluginData.vendor,
					format: pluginData.type.toUpperCase(),
					bitness: pluginData.is64bit ? "64-bit" : "32-bit",
					path: pluginPath,
					tags: [],
				});
				scannedPaths.add(pluginPath);
				console.log(`  ✓ Found: ${pluginData.name}`);
			}
		} catch (error) {
			console.error(`  ✗ Error scanning folder: ${folder}`, error);
		}
	}

	const outputPath = path.join(__dirname, "../public/scanned-plugins.json");
	await fs.writeFile(outputPath, JSON.stringify(allPlugins, null, 2));

	console.log("\n---------------------------------");
	console.log(`Scan complete! ${allPlugins.length} plugins found.`);
	console.log(`Data saved to: ${outputPath}`);
	console.log("---------------------------------");
}

runScan(USER_DEFINED_PATHS);
