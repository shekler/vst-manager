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

    await dbService.deletePlugin(id);

    return {
      success: true,
      message: "Plugin deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting plugin:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to delete plugin",
    });
  }
});
