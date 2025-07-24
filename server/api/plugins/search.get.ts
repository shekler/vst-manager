import { runQuery } from "../database";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event).q as string;

    if (!query) {
      throw createError({
        statusCode: 400,
        statusMessage: "Search query is required",
      });
    }

    // Search plugins in database
    const plugins = await runQuery(
      `
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
        key,
        created_at as createdAt,
        updated_at as updatedAt
      FROM plugins 
      WHERE name LIKE ? OR manufacturer LIKE ? OR path LIKE ?
      ORDER BY name
    `,
      [`%${query}%`, `%${query}%`, `%${query}%`],
    );

    // Parse categories JSON string back to array
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.categories || "[]"),
    }));

    return {
      success: true,
      data: processedPlugins,
      count: processedPlugins.length,
      query,
    };
  } catch (error: any) {
    console.error("Error searching plugins:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to search plugins",
    });
  }
});
