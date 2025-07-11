import { defineEventHandler, getQuery } from "h3";
import { PluginDatabaseCrawler } from "../../utils/plugin-crawler";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const sources = Array.isArray(query.sources)
      ? query.sources
      : typeof query.sources === "string"
        ? [query.sources]
        : ["all"];

    const crawler = new PluginDatabaseCrawler({
      rateLimit: 1, // Be respectful
      maxRetries: 3,
      timeout: 10000,
    });

    let results: any[] = [];

    if (sources.includes("all") || sources.includes("pluginboutique")) {
      const pbResults = await crawler.crawlPluginBoutique();
      results.push(...pbResults);
    }

    if (sources.includes("all") || sources.includes("kvr")) {
      const kvrResults = await crawler.crawlKVR();
      results.push(...kvrResults);
    }

    // Save to file
    await crawler.saveToFile();

    return {
      success: true,
      message: `Successfully crawled ${results.length} plugins`,
      count: results.length,
      sources: sources,
      manufacturers: crawler.getManufacturers(),
      data: results.slice(0, 10), // Return first 10 as preview
    };
  } catch (error) {
    console.error("Plugin crawling error:", error);
    return {
      success: false,
      message: "Failed to crawl plugin databases",
      error: (error as Error).message,
    };
  }
});
