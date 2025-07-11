import axios from "axios";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

interface PluginData {
  name: string;
  manufacturer: string;
  version?: string;
  description?: string;
  price?: string;
  url?: string;
  category?: string;
  platform?: string[];
  source: string;
  crawledAt: string;
}

interface CrawlerConfig {
  rateLimit: number; // requests per second
  maxRetries: number;
  timeout: number;
  outputPath: string;
}

export class PluginDatabaseCrawler {
  private config: CrawlerConfig;
  private plugins: PluginData[] = [];

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = {
      rateLimit: 1,
      maxRetries: 3,
      timeout: 10000,
      outputPath: join(process.cwd(), "data", "crawled-plugins.json"),
      ...config,
    };
  }

  // Rate limiting helper
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Generic HTTP request with retry logic
  private async makeRequest(url: string, options: any = {}): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: this.config.timeout,
          headers: {
            "User-Agent": "VST-Plugin-Manager/1.0 (Educational Project)",
            ...options.headers,
          },
          ...options,
        });

        return response.data;
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);

        if (attempt < this.config.maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  // Crawl Plugin Boutique (example)
  async crawlPluginBoutique(): Promise<PluginData[]> {
    console.log("Starting Plugin Boutique crawl...");

    try {
      // This is a simplified example - you'd need to adapt to their actual API
      const data = await this.makeRequest(
        "https://api.pluginboutique.com/plugins",
      );

      const plugins: PluginData[] =
        data.plugins?.map((plugin: any) => ({
          name: plugin.name,
          manufacturer: plugin.manufacturer,
          version: plugin.version,
          description: plugin.description,
          price: plugin.price,
          url: plugin.url,
          category: plugin.category,
          platform: plugin.platforms,
          source: "Plugin Boutique",
          crawledAt: new Date().toISOString(),
        })) || [];

      this.plugins.push(...plugins);
      console.log(`Crawled ${plugins.length} plugins from Plugin Boutique`);

      return plugins;
    } catch (error) {
      console.error("Failed to crawl Plugin Boutique:", error);
      return [];
    }
  }

  // Crawl KVR Audio (example)
  async crawlKVR(): Promise<PluginData[]> {
    console.log("Starting KVR Audio crawl...");

    try {
      // This would require parsing their HTML structure
      // You'd need to implement proper HTML parsing here
      const html = await this.makeRequest("https://www.kvraudio.com/plugins");

      // Parse HTML and extract plugin data
      // This is a placeholder - you'd need to implement actual parsing
      const plugins: PluginData[] = [];

      console.log(`Crawled ${plugins.length} plugins from KVR Audio`);
      this.plugins.push(...plugins);

      return plugins;
    } catch (error) {
      console.error("Failed to crawl KVR Audio:", error);
      return [];
    }
  }

  // Save crawled data to JSON file
  async saveToFile(): Promise<void> {
    try {
      const outputDir = join(this.config.outputPath, "..");
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const data = {
        metadata: {
          totalPlugins: this.plugins.length,
          sources: [...new Set(this.plugins.map((p) => p.source))],
          crawledAt: new Date().toISOString(),
        },
        plugins: this.plugins,
      };

      writeFileSync(this.config.outputPath, JSON.stringify(data, null, 2));
      console.log(
        `Saved ${this.plugins.length} plugins to ${this.config.outputPath}`,
      );
    } catch (error) {
      console.error("Failed to save crawled data:", error);
      throw error;
    }
  }

  // Main crawling method
  async crawlAll(): Promise<PluginData[]> {
    console.log("Starting comprehensive plugin database crawl...");

    // Add delay between different sources
    await this.crawlPluginBoutique();
    await this.delay(1000 / this.config.rateLimit);

    await this.crawlKVR();
    await this.delay(1000 / this.config.rateLimit);

    // Save results
    await this.saveToFile();

    console.log(`Crawl complete! Total plugins: ${this.plugins.length}`);
    return this.plugins;
  }

  // Get unique manufacturers
  getManufacturers(): string[] {
    return [...new Set(this.plugins.map((p) => p.manufacturer))].sort();
  }

  // Get plugins by manufacturer
  getPluginsByManufacturer(manufacturer: string): PluginData[] {
    return this.plugins.filter((p) => p.manufacturer === manufacturer);
  }

  // Search plugins
  searchPlugins(query: string): PluginData[] {
    const lowerQuery = query.toLowerCase();
    return this.plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.manufacturer.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery),
    );
  }
}
