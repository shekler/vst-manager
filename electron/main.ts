const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── electron
// │ ├── main.js
// │ └── preload.js
// ├─┬─┬ .output
// │ │ └── public
// │ │   ├── ...
// │ │   └── index.html
// │ │

process.env.DIST = path.join(__dirname, "../.output/public");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../.output/public");

const VITE_DEV_SERVER_URL = "http://localhost:3000";

// VST3 file parsing utilities
function parseVst3Bundle(filePath: string) {
	try {
		const buffer = fs.readFileSync(filePath);

		// VST3 bundles have a specific structure
		// We need to look for the plugin's metadata section
		const metadata: any = {
			name: null,
			vendor: null,
			version: null,
			description: null,
			category: null,
			subCategories: null,
			url: null,
			email: null,
		};

		// Convert buffer to string to search for metadata
		const content = buffer.toString("utf8", 0, Math.min(buffer.length, 100000)); // Read first 100KB

		// Look for common VST3 metadata patterns
		// VST3 plugins often contain XML or binary metadata

		// Try to find XML metadata
		const xmlMatch = content.match(/<VSTPluginInfo[^>]*>([\s\S]*?)<\/VSTPluginInfo>/i);
		if (xmlMatch) {
			const xml = xmlMatch[1];

			// Extract name
			const nameMatch = xml.match(/<Name[^>]*>([^<]+)<\/Name>/i);
			if (nameMatch) metadata.name = nameMatch[1].trim();

			// Extract vendor
			const vendorMatch = xml.match(/<Vendor[^>]*>([^<]+)<\/Vendor>/i);
			if (vendorMatch) metadata.vendor = vendorMatch[1].trim();

			// Extract version
			const versionMatch = xml.match(/<Version[^>]*>([^<]+)<\/Version>/i);
			if (versionMatch) metadata.version = versionMatch[1].trim();

			// Extract description
			const descMatch = xml.match(/<Description[^>]*>([^<]+)<\/Description>/i);
			if (descMatch) metadata.description = descMatch[1].trim();

			// Extract category
			const catMatch = xml.match(/<Category[^>]*>([^<]+)<\/Category>/i);
			if (catMatch) metadata.category = catMatch[1].trim();

			// Extract URL
			const urlMatch = xml.match(/<URL[^>]*>([^<]+)<\/URL>/i);
			if (urlMatch) metadata.url = urlMatch[1].trim();
		}

		// If no XML found, try to extract from binary strings
		if (!metadata.name) {
			// Look for readable strings in the binary
			const strings = extractReadableStrings(buffer);

			// Try to identify plugin name from strings
			for (const str of strings) {
				if (str.length > 3 && str.length < 50 && /^[A-Za-z0-9\s\-_\.]+$/.test(str)) {
					// This looks like a potential plugin name
					if (!metadata.name && !str.includes("VST") && !str.includes("Plugin") && !str.includes("Audio")) {
						metadata.name = str;
						break;
					}
				}
			}

			// Try to find vendor/manufacturer
			const vendorPatterns = [/Steinberg/i, /Native Instruments/i, /FabFilter/i, /Waves/i, /iZotope/i, /Soundtoys/i, /Valhalla/i, /Xfer/i, /Serum/i, /Arturia/i, /U-he/i, /Plugin Alliance/i, /Softube/i, /Slate Digital/i, /Antelope Audio/i];

			for (const pattern of vendorPatterns) {
				const match = content.match(pattern);
				if (match) {
					metadata.vendor = match[0];
					break;
				}
			}
		}

		return metadata;
	} catch (error) {
		console.error(`Error parsing VST3 bundle ${filePath}:`, error);
		return null;
	}
}

function extractReadableStrings(buffer: Buffer): string[] {
	const strings: string[] = [];
	let currentString = "";

	for (let i = 0; i < buffer.length; i++) {
		const byte = buffer[i];

		// Check if byte is printable ASCII
		if (byte >= 32 && byte <= 126) {
			currentString += String.fromCharCode(byte);
		} else {
			if (currentString.length >= 3) {
				strings.push(currentString);
			}
			currentString = "";
		}
	}

	// Add the last string if it's long enough
	if (currentString.length >= 3) {
		strings.push(currentString);
	}

	return strings;
}

// Enhanced VST3 scanning functionality
async function scanDirectoryForVst3(dirPath: string): Promise<any[]> {
	const plugins: any[] = [];

	try {
		// Check if directory exists
		if (!fs.existsSync(dirPath)) {
			return plugins;
		}

		// Recursively scan directory
		const scanRecursive = (currentPath: string): void => {
			try {
				const items = fs.readdirSync(currentPath);

				for (const item of items) {
					const fullPath = path.join(currentPath, item);
					const stat = fs.statSync(fullPath);

					if (stat.isDirectory()) {
						// Recursively scan subdirectories
						scanRecursive(fullPath);
					} else if (stat.isFile() && (item.toLowerCase().endsWith(".vst3") || item.toLowerCase().endsWith(".dll"))) {
						// Found a VST file (VST3 or VST2)
						const pluginInfo = extractPluginInfo(fullPath, item);
						if (pluginInfo) {
							plugins.push(pluginInfo);
						}
					}
				}
			} catch (error) {
				console.warn(`Error scanning directory ${currentPath}:`, error);
			}
		};

		scanRecursive(dirPath);
	} catch (error) {
		console.error(`Error scanning directory ${dirPath}:`, error);
	}

	return plugins;
}

function extractPluginInfo(filePath: string, fileName: string) {
	try {
		const isVst3 = fileName.toLowerCase().endsWith(".vst3");
		const isVst2 = fileName.toLowerCase().endsWith(".dll");

		// First, try to parse the VST bundle for metadata
		const vstMetadata = isVst3 ? parseVst3Bundle(filePath) : parseVst2File(filePath);

		// Extract basic information from the file
		const name = vstMetadata?.name || path.parse(fileName).name;

		// Try to extract vendor from VST metadata first, then fallback to path
		let vendor = vstMetadata?.vendor || "Unknown";
		let manufacturer = vstMetadata?.vendor || "Unknown";

		if (vendor === "Unknown") {
			const pathParts = filePath.split(path.sep);
			// Look for common vendor patterns in the path
			for (let i = pathParts.length - 2; i >= 0; i--) {
				const part = pathParts[i];
				if (part && part !== "VST3" && part !== "VST2" && part !== "Plug-Ins" && part !== "Audio" && part !== "Common Files") {
					vendor = part;
					manufacturer = part;
					break;
				}
			}
		}

		// Get file statistics
		let fileSize: number | undefined;
		let installDate: Date | undefined;
		let bitness: "64-bit" | "32-bit" | "Unknown" = "Unknown";

		try {
			const stats = fs.statSync(filePath);
			fileSize = stats.size;
			installDate = new Date(stats.mtime);

			// Determine bitness based on file location and size
			if (isVst2) {
				// VST2: Check if in 32-bit or 64-bit folder
				if (filePath.includes("(x86)") || filePath.includes("32-bit")) {
					bitness = "32-bit";
				} else if (filePath.includes("64-bit") || stats.size > 5000000) {
					bitness = "64-bit";
				} else {
					bitness = "Unknown";
				}
			} else {
				// VST3: Usually 64-bit, but check size as fallback
				bitness = stats.size > 1000000 ? "64-bit" : "32-bit";
			}
		} catch {
			bitness = "Unknown";
		}

		// Determine category from VST metadata or name patterns
		let category = vstMetadata?.category || "Unknown";
		if (category === "Unknown") {
			const nameLower = name.toLowerCase();
			if (nameLower.includes("synth") || nameLower.includes("oscillator") || nameLower.includes("generator")) {
				category = "Synthesizer";
			} else if (nameLower.includes("eq") || nameLower.includes("equalizer")) {
				category = "Equalizer";
			} else if (nameLower.includes("reverb") || nameLower.includes("room") || nameLower.includes("hall")) {
				category = "Reverb";
			} else if (nameLower.includes("delay") || nameLower.includes("echo")) {
				category = "Delay";
			} else if (nameLower.includes("compressor") || nameLower.includes("limiter") || nameLower.includes("gate")) {
				category = "Dynamics";
			} else if (nameLower.includes("filter") || nameLower.includes("lpf") || nameLower.includes("hpf")) {
				category = "Filter";
			} else if (nameLower.includes("distortion") || nameLower.includes("overdrive") || nameLower.includes("fuzz")) {
				category = "Distortion";
			} else if (nameLower.includes("chorus") || nameLower.includes("flanger") || nameLower.includes("phaser")) {
				category = "Modulation";
			}
		}

		return {
			id: filePath, // Use full path as unique ID
			name: name,
			vendor: vendor,
			manufacturer: manufacturer,
			format: isVst3 ? "VST3" : "VST2",
			bitness: bitness,
			path: filePath,
			tags: [], // Empty tags array for now
			fileSize: fileSize,
			installDate: installDate,
			category: category,
			version: vstMetadata?.version,
			description: vstMetadata?.description,
			website: vstMetadata?.url,
		};
	} catch (error) {
		console.error(`Error extracting plugin info from ${filePath}:`, error);
		return null;
	}
}

// VST2 file parsing (DLL files)
function parseVst2File(filePath: string) {
	try {
		const buffer = fs.readFileSync(filePath);
		const content = buffer.toString("utf8", 0, Math.min(buffer.length, 100000));

		const metadata: any = {
			name: null,
			vendor: null,
			version: null,
			description: null,
			category: null,
			url: null,
		};

		// Extract readable strings from VST2 DLL
		const strings = extractReadableStrings(buffer);

		// Try to identify plugin name from strings
		for (const str of strings) {
			if (str.length > 3 && str.length < 50 && /^[A-Za-z0-9\s\-_\.]+$/.test(str)) {
				// This looks like a potential plugin name
				if (!metadata.name && !str.includes("VST") && !str.includes("Plugin") && !str.includes("Audio") && !str.includes("DLL")) {
					metadata.name = str;
					break;
				}
			}
		}

		// Try to find vendor/manufacturer in VST2
		const vendorPatterns = [/Steinberg/i, /Native Instruments/i, /FabFilter/i, /Waves/i, /iZotope/i, /Soundtoys/i, /Valhalla/i, /Xfer/i, /Serum/i, /Arturia/i, /U-he/i, /Plugin Alliance/i, /Softube/i, /Slate Digital/i, /Antelope Audio/i, /Image-Line/i, /Cockos/i, /Reaper/i, /Ableton/i, /Propellerhead/i];

		for (const pattern of vendorPatterns) {
			const match = content.match(pattern);
			if (match) {
				metadata.vendor = match[0];
				break;
			}
		}

		// Look for version information
		const versionMatch = content.match(/(\d+\.\d+\.\d+)/);
		if (versionMatch) {
			metadata.version = versionMatch[1];
		}

		return metadata;
	} catch (error) {
		console.error(`Error parsing VST2 file ${filePath}:`, error);
		return null;
	}
}

// IPC handlers
ipcMain.handle("scanDirectory", async (event: any, dirPath: string) => {
	try {
		const plugins = await scanDirectoryForVst3(dirPath);
		return plugins;
	} catch (error) {
		console.error("Error in scanDirectory handler:", error);
		throw error;
	}
});

ipcMain.handle("getPlatform", () => {
	return process.platform;
});

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false,
		},
	});

	if (app.isPackaged) {
		win.loadFile(path.join(process.env.DIST!, "index.html"));
	} else {
		win.loadURL(VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	}
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.whenReady().then(createWindow);
