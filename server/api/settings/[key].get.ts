import { runQuery, initializeDatabase } from "../database";

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, "key");

    if (!key) {
      throw createError({
        statusCode: 400,
        statusMessage: "Setting key is required",
      });
    }

    // Try to fetch setting, initialize database if needed
    let settings;
    try {
      settings = await runQuery("SELECT * FROM settings WHERE key = ?", [key]);
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("Settings table not found, initializing database...");
        await initializeDatabase();
        settings = [];
      } else {
        throw tableError;
      }
    }

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
