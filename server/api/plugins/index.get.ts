import { runQuery } from "../database";

export default defineEventHandler(async (event) => {
  try {
    const plugins = await runQuery(`
      SELECT 
        id,
        name,
        path,
        manufacturer as vendor,
        version,
        categories,
        sdk_version as sdkVersion,
        is_valid as isValid,
        error,
        created_at as createdAt,
        updated_at as updatedAt
      FROM plugins 
      ORDER BY name
    `);

    // Parse categories JSON string back to array
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.categories || "[]"),
      // Remove categories field as it's now subCategories
      categories: undefined,
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
