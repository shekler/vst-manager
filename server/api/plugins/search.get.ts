import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event).q as string;

    if (!query) {
      throw createError({
        statusCode: 400,
        statusMessage: "Search query is required",
      });
    }

    // Initialize database if not already done
    await dbService.initialize();

    // Search plugins
    const plugins = await dbService.searchPlugins(query);

    return {
      success: true,
      data: plugins,
      count: plugins.length,
      query,
    };
  } catch (error: any) {
    console.error("Error searching plugins:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to search plugins",
    });
  }
});
