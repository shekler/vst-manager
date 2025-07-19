import sqlite3 from "sqlite3";
import { join } from "path";
import { readFileSync, existsSync, mkdirSync, statSync } from "fs";

interface Plugin {
  id: string;
  name: string;
  path: string;
  manufacturer: string;
  url: string;
  image: string;
  version: string;
  categories: string[];
  key: string;
  date_scanned: string;
  last_updated: string;
  sdkVersion: string;
}

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

class DatabaseService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Store database in the data directory
    this.dbPath = join(process.cwd(), "data", "plugins.db");
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.db) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization with retry
    this.initializationPromise = this._initializeWithRetry();
    return this.initializationPromise;
  }

  private async _initializeWithRetry(maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this._initialize();
        return;
      } catch (error) {
        console.error(`Database initialization attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private async _initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure data directory exists
        const dataDir = join(process.cwd(), "data");
        if (!existsSync(dataDir)) {
          mkdirSync(dataDir, { recursive: true });
        }

        // Check if database file exists and is accessible
        if (existsSync(this.dbPath)) {
          try {
            const stats = statSync(this.dbPath);
          } catch (statError) {
            console.error("Error getting database file stats:", statError);
          }
        }

        // Try to open database with different flags
        const openFlags = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

        this.db = new sqlite3.Database(this.dbPath, openFlags, (err) => {
          if (err) {
            console.error("Failed to open database:", err);
            console.error("Database error details:", err.message);
            this.initializationPromise = null;
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
                  categories TEXT,
                  key TEXT,
                  date_scanned TEXT,
                  last_updated TEXT,
                  sdk_version TEXT,
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

              // Add sdk_version column if it doesn't exist (migration)
              this.db!.exec(`ALTER TABLE plugins ADD COLUMN sdk_version TEXT;`, (err) => {
                // Ignore error if column already exists
                if (err && !err.message.includes("duplicate column name")) {
                  console.log("sdk_version column already exists or error:", err.message);
                }
              });

              // Add categories column if it doesn't exist (migration)
              this.db!.exec(`ALTER TABLE plugins ADD COLUMN categories TEXT;`, (err) => {
                // Ignore error if column already exists
                if (err && !err.message.includes("duplicate column name")) {
                  console.log("categories column already exists or error:", err.message);
                } else {
                  // Migrate existing type data to categories
                  this.db!.exec(`UPDATE plugins SET categories = '["' || type || '"]' WHERE categories IS NULL AND type IS NOT NULL;`, (err) => {
                    if (err) {
                      console.log("Error migrating type to categories:", err.message);
                    } else {
                      console.log("Successfully migrated type to categories");
                    }
                  });
                }
              });

              // Create settings table if it doesn't exist
              this.db!.exec(
                `
                CREATE TABLE IF NOT EXISTS settings (
                  id TEXT PRIMARY KEY,
                  key TEXT UNIQUE NOT NULL,
                  value TEXT,
                  description TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `,
                (err) => {
                  if (err) {
                    console.error("Failed to create settings table:", err);
                    reject(err);
                    return;
                  }

                  // Create indexes for better performance
                  this.db!.exec(
                    `
                    CREATE INDEX IF NOT EXISTS idx_plugins_name ON plugins(name);
                    CREATE INDEX IF NOT EXISTS idx_plugins_manufacturer ON plugins(manufacturer);
                    CREATE INDEX IF NOT EXISTS idx_plugins_type ON plugins(type);
                    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
                  `,
                    (err) => {
                      if (err) {
                        console.error("Failed to create indexes:", err);
                        reject(err);
                        return;
                      }

                      // Initialize default settings
                      this.initializeDefaultSettings()
                        .then(() => {
                          this.initializationPromise = null;
                          resolve();
                        })
                        .catch((error) => {
                          console.error("Failed to initialize default settings:", error);
                          this.initializationPromise = null;
                          reject(error);
                        });
                    },
                  );
                },
              );
            },
          );
        });
      } catch (error) {
        console.error("Failed to initialize database:", error);
        this.initializationPromise = null;
        reject(error);
      }
    });
  }

  private async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        id: "vst_paths",
        key: "vst_paths",
        value: "C:\\Program Files\\VSTPlugins,C:\\Program Files (x86)\\VSTPlugins",
        description: "Comma-separated list of VST plugin directories to scan",
      },
      {
        id: "vst3_paths",
        key: "vst3_paths",
        value: "C:\\Program Files\\Common Files\\VST3,C:\\Program Files (x86)\\Common Files\\VST3",
        description: "Comma-separated list of VST3 plugin directories to scan",
      },
    ];

    for (const setting of defaultSettings) {
      try {
        await this.runQuery("INSERT OR IGNORE INTO settings (id, key, value, description) VALUES (?, ?, ?, ?)", [setting.id, setting.key, setting.value, setting.description]);
      } catch (error) {
        console.error(`Failed to initialize setting ${setting.key}:`, error);
      }
    }
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
      const plugins: Plugin[] = scannedPlugins
        .filter((scannedPlugin: any) => scannedPlugin.isValid === true) // Only include valid plugins
        .map((scannedPlugin: any) => {
          const currentDate = new Date().toISOString().split("T")[0];
          return {
            id: scannedPlugin.cid || Date.now().toString(),
            name: scannedPlugin.name || "",
            path: scannedPlugin.path || "",
            manufacturer: scannedPlugin.vendor || "",
            url: "", // Will be empty as it's not in scanned data
            image: "", // Will be empty as it's not in scanned data
            version: scannedPlugin.version || "",
            sdkVersion: scannedPlugin.sdkVersion || "",
            categories: JSON.stringify(scannedPlugin.subCategories || [scannedPlugin.category || "Unknown"]),
            key: "", // Will be empty as it's not in scanned data
            date_scanned: currentDate,
            last_updated: currentDate,
          };
        });

      // Insert plugins in batches
      const batchSize = 100;
      for (let i = 0; i < plugins.length; i += batchSize) {
        const batch = plugins.slice(i, i + batchSize);

        const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const values = batch.flatMap((plugin) => [plugin.id, plugin.name, plugin.path, plugin.manufacturer, plugin.url, plugin.image, plugin.version, plugin.categories, plugin.key, plugin.date_scanned, plugin.last_updated, plugin.sdkVersion]);

        await this.runQuery(
          `
          INSERT INTO plugins (id, name, path, manufacturer, url, image, version, categories, key, date_scanned, last_updated, sdk_version)
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
      const plugins = await this.allQuery("SELECT * FROM plugins ORDER BY name");

      // Map database column names to interface property names
      const mappedPlugins = plugins.map((plugin: any) => {
        try {
          return {
            ...plugin,
            sdkVersion: plugin.sdk_version,
            categories: plugin.categories ? JSON.parse(plugin.categories) : [],
          } as Plugin;
        } catch (parseError) {
          console.error(`Error parsing plugin ${plugin.id}:`, parseError);
          // Return plugin with empty categories if parsing fails
          return {
            ...plugin,
            sdkVersion: plugin.sdk_version,
            categories: [],
          } as Plugin;
        }
      });

      return mappedPlugins;
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
      const plugin = await this.getQuery("SELECT * FROM plugins WHERE id = ?", [id]);
      if (!plugin) return null;

      // Map database column names to interface property names
      return {
        ...plugin,
        sdkVersion: plugin.sdk_version,
        categories: plugin.categories ? JSON.parse(plugin.categories) : [],
      } as Plugin;
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
        WHERE name LIKE ? OR manufacturer LIKE ? OR categories LIKE ?
        ORDER BY name
      `,
        [`%${query}%`, `%${query}%`, `%${query}%`],
      );

      // Map database column names to interface property names
      return plugins.map((plugin: any) => ({
        ...plugin,
        sdkVersion: plugin.sdk_version,
        categories: plugin.categories ? JSON.parse(plugin.categories) : [],
      })) as Plugin[];
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
        INSERT INTO plugins (id, name, path, manufacturer, url, image, version, categories, key, date_scanned, last_updated, sdk_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [id, plugin.name, plugin.path, plugin.manufacturer, plugin.url, plugin.image, plugin.version, JSON.stringify(plugin.categories), plugin.key, plugin.date_scanned, plugin.last_updated, plugin.sdkVersion],
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
      const setClause = fields
        .map((field) => {
          // Map camelCase field names to database column names
          const columnMap: Record<string, string> = {
            sdkVersion: "sdk_version",
          };
          const columnName = columnMap[field] || field;
          return `${columnName} = ?`;
        })
        .join(", ");

      const values = fields.map((field) => {
        const value = plugin[field as keyof Plugin];
        // Convert categories array to JSON string
        if (field === "categories" && Array.isArray(value)) {
          return JSON.stringify(value);
        }
        return value;
      });

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

  async deleteAllPlugins(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      await this.runQuery("DELETE FROM plugins");
    } catch (error) {
      console.error("Failed to delete all plugins:", error);
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
      const total = await this.getQuery("SELECT COUNT(*) as count FROM plugins");
      const byType = await this.allQuery("SELECT categories, COUNT(*) as count FROM plugins GROUP BY categories");
      const byManufacturer = await this.allQuery("SELECT manufacturer, COUNT(*) as count FROM plugins GROUP BY manufacturer");

      return {
        total: (total as any)?.count || 0,
        byType: Object.fromEntries((byType as any[]).map((row: any) => [row.categories, row.count])),
        byManufacturer: Object.fromEntries((byManufacturer as any[]).map((row: any) => [row.manufacturer, row.count])),
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<Setting | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const setting = await this.getQuery("SELECT * FROM settings WHERE key = ?", [key]);
      return setting as Setting | null;
    } catch (error) {
      console.error("Failed to get setting:", error);
      throw error;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const settings = await this.allQuery("SELECT * FROM settings ORDER BY key");
      return settings as Setting[];
    } catch (error) {
      console.error("Failed to get all settings:", error);
      throw error;
    }
  }

  async updateSetting(key: string, value: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      await this.runQuery("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", [value, key]);
    } catch (error) {
      console.error("Failed to update setting:", error);
      throw error;
    }
  }

  async addSetting(setting: Omit<Setting, "id">): Promise<string> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const id = Date.now().toString();
      await this.runQuery("INSERT INTO settings (id, key, value, description) VALUES (?, ?, ?, ?)", [id, setting.key, setting.value, setting.description]);
      return id;
    } catch (error) {
      console.error("Failed to add setting:", error);
      throw error;
    }
  }

  async deleteSetting(key: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      await this.runQuery("DELETE FROM settings WHERE key = ?", [key]);
    } catch (error) {
      console.error("Failed to delete setting:", error);
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
            this.initializationPromise = null;
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
