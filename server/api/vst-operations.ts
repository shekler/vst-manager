import path from "path";
import { writeFile, mkdir } from "node:fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { initializeDatabase, syncPluginsFromJson, runQuery } from "./database";
import { isElectron, app, ipcMain, getDataDir, getScannerPath } from "./electron-utils";

const execAsync = promisify(exec);

export const exportPlugins = async () => {
  const plugins = await runQuery(`
    SELECT 
      id,
      name,
      path,
      vendor,
      version,
      category,
      subCategories,
      sdkVersion,
      key,
      created_at as createdAt,
      updated_at as updatedAt
    FROM plugins 
    ORDER BY name
  `);

  // Transform the data to match the exact scanned plugins format
  const transformedPlugins = plugins.map((plugin) => ({
    id: plugin.id,
    name: plugin.name,
    // Parse path from JSON if it's a string that looks like JSON, otherwise keep as is for backwards compatibility
    path: (() => {
      try {
        if (typeof plugin.path === "string" && plugin.path.startsWith("[")) {
          return JSON.parse(plugin.path);
        }
        return plugin.path;
      } catch {
        return plugin.path;
      }
    })(),
    vendor: plugin.vendor,
    version: plugin.version,
    category: plugin.category,
    subCategories: plugin.subCategories || "[]",
    sdkVersion: plugin.sdkVersion,
    key: plugin.key,
    createdAt: plugin.createdAt,
    updatedAt: plugin.updatedAt,
  }));

  // Ensure data directory exists - use shared utility
  const dataDir = getDataDir();
  await mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, "exported-plugins.json");
  const fileContent = JSON.stringify({ plugins: transformedPlugins }, null, 2);
  await writeFile(filePath, fileContent, "utf-8");

  return { success: true, message: "Plugins exported successfully", filePath };
};

export const importPlugins = async (fileData: { name: string; content: string }) => {
  if (!fileData) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!fileData.name.toLowerCase().endsWith(".json")) {
    return { success: false, error: "File must be a JSON file" };
  }

  // Use the file content directly
  const fileContent = fileData.content;

  // Validate JSON format
  let jsonData;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    return { success: false, error: "Invalid JSON format" };
  }

  // Handle different JSON formats
  let pluginsArray;
  if (Array.isArray(jsonData)) {
    // Direct array format: [...]
    pluginsArray = jsonData;
  } else if (jsonData.plugins && Array.isArray(jsonData.plugins)) {
    // Object with plugins array: { "plugins": [...] }
    pluginsArray = jsonData.plugins;
  } else {
    return { success: false, error: "JSON file must contain a plugins array or an object with a 'plugins' property" };
  }

  // Ensure data directory exists
  const dataDir = getDataDir();
  await mkdir(dataDir, { recursive: true });

  // Create the proper format for scanned-plugins.json
  const formattedData = { plugins: pluginsArray };
  const jsonPath = path.join(dataDir, "scanned-plugins.json");
  await writeFile(jsonPath, JSON.stringify(formattedData, null, 2), "utf-8");

  // Initialize database and sync plugins
  await initializeDatabase();
  await syncPluginsFromJson();

  return {
    success: true,
    message: `Successfully imported ${pluginsArray.length} plugins`,
    count: pluginsArray.length,
  };
};

export const scanPlugins = async () => {
  console.log("Scanning plugins...");
  try {
    // Use shared utilities for path logic
    const scannerPath = getScannerPath();
    const outputPath = path.join(getDataDir(), "scanned-plugins.json");

    console.log("Scanner path:", scannerPath);
    console.log("Output path:", outputPath);

    // Check if scanner executable exists
    try {
      const fs = require("fs");
      fs.accessSync(scannerPath, fs.constants.F_OK);
      console.log("Scanner executable found");
    } catch (error) {
      console.error("Scanner executable not found:", error);
      return {
        success: false,
        error: `Scanner executable not found at: ${scannerPath}`,
      };
    }

    // Fetch VST paths from settings
    let vstPathsSetting;
    try {
      const settings = await runQuery("SELECT * FROM settings WHERE key = 'vst_paths'");
      console.log("Settings query result:", settings);
      if (settings.length === 0) {
        throw new Error("VST paths setting not found");
      }
      vstPathsSetting = settings[0].value;
      console.log("VST paths setting value:", vstPathsSetting);
    } catch (error) {
      console.error("Failed to fetch VST paths from settings:", error);
      return {
        success: false,
        error: "VST paths not configured. Please set up paths in Settings first.",
      };
    }

    // Parse comma-separated paths
    const directoryPaths = vstPathsSetting
      .split(",")
      .map((path: string) => path.trim())
      .filter((path: string) => path.length > 0);

    console.log("Parsed directory paths:", directoryPaths);

    if (directoryPaths.length === 0) {
      return {
        success: false,
        error: "No valid VST paths configured. Please set up paths in Settings first.",
      };
    }

    console.log(`Scanning ${directoryPaths.length} VST directories:`, directoryPaths);

    // Scan each directory and combine results
    let allResults: any[] = [];

    for (const directoryPath of directoryPaths) {
      try {
        // Create a temporary output file for each directory scan
        const tempOutputPath = path.join(getDataDir(), `temp-scan-${Date.now()}.json`);

        const command = `"${scannerPath}" "${directoryPath}" -o "${tempOutputPath}"`;
        console.log(`Executing command: ${command}`);

        // Execute the scanner for this directory
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          console.error(`Scanner stderr for ${directoryPath}:`, stderr);
        }

        if (stdout) {
          console.log(`Scanner stdout for ${directoryPath}:`, stdout);
        }

        // Read the results from the temporary output file
        const results = JSON.parse(readFileSync(tempOutputPath, "utf8"));

        // Add the directory path to each plugin result for tracking
        if (results.plugins) {
          results.plugins.forEach((plugin: any) => {
            plugin.sourceDirectory = directoryPath;
          });
        }

        allResults = allResults.concat(results.plugins || []);

        // Clean up temporary file
        try {
          await import("fs").then((fs) => fs.promises.unlink(tempOutputPath));
        } catch (cleanupError) {
          console.warn(`Failed to cleanup temp file ${tempOutputPath}:`, cleanupError);
        }
      } catch (error) {
        console.error(`Failed to scan directory ${directoryPath}:`, error);
        // Continue with other directories even if one fails
      }
    }

    // Group plugins by ID/CID and combine their paths into arrays
    const pluginMap = new Map();

    for (const plugin of allResults) {
      // Use ID or CID for primary grouping, fallback to name+vendor for plugins without IDs
      // This allows grouping plugins that are the same but in different formats/locations
      const pluginId = plugin.id || plugin.cid || `${plugin.name || "Unknown"}_${plugin.vendor || "Unknown"}`;

      if (pluginMap.has(pluginId)) {
        const existingPlugin = pluginMap.get(pluginId);

        // Combine paths into array if not already done
        if (Array.isArray(existingPlugin.path)) {
          if (!existingPlugin.path.includes(plugin.path)) {
            existingPlugin.path.push(plugin.path);
          }
        } else {
          // Convert to array and add both paths
          if (existingPlugin.path !== plugin.path) {
            existingPlugin.path = [existingPlugin.path, plugin.path];
          }
        }

        // Also combine sourceDirectories if they exist
        if (plugin.sourceDirectory && existingPlugin.sourceDirectory) {
          if (Array.isArray(existingPlugin.sourceDirectory)) {
            if (!existingPlugin.sourceDirectory.includes(plugin.sourceDirectory)) {
              existingPlugin.sourceDirectory.push(plugin.sourceDirectory);
            }
          } else {
            if (existingPlugin.sourceDirectory !== plugin.sourceDirectory) {
              existingPlugin.sourceDirectory = [existingPlugin.sourceDirectory, plugin.sourceDirectory];
            }
          }
        }
      } else {
        // First occurrence - convert path to array for consistency
        const pluginCopy = { ...plugin };
        pluginCopy.path = [plugin.path];
        if (plugin.sourceDirectory) {
          pluginCopy.sourceDirectory = [plugin.sourceDirectory];
        }
        pluginMap.set(pluginId, pluginCopy);
      }
    }

    // Convert map back to array
    const groupedResults = Array.from(pluginMap.values());

    // Write combined results back to the output file
    const combinedResults = {
      plugins: groupedResults,
      totalPlugins: groupedResults.length,
      validPlugins: groupedResults.filter((plugin) => plugin.isValid).length,
    };

    // Ensure data directory exists before writing
    const dataDir = getDataDir();
    await mkdir(dataDir, { recursive: true });

    // Write the combined results to the scanned-plugins.json file
    writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));

    // Initialize database and sync plugins
    console.log("Initializing database...");
    await initializeDatabase();

    console.log("Syncing plugins from JSON to database...");
    await syncPluginsFromJson();

    return {
      success: true,
      results: combinedResults,
    };
  } catch (error) {
    console.error("Scan failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const deletePlugins = async () => {
  try {
    const response = await runQuery(`DELETE FROM plugins`);
    return { success: true, results: response };
  } catch (error) {
    console.error("Error deleting plugins:", error);
    return { success: false, error: "Failed to delete plugins" };
  }
};

export const downloadPlugins = async () => {
  try {
    // Get the data directly from the database
    const plugins = await runQuery(`
      SELECT 
        id,
        name,
        path,
        vendor,
        version,
        category,
        subCategories,
        sdkVersion,
        key,
        created_at as createdAt,
        updated_at as updatedAt
      FROM plugins 
      ORDER BY name
    `);

    return {
      success: true,
      data: plugins,
      message: "File data retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error downloading plugins:", error);
    return { success: false, error: error.message };
  }
};

export function setupVstIPC() {
  // Only setup IPC handlers if ipcMain is available (Electron environment)
  if (!ipcMain) {
    console.log("IPC not available, skipping VST IPC setup");
    return;
  }

  ipcMain.handle("vst:exportPlugins", async () => {
    try {
      return await exportPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:importPlugins", async (_event: any, fileData: { name: string; content: string }) => {
    try {
      return await importPlugins(fileData);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:scanPlugins", async () => {
    try {
      return await scanPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:deletePlugins", async () => {
    try {
      return await deletePlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:downloadPlugins", async () => {
    try {
      return await downloadPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
