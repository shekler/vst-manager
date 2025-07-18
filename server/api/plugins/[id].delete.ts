import dbService from "../database";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plugin ID is required",
      });
    }

    // Get the plugin details before deleting from database
    const plugin = await dbService.getPluginById(id);

    // Delete from database
    await dbService.deletePlugin(id);

    // Also remove from JSON file if it exists
    const jsonPath = join(process.cwd(), "data", "scanned-plugins.json");
    if (existsSync(jsonPath) && plugin) {
      const jsonData = JSON.parse(readFileSync(jsonPath, "utf8"));
      if (jsonData.plugins && Array.isArray(jsonData.plugins)) {
        // Remove the plugin by matching name and path
        jsonData.plugins = jsonData.plugins.filter((p: any) => !(p.name === plugin.name && p.path === plugin.path));
        writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
      }
    }

    return {
      success: true,
      message: "Plugin deleted successfully from database and JSON file",
    };
  } catch (error: any) {
    console.error("Error deleting plugin:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to delete plugin",
    });
  }
});
