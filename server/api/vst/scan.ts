import { defineEventHandler, getQuery } from "h3";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { db } from "../../utils/db";

// VST3 plugin metadata structure
interface VST3PluginMetadata {
  name: string;
  vendor: string;
  product?: string;
  version?: string;
  filePath: string;
}

// Function to recursively scan directories for VST plugins
async function scanDirectoryForVST(
  dirPath: string,
): Promise<VST3PluginMetadata[]> {
  const plugins: VST3PluginMetadata[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Check if it's a VST3 bundle (directory with .vst3 extension)
        if (entry.name.endsWith(".vst3")) {
          const pluginInfo = await extractVST3Info(fullPath);
          if (pluginInfo) {
            plugins.push(pluginInfo);
          }
        } else {
          // Recursively scan subdirectories
          const subPlugins = await scanDirectoryForVST(fullPath);
          plugins.push(...subPlugins);
        }
      } else if (entry.isFile()) {
        // Check for VST3 files
        if (entry.name.endsWith(".vst3")) {
          const pluginInfo = await extractVST3Info(fullPath);
          if (pluginInfo) {
            plugins.push(pluginInfo);
          }
        }
        // Check for VST2 files (.dll on Windows, .vst on macOS)
        else if (entry.name.endsWith(".dll") || entry.name.endsWith(".vst")) {
          const pluginInfo = extractVST2Info(fullPath);
          if (pluginInfo) {
            plugins.push(pluginInfo);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Error scanning directory ${dirPath}:`, error);
  }

  return plugins;
}

// Function to extract VST3 plugin information
async function extractVST3Info(
  vst3Path: string,
): Promise<VST3PluginMetadata | null> {
  try {
    // For VST3 bundles, we need to look for the main component file
    // VST3 bundles typically have this structure:
    // PluginName.vst3/
    //   Contents/
    //     MacOS/ (on macOS)
    //       PluginName
    //     Win64/ (on Windows)
    //       PluginName.dll
    //     x86_64-linux/ (on Linux)
    //       PluginName.so

    const platform = os.platform();
    let componentPath = "";

    if (platform === "darwin") {
      // macOS
      componentPath = path.join(vst3Path, "Contents", "MacOS");
    } else if (platform === "win32") {
      // Windows
      componentPath = path.join(vst3Path, "Contents", "Win64");
    } else if (platform === "linux") {
      // Linux
      componentPath = path.join(vst3Path, "Contents", "x86_64-linux");
    }

    // Check if the component directory exists
    try {
      await fs.access(componentPath);
    } catch {
      // If the platform-specific directory doesn't exist, try to find any component
      const contentsPath = path.join(vst3Path, "Contents");
      try {
        const contents = await fs.readdir(contentsPath, {
          withFileTypes: true,
        });
        for (const entry of contents) {
          if (
            entry.isDirectory() &&
            (entry.name.includes("Win") ||
              entry.name.includes("Mac") ||
              entry.name.includes("linux"))
          ) {
            componentPath = path.join(contentsPath, entry.name);
            break;
          }
        }
      } catch {
        // If Contents directory doesn't exist, this might be a different VST3 structure
        // Try to extract info from the path itself
        return extractInfoFromPath(vst3Path);
      }
    }

    // Look for the actual plugin binary
    try {
      const components = await fs.readdir(componentPath, {
        withFileTypes: true,
      });
      for (const component of components) {
        if (component.isFile()) {
          // Found the plugin binary, extract info from the path
          return extractInfoFromPath(vst3Path);
        }
      }
    } catch (error) {
      console.warn(
        `Error reading component directory ${componentPath}:`,
        error,
      );
    }

    // Fallback: extract info from the path
    return extractInfoFromPath(vst3Path);
  } catch (error) {
    console.warn(`Error extracting VST3 info from ${vst3Path}:`, error);
    return null;
  }
}

// Function to extract VST2 plugin information
function extractVST2Info(vst2Path: string): VST3PluginMetadata | null {
  try {
    // For VST2, we can only extract info from the filename since we can't load the binary
    return extractInfoFromPath(vst2Path);
  } catch (error) {
    console.warn(`Error extracting VST2 info from ${vst2Path}:`, error);
    return null;
  }
}

// Function to extract plugin information from the file path
function extractInfoFromPath(pluginPath: string): VST3PluginMetadata {
  const ext = path.extname(pluginPath);
  const fileName = path.basename(pluginPath, ext);

  // Try to parse vendor and product from the filename
  // Common patterns: "Vendor Product.vst3" or "Product.vst3"
  let vendor = "Unknown Vendor";
  let product = fileName;

  // Look for common vendor patterns
  const vendorPatterns = [
    /^([A-Z][a-z]+)\s+(.+)$/, // "Vendor Product"
    /^([A-Z]+)\s+(.+)$/, // "VENDOR Product"
    /^([a-z]+)-([A-Z][a-z]+)/, // "vendor-Product"
  ];

  for (const pattern of vendorPatterns) {
    const match = fileName.match(pattern);
    if (match) {
      vendor = match[1];
      product = match[2] || fileName;
      break;
    }
  }

  // Special handling for known vendors
  const knownVendors: { [key: string]: string } = {
    fabfilter: "FabFilter",
    waves: "Waves",
    izotope: "iZotope",
    steinberg: "Steinberg",
    ableton: "Ableton",
    ni: "Native Instruments",
    arturia: "Arturia",
    uad: "Universal Audio",
    plugin: "Plugin Alliance",
    soundtoys: "Soundtoys",
    valhalla: "Valhalla DSP",
    otium: "Otium",
    klanghelm: "Klanghelm",
    airwindows: "Airwindows",
    voxengo: "Voxengo",
    stillwell: "Stillwell Audio",
  };

  // Check if the vendor matches any known vendor (case insensitive)
  const lowerVendor = vendor.toLowerCase();
  for (const [key, knownVendor] of Object.entries(knownVendors)) {
    if (lowerVendor.includes(key) || fileName.toLowerCase().includes(key)) {
      vendor = knownVendor;
      break;
    }
  }

  return {
    name: product,
    vendor: vendor,
    product: product,
    version: "1.0.0", // Default version since we can't easily extract it
    filePath: pluginPath,
  };
}

export default defineEventHandler(async (event) => {
  try {
    // Define common VST plugin scan paths based on OS
    const defaultVstPaths: string[] = [];
    const platform = os.platform();

    if (platform === "win32") {
      // Windows paths
      const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
      const programFilesX86 =
        process.env.PROGRAMFILES_X86 || "C:\\Program Files (x86)";
      const commonProgramFiles =
        process.env.COMMONPROGRAMFILES || "C:\\Program Files\\Common Files";
      const commonProgramFilesX86 =
        process.env.COMMONPROGRAMFILES_X86 ||
        "C:\\Program Files (x86)\\Common Files";

      defaultVstPaths.push(
        // VST3 paths
        path.join(commonProgramFiles, "VST3"),
        path.join(commonProgramFilesX86, "VST3"),
        path.join(programFiles, "Common Files", "VST3"),
        path.join(programFilesX86, "Common Files", "VST3"),
        // VST2 paths
        path.join(programFiles, "VSTPlugins"),
        path.join(programFilesX86, "VSTPlugins"),
        path.join(programFiles, "Steinberg", "VSTPlugins"),
        path.join(programFiles, "Common Files", "VSTPlugins"),
        path.join(programFilesX86, "Common Files", "VSTPlugins"),
      );
    } else if (platform === "darwin") {
      // macOS paths
      defaultVstPaths.push(
        // VST3 paths
        "/Library/Audio/Plug-Ins/VST3",
        path.join(os.homedir(), "Library/Audio/Plug-Ins/VST3"),
        "/Applications/VST3",
        path.join(os.homedir(), "Applications/VST3"),
        // VST2 paths
        "/Library/Audio/Plug-Ins/VST",
        path.join(os.homedir(), "Library/Audio/Plug-Ins/VST"),
        "/Applications/VST",
        path.join(os.homedir(), "Applications/VST"),
      );
    } else if (platform === "linux") {
      // Linux paths
      defaultVstPaths.push(
        "/usr/lib/vst",
        "/usr/local/lib/vst",
        path.join(os.homedir(), ".vst"),
        path.join(os.homedir(), ".vst3"),
        "/opt/vst3",
        path.join(os.homedir(), ".local/lib/vst3"),
      );
    }

    // Allow user to provide additional paths via query parameter
    const query = getQuery(event);
    const userPaths = Array.isArray(query.paths)
      ? query.paths
      : typeof query.paths === "string"
        ? [query.paths]
        : [];
    const scanPaths = [...new Set([...defaultVstPaths, ...userPaths])].filter(
      (p) => p,
    );

    let allPlugins: VST3PluginMetadata[] = [];
    const scannedSuccessfully: string[] = [];
    const skippedPaths: Array<{ path: string; error: string }> = [];

    console.log(`Starting VST scan on paths: ${scanPaths.join(", ")}`);

    for (const scanPath of scanPaths) {
      try {
        // Check if the directory exists and is accessible
        await fs.access(scanPath, fs.constants.F_OK);
        console.log(`  Processing: ${scanPath}`);

        // Scan for VST plugins in this directory
        const pluginsInPath = await scanDirectoryForVST(scanPath);
        allPlugins = allPlugins.concat(pluginsInPath);

        console.log(`  Found ${pluginsInPath.length} plugins in ${scanPath}`);
        scannedSuccessfully.push(scanPath);
      } catch (err) {
        const errorMsg = (err as Error).message;
        console.warn(`  Skipping path '${scanPath}': ${errorMsg}`);
        skippedPaths.push({ path: scanPath, error: errorMsg });
      }
    }

    // Remove duplicates based on file path
    const uniquePlugins = allPlugins.filter(
      (plugin, index, self) =>
        index === self.findIndex((p) => p.filePath === plugin.filePath),
    );

    // Save results to the database
    await db.plugin.deleteMany({});
    if (uniquePlugins.length > 0) {
      await db.plugin.createMany({
        data: uniquePlugins.map((p) => ({
          name: p.name || "Unknown Name",
          vendor: p.vendor || "Unknown Vendor",
          product: p.product || "",
          version: p.version || "1.0.0",
          filePath: p.filePath,
        })),
      });
    }

    console.log(
      `VST Scan complete. Found ${uniquePlugins.length} unique plugins.`,
    );
    return {
      success: true,
      message: `VSTs scanned and database updated. Found ${uniquePlugins.length} plugins.`,
      count: uniquePlugins.length,
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
