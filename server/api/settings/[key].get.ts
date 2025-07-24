import { runQuery } from "../database";

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, "key");

    if (!key) {
      throw createError({
        statusCode: 400,
        statusMessage: "Setting key is required",
      });
    }

    const settings = await runQuery("SELECT * FROM settings WHERE key = ?", [key]);

    if (settings.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Setting not found",
      });
    }

    return {
      success: true,
      data: settings[0],
    };
  } catch (error) {
    console.error("Error fetching setting:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch setting",
    });
  }
});
