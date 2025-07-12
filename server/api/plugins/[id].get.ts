import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plugin ID is required",
      });
    }

    // Initialize database if not already done
    await dbService.initialize();

    // Get plugin by ID
    const plugin = await dbService.getPluginById(id);

    if (!plugin) {
      throw createError({
        statusCode: 404,
        statusMessage: "Plugin not found",
      });
    }

    return {
      success: true,
      data: plugin,
    };
  } catch (error: any) {
    console.error("Error fetching plugin:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch plugin",
    });
  }
});
