import { runQuery, runCommand, initializeDatabase, syncPluginsFromJson } from "./database";
import { ipcMain } from "./electron-utils";

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
  // Only setup IPC handlers if ipcMain is available (Electron environment)
  if (!ipcMain) {
    console.log("IPC not available, skipping plugins IPC setup");
    return;
  }

  ipcMain.handle("plugins:getPlugins", async () => {
    try {
      return await getPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("plugins:searchPlugins", async (_event: any, query: string) => {
    try {
      return await searchPlugins(query);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("plugins:savePluginKey", async (_event: any, pluginId: string, key: string) => {
    try {
      return await savePluginKey(pluginId, key);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
