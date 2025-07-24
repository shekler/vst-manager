import { readFile } from "node:fs/promises";

export default defineEventHandler(async (event) => {
  try {
    const data = await readFile("./data/scanned-plugins.json", "utf8");

    return {
      success: true,
      data: JSON.parse(data).plugins,
      count: JSON.parse(data).plugins.length,
    };
  } catch (error: any) {
    console.error("API: Error fetching plugins:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch plugins: ${error.message}`,
    });
  }
});
