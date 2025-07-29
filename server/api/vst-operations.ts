import { ipcMain } from "electron";
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

  const filePath = "./data/exported-plugins.json";
  const fileContent = JSON.stringify({ plugins: transformedPlugins }, null, 2);
  await writeFile(filePath, fileContent, "utf-8");

  return { success: true, message: "Plugins exported successfully", filePath };
};

export const importPlugins = async (event: any) => {
  const formData = await readFormData(event);
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!file.name.toLowerCase().endsWith(".json")) {
    return { success: false, error: "File must be a JSON file" };
  }

  // Read the uploaded file content
  const fileContent = await file.text();

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
  const dataDir = process.env.NODE_ENV === "development" ? "data" : path.join(__dirname, "data");
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

export function setupVstIPC() {
  ipcMain.handle("vst:exportPlugins", async () => {
    try {
      return await exportPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:importPlugins", async (event) => {
    try {
      return await importPlugins(event);
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
