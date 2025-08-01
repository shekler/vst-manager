import { writeFile } from "node:fs/promises";
import { runQuery } from "../database";

export default defineEventHandler(async (event) => {
  try {
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

    // Ensure data directory exists
    const { mkdir } = await import("node:fs/promises");
    await mkdir("data", { recursive: true });

    const filePath = "./data/exported-plugins.json";
    const fileContent = JSON.stringify({ plugins: transformedPlugins }, null, 2);
    await writeFile(filePath, fileContent, "utf-8");

    return { success: true, message: "Plugins exported successfully", filePath };
  } catch (error: any) {
    console.error("API: Error exporting plugins:", error);
    return { success: false, error: error.message };
  }
});
