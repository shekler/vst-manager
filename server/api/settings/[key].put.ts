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

    const body = await readBody(event);
    const { value } = body;

    if (value === undefined) {
      return {
        success: false,
        message: "Setting value is required",
      };
    }

    await dbService.initialize();
    await dbService.updateSetting(key, value);

    // Get the updated setting
    const updatedSetting = await dbService.getSetting(key);

    return {
      success: true,
      data: updatedSetting,
      message: "Setting updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating setting:", error);
    return {
      success: false,
      message: error.message || "Failed to update setting",
    };
  }
});
