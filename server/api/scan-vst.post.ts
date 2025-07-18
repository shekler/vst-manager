// server/api/scan-vst.post.ts
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { directoryPath, outputFile = null } = body;

    if (!directoryPath) {
      throw createError({
        statusCode: 400,
        statusMessage: "Directory path is required",
      });
    }

    // Import Node.js modules dynamically
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const { readFile, unlink, mkdir } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { existsSync } = await import("node:fs");

    const execAsync = promisify(exec);

    // Validate that the directory exists
    if (!existsSync(directoryPath)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Directory does not exist: ${directoryPath}`,
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

    const outputFileName = outputFile || `scanned-plugins.json`;
    const outputPath = join(dataDir, outputFileName);

    // Execute scanner
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
    if (!existsSync(outputPath)) {
      throw createError({
        statusCode: 500,
        statusMessage: `Scanner did not create output file. stderr: ${stderr || "No error output"}`,
      });
    }

    // Read results
    const jsonContent = await readFile(outputPath, "utf-8");
    const scanResults = JSON.parse(jsonContent);

    // No cleanup needed since we're saving to data directory

    return {
      success: true,
      data: scanResults,
      message: `Scanned ${scanResults.totalPlugins} plugins`,
    };
  } catch (error: any) {
    console.error("Scan error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Scanner failed: ${error.message}`,
    });
  }
});
