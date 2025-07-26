import { readFile, writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import path from "path";
import { initializeDatabase, syncPluginsFromJson } from "../database";

export default defineEventHandler(async (event) => {
  try {
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
    const dataDir = path.join(process.cwd(), "data");
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
  } catch (error: any) {
    console.error("API: Error importing plugins:", error);
    return { success: false, error: error.message || "Failed to import plugins" };
  }
});
