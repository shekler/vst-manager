import { initializeDatabase, syncPluginsFromJson } from "../database";

export default defineEventHandler(async (event) => {
  try {
    console.log("Initializing database...");
    await initializeDatabase();

    console.log("Syncing plugins from JSON to database...");
    await syncPluginsFromJson();

    return {
      success: true,
      message: "Database initialized and plugins synced successfully",
    };
  } catch (error: any) {
    console.error("Database initialization failed:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to initialize database: ${error.message}`,
    });
  }
});
