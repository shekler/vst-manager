import { runQuery, runCommand, initializeDatabase } from "../database";

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, "key");
    const body = await readBody(event);
    const { value } = body;

    if (!key || !value) {
      throw createError({
        statusCode: 400,
        statusMessage: "Key and value are required",
      });
    }

    // Try to check if setting exists, initialize database if needed
    let existingSettings;
    try {
      existingSettings = await runQuery("SELECT * FROM settings WHERE key = ?", [key]);
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("Settings table not found, initializing database...");
        await initializeDatabase();
        existingSettings = [];
      } else {
        throw tableError;
      }
    }

    if (existingSettings.length > 0) {
      // Update existing setting
      await runCommand("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", [value, key]);
    } else {
      // Create new setting
      await runCommand("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
    }

    // Return updated setting
    const updatedSettings = await runQuery("SELECT * FROM settings WHERE key = ?", [key]);

    return {
      success: true,
      data: updatedSettings[0],
      message: "Setting updated successfully",
    };
  } catch (error) {
    console.error("Error updating setting:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update setting",
    });
  }
});
