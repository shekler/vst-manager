// server/api/scan-vst-settings.post.ts
import dbService from "./database";

export default defineEventHandler(async (event) => {
  try {
    // Import Node.js modules dynamically
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const { readFile, unlink, mkdir } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { existsSync } = await import("node:fs");

    const execAsync = promisify(exec);

    // Initialize database to get settings
    await dbService.initialize();

    // Get VST paths from settings
    const vstPathsSetting = await dbService.getSetting("vst_paths");
    const vst3PathsSetting = await dbService.getSetting("vst3_paths");

    if (!vstPathsSetting && !vst3PathsSetting) {
      throw createError({
        statusCode: 400,
        statusMessage: "No VST paths configured in settings. Please configure paths in Settings page first.",
      });
    }

    // Parse paths from settings
    const vstPaths = vstPathsSetting
      ? vstPathsSetting.value
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p)
      : [];
    const vst3Paths = vst3PathsSetting
      ? vst3PathsSetting.value
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p)
      : [];

    const allPaths = [...vstPaths, ...vst3Paths];

    if (allPaths.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No valid VST paths found in settings. Please configure paths in Settings page first.",
      });
    }

    // Validate that at least one directory exists
    const existingPaths = allPaths.filter((path) => existsSync(path));

    if (existingPaths.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "None of the configured VST paths exist. Please check your settings.",
      });
    }

    // Path to scanner in your Nuxt project
    const scannerPath = join(process.cwd(), "tools", "vst_scanner.exe");

    if (!existsSync(scannerPath)) {
      throw createError({
        statusCode: 500,
        statusMessage: "VST Scanner not found in tools directory",
      });
    }

    // Use data directory for output
    const dataDir = join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    const outputFileName = `scanned-plugins.json`;
    const outputPath = join(dataDir, outputFileName);

    // Execute scanner for each existing path
    let totalResults: {
      totalPlugins: number;
      validPlugins: number;
      plugins: any[];
    } = {
      totalPlugins: 0,
      validPlugins: 0,
      plugins: [],
    };

    for (const directoryPath of existingPaths) {
      try {
        console.log(`Scanning directory: ${directoryPath}`);

        const command = `"${scannerPath}" "${directoryPath}" -o "${outputPath}"`;
        console.log(`Executing command: ${command}`);

        const { stdout, stderr } = await execAsync(command);

        // Log stdout and stderr for debugging
        if (stdout) {
          console.log("Scanner stdout:", stdout);
        }
        if (stderr) {
          console.log("Scanner stderr:", stderr);
        }

        // Check if output file was created
        if (existsSync(outputPath)) {
          // Read results
          const jsonContent = await readFile(outputPath, "utf-8");
          const scanResults = JSON.parse(jsonContent);

          // Accumulate results
          totalResults.totalPlugins += scanResults.totalPlugins || 0;
          totalResults.validPlugins += scanResults.validPlugins || 0;
          if (scanResults.plugins) {
            totalResults.plugins.push(...scanResults.plugins);
          }
        }
      } catch (error: any) {
        console.error(`Error scanning directory ${directoryPath}:`, error);
        // Continue with other directories even if one fails
      }
    }

    // Import the scanned plugins into database
    await dbService.importFromJson();

    // Get the updated count from database
    const plugins = await dbService.getAllPlugins();

    return {
      success: true,
      data: totalResults,
      message: `Scanned ${totalResults.totalPlugins} plugins from ${existingPaths.length} directories and updated database with ${plugins.length} total plugins`,
    };
  } catch (error: any) {
    console.error("Scan error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Scanner failed: ${error.message}`,
    });
  }
});
