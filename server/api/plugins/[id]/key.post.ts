import { runCommand } from "../../database";

export default defineEventHandler(async (event) => {
  try {
    const pluginId = getRouterParam(event, "id");
    const body = await readBody(event);
    const { key } = body;

    if (!pluginId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plugin ID is required",
      });
    }

    if (key === undefined || key === null) {
      throw createError({
        statusCode: 400,
        statusMessage: "Key value is required",
      });
    }

    // Update the plugin's key in the database
    await runCommand('UPDATE plugins SET key = ?, updated_at = datetime("now") WHERE id = ?', [key, pluginId]);

    return {
      success: true,
      message: "Key saved successfully",
    };
  } catch (error: any) {
    console.error("API: Error saving plugin key:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save key: ${error.message}`,
    });
  }
});
