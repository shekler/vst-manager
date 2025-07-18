import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, "key");

    if (!key) {
      return {
        success: false,
        message: "Setting key is required",
      };
    }

    await dbService.initialize();
    const setting = await dbService.getSetting(key);

    if (!setting) {
      return {
        success: false,
        message: "Setting not found",
      };
    }

    return {
      success: true,
      data: setting,
    };
  } catch (error: any) {
    console.error("Error fetching setting:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch setting",
    };
  }
});
