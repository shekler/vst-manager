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
            const parsed = JSON.parse(plugin.path);
            // If it's an array with only one element, return just the string for single paths
            if (Array.isArray(parsed) && parsed.length === 1) {
              return parsed[0];
            }
            return parsed;
          }
          return plugin.path;
        } catch (error) {
          console.warn(`Failed to parse path JSON for plugin ${plugin.name}:`, error, plugin.path);
          // If JSON parsing fails, try to extract the path from the malformed JSON string
          if (typeof plugin.path === "string" && plugin.path.includes('"')) {
            // Extract the path between quotes as a fallback
            const match = plugin.path.match(/"([^"]+)"/);
            return match ? match[1] : plugin.path;
          }
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
