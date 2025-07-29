import { ipcMain } from "electron";
import { runQuery, runCommand, initializeDatabase, syncPluginsFromJson } from "./database";

// Get all plugins from database
export const getPlugins = async () => {
  try {
    console.log("IPC: Getting plugins from database...");

    // Test database connection first
    const dbTest = await runQuery("SELECT 1 as test");
    console.log("IPC: Database connection test result:", dbTest);

    // Try to fetch plugins first
    let plugins;
    try {
      console.log("IPC: Attempting to fetch plugins from database...");
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
      console.log(`IPC: Successfully fetched ${plugins.length} plugins from database`);
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("IPC: Plugins table not found, initializing database...");
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
        console.log(`IPC: Successfully fetched ${plugins.length} plugins after initialization`);
      } else {
        throw tableError;
      }
    }

    // Parse subCategories JSON string back to array
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.subCategories || "[]"),
    }));

    console.log(`IPC: Returning ${processedPlugins.length} processed plugins`);
    return {
      success: true,
      data: processedPlugins,
      count: processedPlugins.length,
    };
  } catch (error: any) {
    console.error("IPC: Error fetching plugins:", error);
    return { success: false, error: error.message };
  }
};

// Search plugins in database
export const searchPlugins = async (query: string) => {
  try {
    console.log(`IPC: Searching plugins with query: "${query}"`);

    if (!query) {
      return { success: false, error: "Search query is required" };
    }

    // Search plugins in database
    const plugins = await runQuery(
      `
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
      WHERE name LIKE ? OR vendor LIKE ? OR path LIKE ?
      ORDER BY name
    `,
      [`%${query}%`, `%${query}%`, `%${query}%`],
    );

    // Parse subCategories JSON string back to array
    const processedPlugins = plugins.map((plugin) => ({
      ...plugin,
      subCategories: JSON.parse(plugin.subCategories || "[]"),
    }));

    console.log(`IPC: Found ${processedPlugins.length} plugins matching query`);
    return {
      success: true,
      data: processedPlugins,
      count: processedPlugins.length,
      query,
    };
  } catch (error: any) {
    console.error("IPC: Error searching plugins:", error);
    return { success: false, error: error.message };
  }
};

// Save plugin key to database
export const savePluginKey = async (pluginId: string, key: string) => {
  try {
    console.log(`IPC: Saving key for plugin ${pluginId}`);

    if (!pluginId) {
      return { success: false, error: "Plugin ID is required" };
    }

    if (key === undefined || key === null) {
      return { success: false, error: "Key value is required" };
    }

    // Update the plugin's key in the database
    await runCommand('UPDATE plugins SET key = ?, updated_at = datetime("now") WHERE id = ?', [key, pluginId]);

    console.log(`IPC: Successfully saved key for plugin ${pluginId}`);
    return {
      success: true,
      message: "Key saved successfully",
    };
  } catch (error: any) {
    console.error("IPC: Error saving plugin key:", error);
    return { success: false, error: error.message };
  }
};

// Setup IPC handlers for plugins operations
export function setupPluginsIPC() {
  ipcMain.handle("plugins:getPlugins", async () => {
    try {
      return await getPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("plugins:searchPlugins", async (event, query: string) => {
    try {
      return await searchPlugins(query);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("plugins:savePluginKey", async (event, pluginId: string, key: string) => {
    try {
      return await savePluginKey(pluginId, key);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
