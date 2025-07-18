import dbService from "../database";

export default defineEventHandler(async (event) => {
  try {
    await dbService.initialize();
    const settings = await dbService.getAllSettings();

    return {
      success: true,
      data: settings,
    };
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch settings",
    };
  }
});
