import { readFile } from "node:fs/promises";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event).q as string;

    if (!query) {
      throw createError({
        statusCode: 400,
        statusMessage: "Search query is required",
      });
    }

    const plugins = await readFile("./data/scanned-plugins.json", "utf8");

    return {
      success: true,
      data: plugins,
      count: plugins.length,
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
