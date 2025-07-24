import { runQuery, initializeDatabase, syncPluginsFromJson } from "../database";

export default defineEventHandler(async (event) => {
  try {
    // Try to fetch plugins first
    let plugins;
    try {
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
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("Plugins table not found, initializing database...");
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
      } else {
        throw tableError;
      }
    }

    // Parse subCategories JSON string back to array
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.subCategories || "[]"),
    }));

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
