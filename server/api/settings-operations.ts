import { runQuery, runCommand, initializeDatabase } from "./database";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { ipcMain } from "./electron-utils";

// Get all settings from database
export const getSettings = async () => {
  try {
    console.log("IPC: Getting settings from database...");

    // Try to fetch settings first
    let settings;
    try {
      settings = await runQuery("SELECT * FROM settings");
      console.log(`IPC: Successfully fetched ${settings.length} settings from database`);
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("IPC: Settings table not found, initializing database...");
        await initializeDatabase();

        // Try fetching again after initialization
        settings = await runQuery("SELECT * FROM settings");
        console.log(`IPC: Successfully fetched ${settings.length} settings after initialization`);
      } else {
        throw tableError;
      }
    }

    // If no settings exist, create default settings
    if (settings.length === 0) {
      console.log("IPC: No settings found, creating default settings...");
      await createDefaultSettings();
      settings = await runQuery("SELECT * FROM settings");
      console.log(`IPC: Created ${settings.length} default settings`);
    }

    return {
      success: true,
      data: settings,
    };
  } catch (error: any) {
    console.error("IPC: Error fetching settings:", error);
    return { success: false, error: error.message };
  }
};

// Get setting by key
export const getSetting = async (key: string) => {
  try {
    console.log(`IPC: Getting setting with key: "${key}"`);

    const settings = await runQuery("SELECT * FROM settings WHERE key = ?", [key]);

    if (settings.length > 0) {
      console.log(`IPC: Found setting for key "${key}"`);
      return {
        success: true,
        data: settings[0],
      };
    } else {
      console.log(`IPC: No setting found for key "${key}"`);
      return {
        success: false,
        error: "Setting not found",
      };
    }
  } catch (error: any) {
    console.error("IPC: Error fetching setting:", error);
    return { success: false, error: error.message };
  }
};

// Update setting
export const updateSetting = async (key: string, value: string) => {
  try {
    console.log(`IPC: Updating setting "${key}" with value: "${value}"`);

    if (!key || !value) {
      return { success: false, error: "Key and value are required" };
    }

    // Try to check if setting exists, initialize database if needed
    let existingSettings;
    try {
      existingSettings = await runQuery("SELECT * FROM settings WHERE key = ?", [key]);
    } catch (tableError: any) {
      // If table doesn't exist, initialize the database
      if (tableError.message.includes("no such table")) {
        console.log("IPC: Settings table not found, initializing database...");
        await initializeDatabase();
        existingSettings = [];
      } else {
        throw tableError;
      }
    }

    if (existingSettings.length > 0) {
      // Update existing setting
      await runCommand("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", [value, key]);
      console.log(`IPC: Updated existing setting "${key}"`);
    } else {
      // Create new setting
      await runCommand("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
      console.log(`IPC: Created new setting "${key}"`);
    }

    // Return updated setting
    const updatedSettings = await runQuery("SELECT * FROM settings WHERE key = ?", [key]);

    return {
      success: true,
      data: updatedSettings[0],
      message: "Setting updated successfully",
    };
  } catch (error: any) {
    console.error("IPC: Error updating setting:", error);
    return { success: false, error: error.message };
  }
};

// Validate paths
export const validatePaths = async (paths: string[]) => {
  try {
    console.log(`IPC: Validating ${paths.length} paths`);

    if (!paths || !Array.isArray(paths)) {
      return { success: false, error: "Paths array is required" };
    }

    const validations = await Promise.all(
      paths.map(async (path: string) => {
        try {
          await access(path.trim(), constants.R_OK);
          return { path, exists: true };
        } catch (error) {
          return { path, exists: false, error: "Directory does not exist or is not accessible" };
        }
      }),
    );

    console.log(`IPC: Validated ${validations.length} paths`);
    return {
      success: true,
      data: validations,
    };
  } catch (error: any) {
    console.error("IPC: Error validating paths:", error);
    return { success: false, error: error.message };
  }
};

// Create default settings
async function createDefaultSettings() {
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

// Setup IPC handlers for settings operations
export function setupSettingsIPC() {
  // Only setup IPC handlers if ipcMain is available (Electron environment)
  if (!ipcMain) {
    console.log("IPC not available, skipping settings IPC setup");
    return;
  }

  ipcMain.handle("settings:getSettings", async () => {
    try {
      return await getSettings();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("settings:getSetting", async (_event: any, key: string) => {
    try {
      return await getSetting(key);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("settings:updateSetting", async (_event: any, key: string, value: string) => {
    try {
      return await updateSetting(key, value);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("settings:validatePaths", async (_event: any, paths: string[]) => {
    try {
      return await validatePaths(paths);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
