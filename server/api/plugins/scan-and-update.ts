import { defineEventHandler } from "h3";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../../utils/db";

interface VSTPlugin {
  id: string;
  name: string;
  vendor: string;
  product?: string;
  version?: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

interface ScannedPlugin {
  id: string;
  name: string;
  path: string;
  manufacturer: string;
  url: string;
  image: string;
  version: string;
  type: string;
  key: string;
  date_scanned: string;
  last_updated: string;
}

export default defineEventHandler(async () => {
  try {
    // First, run the VST scanner to get fresh data
    const scanResponse = await fetch("http://localhost:3000/api/vst/scan", {
      method: "POST",
    });
    const scanResult = await scanResponse.json();

    if (!scanResult.success) {
      return {
        success: false,
        message: "Failed to scan VST plugins",
        error: scanResult.message,
      };
    }

    // Get the scanned plugins from the database
    const listResponse = await fetch("http://localhost:3000/api/vst/list");
    const listResult = await listResponse.json();

    if (!listResult.success) {
      return {
        success: false,
        message: "Failed to retrieve scanned plugins",
        error: listResult.message,
      };
    }

    const scannedPlugins: VSTPlugin[] = listResult.plugins || [];

    // Transform the database plugins to match the scanned-plugins.json format
    const transformedPlugins: ScannedPlugin[] = scannedPlugins.map(
      (plugin: VSTPlugin, index: number) => {
        // Determine plugin type from file path
        let pluginType = "VST3";
        if (
          plugin.filePath.endsWith(".dll") ||
          plugin.filePath.endsWith(".vst")
        ) {
          pluginType = "VST2";
        }

        // Extract manufacturer from vendor or try to parse from path
        let manufacturer = plugin.vendor;
        if (manufacturer === "Unknown Vendor") {
          // Try to extract manufacturer from file path
          const pathParts = plugin.filePath.split(path.sep);
          for (const part of pathParts) {
            if (
              part &&
              part !== "VST3" &&
              part !== "VSTPlugins" &&
              part !== "Common Files" &&
              part !== "Program Files"
            ) {
              manufacturer = part;
              break;
            }
          }
        }

        // Generate a simple URL based on manufacturer
        let url = "";
        if (manufacturer && manufacturer !== "Unknown Vendor") {
          const manufacturerLower = manufacturer.toLowerCase();
          if (manufacturerLower.includes("waves")) {
            url = "https://www.waves.com/";
          } else if (manufacturerLower.includes("fabfilter")) {
            url = "https://www.fabfilter.com/";
          } else if (manufacturerLower.includes("izotope")) {
            url = "https://www.izotope.com/";
          } else if (manufacturerLower.includes("soundtoys")) {
            url = "https://www.soundtoys.com/";
          } else if (manufacturerLower.includes("valhalla")) {
            url = "https://valhalladsp.com/";
          } else if (
            manufacturerLower.includes("native instruments") ||
            manufacturerLower.includes("kontakt")
          ) {
            url = "https://www.native-instruments.com/";
          } else if (manufacturerLower.includes("ssl")) {
            url = "https://www.solidstatelogic.com/";
          } else if (manufacturerLower.includes("stl")) {
            url = "https://www.stltones.com/";
          } else if (manufacturerLower.includes("slate digital")) {
            url = "https://slatedigital.com/";
          } else if (manufacturerLower.includes("baby audio")) {
            url = "https://www.babyaudio.com/";
          } else {
            url = `https://www.google.com/search?q=${encodeURIComponent(manufacturer + " " + plugin.name)}`;
          }
        }

        return {
          id: (index + 1).toString(),
          name: plugin.name,
          path: plugin.filePath,
          manufacturer: manufacturer,
          url: url,
          image: "", // No image available from scanner
          version: plugin.version || "1.0.0",
          type: pluginType,
          key: "", // No key available from scanner
          date_scanned: new Date().toISOString().split("T")[0], // Today's date
          last_updated: new Date().toISOString().split("T")[0], // Today's date
        };
      },
    );

    // Clear the scanned plugins list first to avoid duplicates
    const jsonFilePath = path.join(
      process.cwd(),
      "data",
      "scanned-plugins.json",
    );

    // Use only the newly scanned plugins (no merging with existing)
    const mergedPlugins = transformedPlugins;

    // Update the scanned-plugins.json file
    const updatedData = {
      plugins: mergedPlugins,
    };

    await fs.writeFile(
      jsonFilePath,
      JSON.stringify(updatedData, null, 2),
      "utf-8",
    );

    return {
      success: true,
      message: `Successfully updated scanned-plugins.json with ${mergedPlugins.length} plugins`,
      scannedCount: scanResult.count,
      totalPluginsCount: mergedPlugins.length,
      scannedPaths: scanResult.scannedPaths,
      skippedPaths: scanResult.skippedPaths,
    };
  } catch (error) {
    console.error("Error in scan-and-update:", error);
    return {
      success: false,
      message: "Failed to scan and update plugins",
      error: (error as Error).message,
    };
  }
});
