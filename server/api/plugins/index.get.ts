import { runQuery, initializeDatabase, syncPluginsFromJson } from "../database";

export default defineEventHandler(async (event) => {
  console.log("API: /api/plugins endpoint called");
  try {
    // Test database connection first
    console.log("API: Testing database connection...");
    const dbTest = await runQuery("SELECT 1 as test");
    console.log("API: Database connection test result:", dbTest);

    // Try to fetch plugins first
    let plugins;
    try {
      console.log("API: Attempting to fetch plugins from database...");
      plugins = await runQuery(`
        SELECT 
          id,
          name,
          path,
          vendor,
          version,
          subCategories,
          sdkVersion,
          isValid,
          error,
          key,
          created_at as createdAt,
          updated_at as updatedAt
        FROM plugins 
        ORDER BY name
      `);
      console.log(`API: Successfully fetched ${plugins.length} plugins from database`);
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("API: Plugins table not found, initializing database...");
        await initializeDatabase();
        await syncPluginsFromJson();

        // Try fetching again after initialization
        plugins = await runQuery(`
          SELECT 
            id,
            name,
            path,
            vendor,
            version,
            subCategories,
            sdkVersion,
            isValid,
            error,
            key,
            created_at as createdAt,
            updated_at as updatedAt
          FROM plugins 
          ORDER BY name
        `);
        console.log(`API: Successfully fetched ${plugins.length} plugins after initialization`);
      } else {
        throw tableError;
      }
    }

    // Parse subCategories and path JSON strings back to arrays
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.subCategories || "[]"),
      // Parse path from JSON if it's a string that looks like JSON, otherwise keep as is for backwards compatibility
      path: (() => {
        try {
          if (typeof plugin.path === "string" && plugin.path.startsWith("[")) {
            return JSON.parse(plugin.path);
          }
          return plugin.path;
        } catch {
          return plugin.path;
        }
      })(),
    }));

    console.log(`API: Returning ${processedPlugins.length} processed plugins`);
    return {
      success: true,
      data: processedPlugins,
      count: processedPlugins.length,
    };
  } catch (error: any) {
    console.error("API: Error fetching plugins:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch plugins: ${error.message}`,
    });
  }
});
