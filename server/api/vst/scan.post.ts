// Execute vst_scanner with file path from settings.vue
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { initializeDatabase, syncPluginsFromJson, runQuery } from "../database";

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
  try {
    const scannerPath = join(process.cwd(), "tools", "vst_scanner.exe");
    const outputPath = join(process.cwd(), "data", "scanned-plugins.json");

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
        const command = `"${scannerPath}" "${directoryPath}" -o "${outputPath}"`;
        console.log(`Executing command: ${command}`);

        // Execute the scanner for this directory
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          console.error(`Scanner stderr for ${directoryPath}:`, stderr);
        }

        // Read the results from the output file
        const results = JSON.parse(readFileSync(outputPath, "utf8"));

        // Add the directory path to each plugin result for tracking
        if (results.plugins) {
          results.plugins.forEach((plugin: any) => {
            plugin.sourceDirectory = directoryPath;
          });
        }

        allResults = allResults.concat(results.plugins || []);
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
});
