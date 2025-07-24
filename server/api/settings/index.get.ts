import { runQuery, initializeDatabase } from "../database";

export default defineEventHandler(async (event) => {
  try {
    // Try to fetch settings first
    let settings;
    try {
      settings = await runQuery("SELECT * FROM settings");
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("Settings table not found, initializing database...");
        await initializeDatabase();

        // Try fetching again after initialization
        settings = await runQuery("SELECT * FROM settings");
      } else {
        throw tableError;
      }
    }

    // If no settings exist, create default settings
    if (settings.length === 0) {
      await createDefaultSettings();
      return await runQuery("SELECT * FROM settings");
    }

    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch settings",
    });
  }
});

async function createDefaultSettings() {
  const { runCommand } = await import("../database");

  const defaultSettings = [
    {
      key: "vst_paths",
      value: "C:\\Program Files\\VSTPlugins,C:\\Program Files (x86)\\VSTPlugins",
      description: "Comma-separated list of directories containing VST plugins",
    },
  ];

  for (const setting of defaultSettings) {
    await runCommand("INSERT INTO settings (key, value, description) VALUES (?, ?, ?)", [setting.key, setting.value, setting.description]);
  }
}
