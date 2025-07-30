import path from "path";
import { writeFile, mkdir, access } from "node:fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync, constants } from "fs";
import { initializeDatabase, syncPluginsFromJson, runQuery } from "./database";
import { ipcMain, getDataDir, getScannerPath } from "./electron-utils";

const execAsync = promisify(exec);

// Permission check function for write operations
export const checkWritePermissions = async () => {
  const dataDir = getDataDir();
  const scannerPath = getScannerPath();

  const checks = {
    dataDirectory: {
      path: dataDir,
      exists: false,
      writable: false,
      error: null as string | null,
    },
    scannerExecutable: {
      path: scannerPath,
      exists: false,
      executable: false,
      error: null as string | null,
    },
    testFile: {
      path: path.join(dataDir, "permission-test.txt"),
      writable: false,
      error: null as string | null,
    },
  };

  try {
    // Check if data directory exists and is writable
    try {
      await access(dataDir, constants.F_OK);
      checks.dataDirectory.exists = true;

      try {
        await access(dataDir, constants.W_OK);
        checks.dataDirectory.writable = true;
      } catch (error) {
        checks.dataDirectory.error = "Directory exists but is not writable";
      }
    } catch (error) {
      checks.dataDirectory.error = "Directory does not exist";
    }

    // Check if scanner executable exists and is executable
    try {
      await access(scannerPath, constants.F_OK);
      checks.scannerExecutable.exists = true;

      try {
        await access(scannerPath, constants.X_OK);
        checks.scannerExecutable.executable = true;
      } catch (error) {
        checks.scannerExecutable.error = "File exists but is not executable";
      }
    } catch (error) {
      checks.scannerExecutable.error = "Scanner executable not found";
    }

    // Test write permission by creating a test file
    try {
      await mkdir(dataDir, { recursive: true });
      await writeFile(checks.testFile.path, "test", "utf-8");
      checks.testFile.writable = true;

      // Clean up test file
      try {
        const { unlink } = await import("node:fs/promises");
        await unlink(checks.testFile.path);
      } catch (cleanupError) {
        console.warn("Could not clean up test file:", cleanupError);
      }
    } catch (error) {
      checks.testFile.error = "Cannot write to data directory";
    }

    return {
      success: checks.dataDirectory.writable && checks.scannerExecutable.executable && checks.testFile.writable,
      checks,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during permission check",
      checks,
    };
  }
};

// Permission check function for read operations (scanning)
export const checkReadPermissions = async () => {
  const scannerPath = getScannerPath();
  const dataDir = getDataDir();

  console.log("Checking read permissions:");
  console.log("Scanner path:", scannerPath);
  console.log("Data directory:", dataDir);

  const checks = {
    scannerExecutable: {
      path: scannerPath,
      exists: false,
      executable: false,
      error: null as string | null,
    },
    dataDirectory: {
      path: dataDir,
      exists: false,
      readable: false,
      error: null as string | null,
    },
    // Note: VST directory access is handled by Electron's File System Access API
    // through the 'file-system-access-restricted' event in main.ts
  };

  try {
    // Check if scanner executable exists and is executable
    try {
      await access(scannerPath, constants.F_OK);
      checks.scannerExecutable.exists = true;
      console.log("Scanner executable exists");

      try {
        await access(scannerPath, constants.X_OK);
        checks.scannerExecutable.executable = true;
        console.log("Scanner executable is executable");
      } catch (error) {
        checks.scannerExecutable.error = "File exists but is not executable";
        console.error("Scanner executable not executable:", error);
      }
    } catch (error) {
      checks.scannerExecutable.error = `Scanner executable not found at: ${scannerPath}`;
      console.error("Scanner executable not found:", error);
    }

    // Check if data directory exists and is readable
    try {
      await access(dataDir, constants.F_OK);
      checks.dataDirectory.exists = true;
      console.log("Data directory exists");

      try {
        await access(dataDir, constants.R_OK);
        checks.dataDirectory.readable = true;
        console.log("Data directory is readable");
      } catch (error) {
        checks.dataDirectory.error = "Directory exists but is not readable";
        console.error("Data directory not readable:", error);
      }
    } catch (error) {
      checks.dataDirectory.error = "Data directory does not exist";
      console.error("Data directory does not exist:", error);
    }

    const success = checks.scannerExecutable.executable && checks.dataDirectory.readable;
    console.log("Permission check result:", success ? "SUCCESS" : "FAILED");

    return {
      success,
      checks,
    };
  } catch (error) {
    console.error("Unexpected error during permission check:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during permission check",
      checks,
    };
  }
};

export const exportPlugins = async () => {
  const plugins = await runQuery(`
    SELECT 
      id,
      name,
      path,
      vendor,
      version,
      category,
      subCategories,
      sdkVersion,
      key,
      created_at as createdAt,
      updated_at as updatedAt
    FROM plugins 
    ORDER BY name
  `);

  // Transform the data to match the exact scanned plugins format
  const transformedPlugins = plugins.map((plugin) => ({
    id: plugin.id,
    name: plugin.name,
    path: plugin.path,
    vendor: plugin.vendor,
    version: plugin.version,
    category: plugin.category,
    subCategories: plugin.subCategories || "[]",
    sdkVersion: plugin.sdkVersion,
    key: plugin.key,
    createdAt: plugin.createdAt,
    updatedAt: plugin.updatedAt,
  }));

  // Ensure data directory exists - use shared utility
  const dataDir = getDataDir();
  await mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, "exported-plugins.json");
  const fileContent = JSON.stringify({ plugins: transformedPlugins }, null, 2);
  await writeFile(filePath, fileContent, "utf-8");

  return { success: true, message: "Plugins exported successfully", filePath };
};

export const importPlugins = async (fileData: { name: string; content: string }) => {
  if (!fileData) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!fileData.name.toLowerCase().endsWith(".json")) {
    return { success: false, error: "File must be a JSON file" };
  }

  // Use the file content directly
  const fileContent = fileData.content;

  // Validate JSON format
  let jsonData;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    return { success: false, error: "Invalid JSON format" };
  }

  // Handle different JSON formats
  let pluginsArray;
  if (Array.isArray(jsonData)) {
    // Direct array format: [...]
    pluginsArray = jsonData;
  } else if (jsonData.plugins && Array.isArray(jsonData.plugins)) {
    // Object with plugins array: { "plugins": [...] }
    pluginsArray = jsonData.plugins;
  } else {
    return { success: false, error: "JSON file must contain a plugins array or an object with a 'plugins' property" };
  }

  // Ensure data directory exists
  const dataDir = getDataDir();
  await mkdir(dataDir, { recursive: true });

  // Create the proper format for scanned-plugins.json
  const formattedData = { plugins: pluginsArray };
  const jsonPath = path.join(dataDir, "scanned-plugins.json");
  await writeFile(jsonPath, JSON.stringify(formattedData, null, 2), "utf-8");

  // Initialize database and sync plugins
  await initializeDatabase();
  await syncPluginsFromJson();

  return {
    success: true,
    message: `Successfully imported ${pluginsArray.length} plugins`,
    count: pluginsArray.length,
  };
};

export const scanPlugins = async () => {
  console.log("Scanning plugins...");
  try {
    // Check permissions first
    const permissionCheck = await checkReadPermissions();
    if (!permissionCheck.success) {
      console.error("Permission check failed:", permissionCheck);
      return {
        success: false,
        error: "Scanner executable access denied. Please check permissions.",
        permissionDetails: permissionCheck,
      };
    }

    // Use shared utilities for path logic
    const scannerPath = getScannerPath();
    const outputPath = path.join(getDataDir(), "scanned-plugins.json");

    // Fetch VST paths from settings
    let vstPathsSetting;
    try {
      const settings = await runQuery("SELECT * FROM settings WHERE key = 'vst_paths'");
      console.log("Settings query result:", settings);
      if (settings.length === 0) {
        throw new Error("VST paths setting not found");
      }
      vstPathsSetting = settings[0].value;
      console.log("VST paths setting value:", vstPathsSetting);
    } catch (error) {
      console.error("Failed to fetch VST paths from settings:", error);
      return {
        success: false,
        error: "VST paths not configured. Please set up paths in Settings first.",
      };
    }

    // Parse comma-separated paths
    const directoryPaths = vstPathsSetting
      .split(",")
      .map((path: string) => path.trim())
      .filter((path: string) => path.length > 0);

    // Scan each directory and combine results
    let allResults: any[] = [];

    for (const directoryPath of directoryPaths) {
      try {
        // Create a temporary output file for each directory scan
        const tempOutputPath = path.join(getDataDir(), `temp-scan-${Date.now()}.json`);

        const command = `"${scannerPath}" "${directoryPath}" -o "${tempOutputPath}"`;
        console.log(`Executing command: ${command}`);

        // Execute the scanner for this directory
        const { stdout, stderr } = await execAsync(command);

        if (stderr) {
          console.error(`Scanner stderr for ${directoryPath}:`, stderr);
        }

        if (stdout) {
          console.log(`Scanner stdout for ${directoryPath}:`, stdout);
        }

        // Read the results from the temporary output file
        const results = JSON.parse(readFileSync(tempOutputPath, "utf8"));

        // Add the directory path to each plugin result for tracking
        if (results.plugins) {
          results.plugins.forEach((plugin: any) => {
            plugin.sourceDirectory = directoryPath;
          });
        }

        allResults = allResults.concat(results.plugins || []);

        // Clean up temporary file
        try {
          await import("fs").then((fs) => fs.promises.unlink(tempOutputPath));
        } catch (cleanupError) {
          console.warn(`Failed to cleanup temp file ${tempOutputPath}:`, cleanupError);
        }
      } catch (error) {
        console.error(`Failed to scan directory ${directoryPath}:`, error);
        // Continue with other directories even if one fails
      }
    }

    // Write combined results back to the output file
    const combinedResults = {
      plugins: allResults,
      totalPlugins: allResults.length,
      validPlugins: allResults.filter((plugin) => plugin.isValid).length,
    };

    // Ensure data directory exists before writing
    const dataDir = getDataDir();
    await mkdir(dataDir, { recursive: true });

    // Write the combined results to the scanned-plugins.json file
    writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));

    // Initialize database and sync plugins
    console.log("Initializing database...");
    await initializeDatabase();

    console.log("Syncing plugins from JSON to database...");
    await syncPluginsFromJson();

    return {
      success: true,
      results: combinedResults,
    };
  } catch (error) {
    console.error("Scan failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const deletePlugins = async () => {
  try {
    const response = await runQuery(`DELETE FROM plugins`);
    return { success: true, results: response };
  } catch (error) {
    console.error("Error deleting plugins:", error);
    return { success: false, error: "Failed to delete plugins" };
  }
};

export const downloadPlugins = async () => {
  try {
    // Get the data directly from the database
    const plugins = await runQuery(`
      SELECT 
        id,
        name,
        path,
        vendor,
        version,
        category,
        subCategories,
        sdkVersion,
        key,
        created_at as createdAt,
        updated_at as updatedAt
      FROM plugins 
      ORDER BY name
    `);

    return {
      success: true,
      data: plugins,
      message: "File data retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error downloading plugins:", error);
    return { success: false, error: error.message };
  }
};

export function setupVstIPC() {
  // Only setup IPC handlers if ipcMain is available (Electron environment)
  if (!ipcMain) {
    console.log("IPC not available, skipping VST IPC setup");
    return;
  }

  ipcMain.handle("vst:exportPlugins", async () => {
    try {
      return await exportPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:importPlugins", async (_event: any, fileData: { name: string; content: string }) => {
    try {
      return await importPlugins(fileData);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:scanPlugins", async () => {
    try {
      return await scanPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:deletePlugins", async () => {
    try {
      return await deletePlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:downloadPlugins", async () => {
    try {
      return await downloadPlugins();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:checkPermissions", async () => {
    try {
      return await checkWritePermissions();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("vst:checkReadPermissions", async () => {
    try {
      return await checkReadPermissions();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
