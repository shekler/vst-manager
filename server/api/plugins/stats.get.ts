import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    // Initialize database if not already done
    await dbService.initialize();

    // Get database statistics
    const stats = await dbService.getStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch statistics",
    });
  }
});
