import { readFile, writeFile } from "node:fs/promises";
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

    const filePath = "./data/exported-plugins.json";
    const fileContent = JSON.stringify(plugins, null, 2);
    await writeFile(filePath, fileContent, "utf-8");

    return { success: true, message: "Plugins exported successfully", filePath };
  } catch (error: any) {
    console.error("API: Error exporting plugins:", error);
    return { success: false, error: error.message };
  }
});
