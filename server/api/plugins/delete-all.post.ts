import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    // Clear all plugins from the database
    await dbService.deleteAllPlugins();

    return {
      success: true,
      message: "All plugins deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting all plugins:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to delete all plugins",
    });
  }
});
