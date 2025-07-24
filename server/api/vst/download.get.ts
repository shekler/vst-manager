import { readFile } from "node:fs/promises";
import { runQuery } from "../database";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const filePath = query.filePath as string;

    if (!filePath) {
      return { success: false, error: "File path is required" };
    }

    // For security, only allow downloading from the data directory
    if (!filePath.startsWith("./data/") && !filePath.startsWith("data/")) {
      return { success: false, error: "Invalid file path" };
    }

    // Instead of reading the file, let's get the data directly from the database
    // This is more secure and ensures we always have the latest data
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
    console.error("API: Error downloading file:", error);
    return { success: false, error: error.message };
  }
});
