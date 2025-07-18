// server/api/vst/list.get.ts
export default defineEventHandler(async (event) => {
  try {
    // Import Node.js modules dynamically
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { existsSync } = await import("node:fs");

    // Path to the scanned plugins data file
    const dataPath = join(process.cwd(), "data", "scanned-plugins.json");

    if (!existsSync(dataPath)) {
      return {
        success: true,
        plugins: [],
        message: "No plugins found. Run a scan first.",
      };
    }

    // Read the data file
    const jsonContent = await readFile(dataPath, "utf-8");
    const scanData = JSON.parse(jsonContent);

    // Transform the data to match the expected format
    const plugins = (scanData.plugins || []).map(
      (plugin: any, index: number) => ({
        id: index + 1,
        name: plugin.name || "Unknown Name",
        vendor: plugin.vendor || "Unknown Vendor",
        product: plugin.product || plugin.name || "Unknown Product",
        version: plugin.version || "Unknown Version",
        filePath: plugin.path || plugin.filePath || "Unknown Path",
        category: plugin.category || "Unknown Category",
        isValid: plugin.isValid !== false,
        error: plugin.error || null,
      }),
    );

    return {
      success: true,
      plugins,
      message: `Found ${plugins.length} plugins`,
    };
  } catch (error: any) {
    console.error("Error reading plugins:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read plugins: ${error.message}`,
    });
  }
});
