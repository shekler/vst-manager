import { ipcMain, app } from "electron";
import path from "path";
import { writeFile, mkdir } from "node:fs/promises";
import { initializeDatabase, syncPluginsFromJson, runQuery } from "./database";

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
  // Another VST operation
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
}
