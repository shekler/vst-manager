import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    // Initialize database if not already done
    await dbService.initialize();

    // Import plugins from JSON
    await dbService.importFromJson();

    // Get the count of imported plugins
    const plugins = await dbService.getAllPlugins();

    return {
      success: true,
      message: "Plugins imported successfully",
      count: plugins.length,
    };
  } catch (error: any) {
    console.error("Error importing plugins:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to import plugins",
    });
  }
});
