import { ipcMain, app } from "electron";
import path from "path";
import { writeFile, mkdir } from "node:fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { initializeDatabase, syncPluginsFromJson, runQuery } from "./database";

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
    path: plugin.path,
    vendor: plugin.vendor,
    version: plugin.version,
    category: plugin.category,
    subCategories: plugin.subCategories || "[]",
    sdkVersion: plugin.sdkVersion,
    key: plugin.key,
    createdAt: plugin.createdAt,
    updatedAt: plugin.updatedAt,
  }));

  // Ensure data directory exists
  const dataDir = process.env.NODE_ENV === "development" ? "data" : path.join(app.getPath("userData"), "data");
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
  const dataDir = process.env.NODE_ENV === "development" ? "data" : path.join(app.getPath("userData"), "data");
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
  try {
    const scannerPath = process.env.NODE_ENV === "development" ? "tools/vst_scanner.exe" : join(__dirname, "tools/vst_scanner.exe");
    const outputPath = process.env.NODE_ENV === "development" ? "data/scanned-plugins.json" : join(__dirname, "data/scanned-plugins.json");

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

    // Write combined results back to the output file
    const combinedResults = {
      plugins: allResults,
      totalPlugins: allResults.length,
      validPlugins: allResults.filter((plugin) => plugin.isValid).length,
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

export const searchPlugins = async (query: string) => {
  try {
    const plugins = await runQuery(
      `
      SELECT 
        id,
        name,
        path,
        vendor,
        version,
        subCategories,
        sdkVersion,
        isValid,
        error,
        key,
        created_at as createdAt,
        updated_at as updatedAt
      FROM plugins 
      WHERE name LIKE ? OR vendor LIKE ? OR path LIKE ?
      ORDER BY name
    `,
      [`%${query}%`, `%${query}%`, `%${query}%`],
    );

    // Parse subCategories JSON string back to array
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.subCategories || "[]"),
    }));

    return {
      success: true,
      data: processedPlugins,
      count: processedPlugins.length,
    };
  } catch (error: any) {
    console.error("Error searching plugins:", error);
    return { success: false, error: error.message };
  }
};

export const savePluginKey = async (pluginId: string, key: string) => {
  try {
    await runQuery(
      `
      UPDATE plugins 
      SET key = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [key, pluginId],
    );

    return {
      success: true,
      message: "Plugin key updated successfully",
    };
  } catch (error: any) {
    console.error("Error saving plugin key:", error);
    return { success: false, error: error.message };
  }
};

export const getPlugins = async () => {
  try {
    const { runQuery, initializeDatabase, syncPluginsFromJson } = await import("./database");

    // Try to fetch plugins first
    let plugins;
    try {
      plugins = await runQuery(`
        SELECT 
          id,
          name,
          path,
          vendor,
          version,
          subCategories,
          sdkVersion,
          isValid,
          error,
          key,
          created_at as createdAt,
          updated_at as updatedAt
        FROM plugins 
        ORDER BY name
      `);
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        await initializeDatabase();
        await syncPluginsFromJson();

        // Try fetching again after initialization
        plugins = await runQuery(`
          SELECT 
            id,
            name,
            path,
            vendor,
            version,
            subCategories,
            sdkVersion,
            isValid,
            error,
            key,
            created_at as createdAt,
            updated_at as updatedAt
          FROM plugins 
          ORDER BY name
        `);
      } else {
        throw tableError;
      }
    }

    // Parse subCategories JSON string back to array
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.subCategories || "[]"),
    }));

    return {
      success: true,
      data: processedPlugins,
      count: processedPlugins.length,
    };
  } catch (error: any) {
    console.error("Error fetching plugins:", error);
    return { success: false, error: error.message };
  }
};

export function setupVstIPC() {
  ipcMain.handle("vst:exportPlugins", async () => {
    try {
      return await exportPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:importPlugins", async (event, fileData: { name: string; content: string }) => {
    try {
      return await importPlugins(fileData);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:getPlugins", async () => {
    try {
      return await getPlugins();
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

  ipcMain.handle("vst:searchPlugins", async (event, query: string) => {
    try {
      return await searchPlugins(query);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:savePluginKey", async (event, pluginId: string, key: string) => {
    try {
      return await savePluginKey(pluginId, key);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
