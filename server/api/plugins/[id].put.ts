import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plugin ID is required",
      });
    }

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Update data is required",
      });
    }

    // Initialize database if not already done
    await dbService.initialize();

    // Update the plugin
    await dbService.updatePlugin(id, body);

    // Get the updated plugin
    const updatedPlugin = await dbService.getPluginById(id);

    return {
      success: true,
      message: "Plugin updated successfully",
      data: updatedPlugin,
    };
  } catch (error: any) {
    console.error("Error updating plugin:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to update plugin",
    });
  }
});
