import { defineEventHandler, getQuery } from "h3";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { db } from "../../utils/db"; // Your Prisma client import

// Determine the path to the compiled native addon.
// process.cwd() is the root of your Nuxt project.
const nativeScannerPath = path.resolve(process.cwd(), "vst-scanner-native", "build", "Release", "vst_scanner_native.node");

// Crucial: Synchronously check if the native addon exists and is readable.
// If it's missing, the server can't start correctly.
try {
	fs.accessSync(nativeScannerPath, fs.constants.R_OK);
	console.log(`Native VST scanner addon found at: ${nativeScannerPath}`);
} catch (error) {
	console.error(`\n--- CRITICAL ERROR: NATIVE VST SCANNER MISSING ---\n`);
	console.error(`Addon not found or not readable: ${nativeScannerPath}`);
	console.error(`Please ensure you have:`);
	console.error(`1. Downloaded and placed VST_SDK_2.4 in 'vst-scanner-native/VST_SDK_2.4'.`);
	console.error(`2. Installed C++ build tools (Visual Studio, Xcode CLI, build-essential).`);
	console.error(`3. Run 'node-gyp configure build' inside 'vst-scanner-native/' successfully.`);
	console.error(`   Error details:`, (error as Error).message);
	console.error(`\n--- SERVER WILL NOT START ---\n`);
	process.exit(1); // Exit the process as this is a fatal error for the scanner functionality
}

// Load the native addon only if it exists
const vstScanner = require(nativeScannerPath);

export default defineEventHandler(async (event) => {
	try {
		// Define common VST plugin scan paths based on OS
		const defaultVstPaths = [];
		const platform = os.platform();

		if (platform === "win32") {
			defaultVstPaths.push(process.env.PROGRAMFILES + "\\VSTPlugins", process.env.COMMONPROGRAMFILES + "\\VST3", process.env.PROGRAMFILES_X86 + "\\VSTPlugins", process.env.COMMONPROGRAMFILES_X86 + "\\VST3");
		} else if (platform === "darwin") {
			// macOS
			defaultVstPaths.push("/Library/Audio/Plug-Ins/VST", "/Library/Audio/Plug-Ins/VST3", path.join(os.homedir(), "Library/Audio/Plug-Ins/VST"), path.join(os.homedir(), "Library/Audio/Plug-Ins/VST3"));
		} else if (platform === "linux") {
			defaultVstPaths.push("/usr/lib/vst", "/usr/local/lib/vst", path.join(os.homedir(), ".vst"), path.join(os.homedir(), ".vst3"));
		}

		// Allow user to provide additional paths via query parameter (e.g., /api/vst/scan?paths=/custom/vsts;/another/folder)
		const query = getQuery(event);
		const userPaths = Array.isArray(query.paths) ? query.paths : typeof query.paths === "string" ? [query.paths] : [];
		const scanPaths = [...new Set([...defaultVstPaths, ...userPaths])].filter((p) => p); // Combine, deduplicate, filter empty

		let allPlugins: any[] = [];
		const scannedSuccessfully = [];
		const skippedPaths = [];

		console.log(`Starting VST scan on paths: ${scanPaths.join(", ")}`);

		for (const p of scanPaths) {
			try {
				// Before calling native code, ensure the directory actually exists and is accessible
				await fs.access(p, fs.constants.F_OK);
				console.log(`  Processing: ${p}`);

				// !!! CALL TO NATIVE C++ SCANNER !!!
				const pluginsInPath = vstScanner.scanVstPlugins(p);
				allPlugins = allPlugins.concat(pluginsInPath);
				scannedSuccessfully.push(p);
			} catch (err) {
				const errorMsg = (err as Error).message;
				console.warn(`  Skipping path '${p}': ${errorMsg}`);
				skippedPaths.push({ path: p, error: errorMsg });
			}
		}

		// Save/Update results in the database (Prisma example)
		// Clear existing plugins and then create new ones.
		// In a production app, you might want more sophisticated UPSERT logic
		// or incremental updates to preserve IDs or other data.
		await db.plugin.deleteMany({});
		if (allPlugins.length > 0) {
			await db.plugin.createMany({
				data: allPlugins.map((p) => ({
					name: p.name || "Unknown Name", // Ensure name/vendor are not empty for DB
					vendor: p.vendor || "Unknown Vendor",
					product: p.product || "", // Product and version can be empty
					version: p.version || "0",
					filePath: p.filePath,
				})),
			});
		}

		console.log(`VST Scan complete. Found ${allPlugins.length} plugins.`);
		return {
			success: true,
			message: "VSTs scanned and database updated.",
			count: allPlugins.length,
			scannedPaths: scannedSuccessfully,
			skippedPaths: skippedPaths,
		};
	} catch (error) {
		console.error("SERVER VST SCAN ERROR:", error);
		return {
			success: false,
			message: "Failed to scan VST plugins on the server.",
			error: (error as Error).message,
		};
	}
});
