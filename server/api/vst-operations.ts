import path from "path";
import { writeFile, mkdir, access } from "node:fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync, constants } from "fs";
import { initializeDatabase, syncPluginsFromJson, runQuery } from "./database";
import { ipcMain, getDataDir, getScannerPath } from "./electron-utils";
import { dialog } from "electron";

const execAsync = promisify(exec);

// Add path validation
const validateAndResolvePath = (inputPath: string): string | null => {
  try {
    const resolvedPath = path.resolve(inputPath);

    if (resolvedPath.includes("..")) {
      console.warn("Path contains parent directory references:", inputPath);
      return null;
    }

    // Check if path exists
    try {
      require("fs").accessSync(resolvedPath, constants.F_OK);
      return resolvedPath;
    } catch (error) {
      console.warn("Path does not exist:", resolvedPath);
      return null;
    }
  } catch (error) {
    console.warn("Invalid path:", inputPath);
    return null;
  }
};

// Improved user consent function following Electron best practices
const requestDirectoryAccess = async (directoryPath: string): Promise<boolean> => {
  try {
    // Use showOpenDialog for proper file system access consent
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Confirm VST Directory Access",
      message: `Grant access to scan VST plugins in this directory?`,
      buttonLabel: "Grant Access",
      defaultPath: directoryPath,
    });

    // If user selects the same directory or cancels, handle appropriately
    if (result.canceled) {
      return false;
    }

    // Verify the selected path matches or is within the requested path
    if (result.filePaths.length === 0) {
      return false;
    }

    const selectedPath = result.filePaths[0];
    if (!selectedPath) {
      return false;
    }

    const normalizedRequested = path.resolve(directoryPath);
    const normalizedSelected = path.resolve(selectedPath);

    return normalizedSelected === normalizedRequested || normalizedSelected.startsWith(normalizedRequested);
  } catch (error) {
    console.error("Error requesting directory access:", error);
    return false;
  }
};

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

// Update your scanPlugins function
export const scanPlugins = async (skipUserConsent: boolean = false) => {
  console.log("Scanning plugins...");
  try {
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

    // Parse and validate paths
    const rawPaths = vstPathsSetting
      .split(",")
      .map((path: string) => path.trim())
      .filter((path: string) => path.length > 0);

    // Validate each path and get user consent
    const validatedPaths: string[] = [];
    const invalidPaths: string[] = [];
    const deniedPaths: string[] = [];

    for (const rawPath of rawPaths) {
      const validatedPath = validateAndResolvePath(rawPath);

      if (!validatedPath) {
        invalidPaths.push(rawPath);
        continue;
      }

      // Request user consent for each directory (unless skipped)
      if (!skipUserConsent) {
        const hasConsent = await requestDirectoryAccess(validatedPath);
        if (!hasConsent) {
          deniedPaths.push(validatedPath);
          continue;
        }
      }

      validatedPaths.push(validatedPath);
    }

    // Report any issues with paths
    if (invalidPaths.length > 0) {
      console.warn("Invalid paths found:", invalidPaths);
    }
    if (deniedPaths.length > 0) {
      console.warn("Access denied to paths:", deniedPaths);
    }

    if (validatedPaths.length === 0) {
      return {
        success: false,
        error: "No valid or accessible VST paths found. Please check your settings.",
        details: {
          invalidPaths,
          deniedPaths,
        },
      };
    }

    // Scan each validated directory
    let allResults: any[] = [];
    const scanErrors: string[] = [];

    for (const directoryPath of validatedPaths) {
      try {
        // Additional runtime permission check
        await access(directoryPath, constants.R_OK);

        const tempOutputPath = path.join(getDataDir(), `temp-scan-${Date.now()}.json`);

        // Validate scanner executable exists and is accessible
        try {
          await access(scannerPath, constants.F_OK | constants.X_OK);
        } catch (error) {
          throw new Error(`Scanner executable not found or not executable: ${scannerPath}`);
        }

        // Use array form for better security (prevents injection)
        const args = [directoryPath, "-o", tempOutputPath];
        console.log(`Executing scanner: ${scannerPath} with args:`, args);

        const { stdout, stderr } = await execAsync(`"${scannerPath}" ${args.map((arg) => `"${arg}"`).join(" ")}`);

        if (stderr) {
          console.error(`Scanner stderr for ${directoryPath}:`, stderr);
        }

        if (stdout) {
          console.log(`Scanner stdout for ${directoryPath}:`, stdout);
        }

        // Read results
        const results = JSON.parse(readFileSync(tempOutputPath, "utf8"));

        if (results.plugins) {
          results.plugins.forEach((plugin: any) => {
            plugin.sourceDirectory = directoryPath;
          });
        }

        allResults = allResults.concat(results.plugins || []);

        // Cleanup
        try {
          await import("fs").then((fs) => fs.promises.unlink(tempOutputPath));
        } catch (cleanupError) {
          console.warn(`Failed to cleanup temp file ${tempOutputPath}:`, cleanupError);
        }
      } catch (error) {
        let errorMsg: string;
        if (error instanceof Error) {
          // Provide more specific error messages based on error type
          if (error.message.includes("ENOENT")) {
            errorMsg = `Scanner executable not found. Please ensure vst_scanner.exe is in the tools directory.`;
          } else if (error.message.includes("EACCES")) {
            errorMsg = `Permission denied accessing directory: ${directoryPath}`;
          } else if (error.message.includes("Scanner executable")) {
            errorMsg = error.message;
          } else {
            errorMsg = `Failed to scan directory ${directoryPath}: ${error.message}`;
          }
        } else {
          errorMsg = `Failed to scan directory ${directoryPath}: Unknown error`;
        }
        console.error(errorMsg);
        scanErrors.push(errorMsg);
      }
    }

    // Write combined results
    const combinedResults = {
      plugins: allResults,
      totalPlugins: allResults.length,
      validPlugins: allResults.filter((plugin) => plugin.isValid).length,
      scannedPaths: validatedPaths,
      errors: scanErrors.length > 0 ? scanErrors : undefined,
    };

    const dataDir = getDataDir();
    await mkdir(dataDir, { recursive: true });
    writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));

    console.log("Initializing database...");
    await initializeDatabase();

    console.log("Syncing plugins from JSON to database...");
    await syncPluginsFromJson();

    return {
      success: true,
      results: combinedResults,
      warnings: {
        invalidPaths: invalidPaths.length > 0 ? invalidPaths : undefined,
        deniedPaths: deniedPaths.length > 0 ? deniedPaths : undefined,
        scanErrors: scanErrors.length > 0 ? scanErrors : undefined,
      },
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

  ipcMain.handle("vst:scanPlugins", async (_event: any, options: { skipUserConsent?: boolean } = {}) => {
    try {
      return await scanPlugins(options.skipUserConsent || false);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Handler for selecting VST paths
  ipcMain.handle("vst:selectVstPath", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Select VST Plugin Directory",
        buttonLabel: "Select Directory",
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return {
          success: true,
          path: result.filePaths[0],
        };
      }

      return { success: false, error: "No directory selected" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Handler for testing VST path permissions
  ipcMain.handle("vst:testVstPermissions", async (_event: any, paths: string[]) => {
    try {
      const results: Record<string, { accessible: boolean; error?: string }> = {};
      let allAccessible = true;

      for (const vstPath of paths) {
        try {
          const resolvedPath = path.resolve(vstPath);
          await access(resolvedPath, constants.R_OK);
          results[vstPath] = { accessible: true };
        } catch (error) {
          results[vstPath] = {
            accessible: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
          allAccessible = false;
        }
      }

      return {
        success: allAccessible,
        details: results,
      };
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
}
