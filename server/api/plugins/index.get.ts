import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    // Initialize database if not already done
    await dbService.initialize();

    // Get all plugins
    const plugins = await dbService.getAllPlugins();

    return {
      success: true,
      data: plugins,
      count: plugins.length,
    };
  } catch (error) {
    console.error("Error fetching plugins:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch plugins",
    });
  }
});
