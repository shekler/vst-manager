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

    // Validate the structure - should have a plugins array
    if (!jsonData.plugins || !Array.isArray(jsonData.plugins)) {
      return { success: false, error: "JSON file must contain a 'plugins' array" };
    }

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });

    // Overwrite the scanned-plugins.json file
    const jsonPath = path.join(dataDir, "scanned-plugins.json");
    await writeFile(jsonPath, fileContent, "utf-8");

    // Initialize database and sync plugins
    await initializeDatabase();
    await syncPluginsFromJson();

    return {
      success: true,
      message: `Successfully imported ${jsonData.plugins.length} plugins`,
      count: jsonData.plugins.length,
    };
  } catch (error: any) {
    console.error("API: Error importing plugins:", error);
    return { success: false, error: error.message || "Failed to import plugins" };
  }
});
