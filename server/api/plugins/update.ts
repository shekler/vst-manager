import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { pluginId, key } = body;

    if (!pluginId || key === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plugin ID and key are required",
      });
    }

    // Read the current plugins data
    const pluginsPath = resolve(process.cwd(), "data/scanned-plugins.json");
    const pluginsData = JSON.parse(readFileSync(pluginsPath, "utf-8"));

    // Find and update the plugin
    const pluginIndex = pluginsData.plugins.findIndex(
      (plugin: any) => plugin.id === pluginId,
    );

    if (pluginIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: "Plugin not found",
      });
    }

    // Update the plugin key and last_updated timestamp
    pluginsData.plugins[pluginIndex].key = key;
    pluginsData.plugins[pluginIndex].last_updated = new Date()
      .toISOString()
      .split("T")[0];

    // Write the updated data back to the file
    writeFileSync(pluginsPath, JSON.stringify(pluginsData, null, 2));

    return {
      success: true,
      message: "Plugin updated successfully",
      plugin: pluginsData.plugins[pluginIndex],
    };
  } catch (error: any) {
    console.error("Error updating plugin:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to update plugin",
    });
  }
});
