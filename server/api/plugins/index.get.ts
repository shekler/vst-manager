import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    console.log("API: Starting plugins fetch request");

    // Initialize database if not already done
    console.log("API: Initializing database...");
    await dbService.initialize();
    console.log("API: Database initialized successfully");

    // Get all plugins
    console.log("API: Fetching plugins from database...");
    const plugins = await dbService.getAllPlugins();
    console.log(`API: Successfully fetched ${plugins.length} plugins`);

    return {
      success: true,
      data: plugins,
      count: plugins.length,
    };
  } catch (error: any) {
    console.error("API: Error fetching plugins:", error);
    console.error("API: Error stack:", error.stack);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch plugins: ${error.message}`,
    });
  }
});
