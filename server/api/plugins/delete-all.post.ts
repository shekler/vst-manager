import dbService from "../database";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export default defineEventHandler(async (event) => {
  try {
    // Clear all plugins from the database
    await dbService.deleteAllPlugins();

    // Also clear the JSON file
    const jsonPath = join(process.cwd(), "data", "scanned-plugins.json");
    if (existsSync(jsonPath)) {
      // Clear the plugins array in the JSON file
      const jsonData = JSON.parse(readFileSync(jsonPath, "utf8"));
      jsonData.plugins = [];
      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    }

    return {
      success: true,
      message: "All plugins deleted successfully from database and JSON file",
    };
  } catch (error: any) {
    console.error("Error deleting all plugins:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to delete all plugins",
    });
  }
});
