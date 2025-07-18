import sqlite3 from "sqlite3";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

interface Plugin {
  id: string;
  name: string;
  path: string;
  manufacturer: string;
  url: string;
  image: string;
  version: string;
  type: string;
  key: string;
  date_scanned: string;
  last_updated: string;
}

class DatabaseService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // Store database in the data directory
    this.dbPath = join(process.cwd(), "data", "plugins.db");
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error("Failed to open database:", err);
            reject(err);
            return;
          }

          // Create plugins table if it doesn't exist
          this.db!.exec(
            `
            CREATE TABLE IF NOT EXISTS plugins (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              path TEXT NOT NULL,
              manufacturer TEXT,
              url TEXT,
              image TEXT,
              version TEXT,
              type TEXT,
              key TEXT,
              date_scanned TEXT,
              last_updated TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `,
            (err) => {
              if (err) {
                console.error("Failed to create plugins table:", err);
                reject(err);
                return;
              }

              // Create indexes for better performance
              this.db!.exec(
                `
                CREATE INDEX IF NOT EXISTS idx_plugins_name ON plugins(name);
                CREATE INDEX IF NOT EXISTS idx_plugins_manufacturer ON plugins(manufacturer);
                CREATE INDEX IF NOT EXISTS idx_plugins_type ON plugins(type);
              `,
                (err) => {
                  if (err) {
                    console.error("Failed to create indexes:", err);
                    reject(err);
                    return;
                  }

                  console.log("Database initialized successfully");
                  resolve();
                },
              );
            },
          );
        });
      } catch (error) {
        console.error("Failed to initialize database:", error);
        reject(error);
      }
    });
  }

  async importFromJson(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const jsonPath = join(process.cwd(), "data", "scanned-plugins.json");

      if (!existsSync(jsonPath)) {
        console.log("No existing JSON file found to import");
        return;
      }

      const jsonData = JSON.parse(readFileSync(jsonPath, "utf8"));
      const scannedPlugins = jsonData.plugins || [];

      if (scannedPlugins.length === 0) {
        console.log("No plugins found in JSON file");
        return;
      }

      // Clear existing data
      await this.runQuery("DELETE FROM plugins");

      // Transform scanned plugins to database format
      const plugins: Plugin[] = scannedPlugins.map((scannedPlugin: any) => {
        const currentDate = new Date().toISOString().split("T")[0];
        return {
          id: scannedPlugin.cid || Date.now().toString(),
          name: scannedPlugin.name || "",
          path: scannedPlugin.path || "",
          manufacturer: scannedPlugin.vendor || "",
          url: "", // Will be empty as it's not in scanned data
          image: "", // Will be empty as it's not in scanned data
          version: scannedPlugin.version || "",
          type:
            scannedPlugin.category ||
            scannedPlugin.subCategories?.[0] ||
            "Unknown",
          key: "", // Will be empty as it's not in scanned data
          date_scanned: currentDate,
          last_updated: currentDate,
        };
      });

      // Insert plugins in batches
      const batchSize = 100;
      for (let i = 0; i < plugins.length; i += batchSize) {
        const batch = plugins.slice(i, i + batchSize);

        const placeholders = batch
          .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .join(", ");
        const values = batch.flatMap((plugin) => [
          plugin.id,
          plugin.name,
          plugin.path,
          plugin.manufacturer,
          plugin.url,
          plugin.image,
          plugin.version,
          plugin.type,
          plugin.key,
          plugin.date_scanned,
          plugin.last_updated,
        ]);

        await this.runQuery(
          `
          INSERT INTO plugins (id, name, path, manufacturer, url, image, version, type, key, date_scanned, last_updated)
          VALUES ${placeholders}
        `,
          values,
        );
      }

      console.log(`Imported ${plugins.length} plugins from JSON`);
    } catch (error) {
      console.error("Failed to import from JSON:", error);
      throw error;
    }
  }

  async getAllPlugins(): Promise<Plugin[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const plugins = await this.allQuery(
        "SELECT * FROM plugins ORDER BY name",
      );
      return plugins as Plugin[];
    } catch (error) {
      console.error("Failed to get plugins:", error);
      throw error;
    }
  }

  async getPluginById(id: string): Promise<Plugin | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const plugin = await this.getQuery("SELECT * FROM plugins WHERE id = ?", [
        id,
      ]);
      return plugin as Plugin | null;
    } catch (error) {
      console.error("Failed to get plugin by ID:", error);
      throw error;
    }
  }

  async searchPlugins(query: string): Promise<Plugin[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const plugins = await this.allQuery(
        `
        SELECT * FROM plugins 
        WHERE name LIKE ? OR manufacturer LIKE ? OR type LIKE ?
        ORDER BY name
      `,
        [`%${query}%`, `%${query}%`, `%${query}%`],
      );

      return plugins as Plugin[];
    } catch (error) {
      console.error("Failed to search plugins:", error);
      throw error;
    }
  }

  async addPlugin(plugin: Omit<Plugin, "id">): Promise<string> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const id = Date.now().toString();
      await this.runQuery(
        `
        INSERT INTO plugins (id, name, path, manufacturer, url, image, version, type, key, date_scanned, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          plugin.name,
          plugin.path,
          plugin.manufacturer,
          plugin.url,
          plugin.image,
          plugin.version,
          plugin.type,
          plugin.key,
          plugin.date_scanned,
          plugin.last_updated,
        ],
      );

      return id;
    } catch (error) {
      console.error("Failed to add plugin:", error);
      throw error;
    }
  }

  async updatePlugin(id: string, plugin: Partial<Plugin>): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const fields = Object.keys(plugin).filter((key) => key !== "id");
      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => plugin[field as keyof Plugin]);

      await this.runQuery(
        `
        UPDATE plugins 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [...values, id],
      );
    } catch (error) {
      console.error("Failed to update plugin:", error);
      throw error;
    }
  }

  async deletePlugin(id: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      await this.runQuery("DELETE FROM plugins WHERE id = ?", [id]);
    } catch (error) {
      console.error("Failed to delete plugin:", error);
      throw error;
    }
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byManufacturer: Record<string, number>;
  }> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const total = await this.getQuery(
        "SELECT COUNT(*) as count FROM plugins",
      );
      const byType = await this.allQuery(
        "SELECT type, COUNT(*) as count FROM plugins GROUP BY type",
      );
      const byManufacturer = await this.allQuery(
        "SELECT manufacturer, COUNT(*) as count FROM plugins GROUP BY manufacturer",
      );

      return {
        total: (total as any)?.count || 0,
        byType: Object.fromEntries(
          (byType as any[]).map((row: any) => [row.type, row.count]),
        ),
        byManufacturer: Object.fromEntries(
          (byManufacturer as any[]).map((row: any) => [
            row.manufacturer,
            row.count,
          ]),
        ),
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      throw error;
    }
  }

  // Helper methods to wrap sqlite3 callbacks in promises
  private runQuery(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  private allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Create a singleton instance
const dbService = new DatabaseService();

export default dbService;
