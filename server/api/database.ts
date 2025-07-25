import sqlite3 from "sqlite3";
import path from "path";
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

// Database connection
const dbPath = path.join(process.cwd(), "data", "plugins.db");

// Singleton database instance
let dbInstance: sqlite3.Database | null = null;
let isInitialized = false;

export function getDatabase(): sqlite3.Database {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        console.error("Database path:", dbPath);
      } else {
        console.log("Connected to SQLite database at:", dbPath);
      }
    });
  }
  return dbInstance;
}

// Close database connection (useful for cleanup)
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
    });
    dbInstance = null;
    isInitialized = false;
  }
}

// Initialize database with schema
export async function initializeDatabase() {
  if (isInitialized) {
    return; // Already initialized
  }

  try {
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    await mkdir(dataDir, { recursive: true });

    // Create settings table if it doesn't exist
    await addSettingsTable();

    return new Promise<void>((resolve, reject) => {
      const db = getDatabase();

      db.serialize(() => {
        // Create plugins table if it doesn't exist
        db.run(
          `
          CREATE TABLE IF NOT EXISTS plugins (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            vendor TEXT,
            version TEXT,
            path TEXT NOT NULL,
            category TEXT,
            subCategories TEXT,
            isValid BOOLEAN DEFAULT 1,
            error TEXT,
            sdkVersion TEXT,
            cardinality INTEGER,
            flags INTEGER,
            cid TEXT,
            key TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating table:", err);
              reject(err);
            } else {
              console.log("Table created successfully");
              isInitialized = true;
              resolve();
            }
          },
        );
      });
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function testDatabaseConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    const db = getDatabase();
    db.get("SELECT 1 as test", (err, row) => {
      if (err) {
        console.error("Database connection test failed:", err);
        resolve(false);
      } else {
        console.log("Database connection test passed");
        resolve(true);
      }
    });
  });
}

// Sync plugins from JSON to database
export async function syncPluginsFromJson() {
  try {
    const jsonPath = path.join(process.cwd(), "data", "scanned-plugins.json");
    const jsonData = await readFile(jsonPath, "utf8");
    const data = JSON.parse(jsonData);

    if (!data.plugins || !Array.isArray(data.plugins)) {
      throw new Error("Invalid plugins data in JSON file");
    }

    const db = getDatabase();

    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        // Prepare statements for upsert operations
        const insertStmt = db.prepare(`
          INSERT INTO plugins (
            id, name, vendor, version, path, category, subCategories, 
            isValid, error, sdkVersion, cardinality, flags, cid, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        const updateStmt = db.prepare(`
          UPDATE plugins SET 
            name = ?, vendor = ?, version = ?, path = ?, category = ?, 
            subCategories = ?, isValid = ?, error = ?, sdkVersion = ?, 
            cardinality = ?, flags = ?, cid = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        const checkStmt = db.prepare("SELECT id FROM plugins WHERE id = ?");

        let processedCount = 0;
        let insertedCount = 0;
        let updatedCount = 0;

        const processNextPlugin = (index: number) => {
          if (index >= data.plugins.length) {
            // All plugins processed, finalize statements
            insertStmt.finalize((err1) => {
              if (err1) {
                reject(err1);
                return;
              }
              updateStmt.finalize((err2) => {
                if (err2) {
                  reject(err2);
                  return;
                }
                checkStmt.finalize((err3) => {
                  if (err3) {
                    reject(err3);
                    return;
                  }
                  console.log(`Sync completed: ${insertedCount} inserted, ${updatedCount} updated, ${processedCount} total`);
                  resolve();
                });
              });
            });
            return;
          }

          const plugin = data.plugins[index];
          const id = plugin.cid || plugin.path; // Use cid as primary key, fallback to path
          const subCategories = JSON.stringify(plugin.subCategories || []);

          // For invalid plugins without a name, extract name from path
          let pluginName = plugin.name;
          if (!pluginName && plugin.path) {
            const pathParts = plugin.path.split(/[\\\/]/);
            const fileName = pathParts[pathParts.length - 1];
            pluginName = fileName.replace(/\.vst3?$/i, "") || "Unknown Plugin";
          }

          // Check if plugin already exists
          checkStmt.get([id], (err, row) => {
            if (err) {
              reject(err);
              return;
            }

            if (row) {
              // Plugin exists - update it
              updateStmt.run([pluginName, plugin.vendor, plugin.version, plugin.path, plugin.category, subCategories, plugin.isValid ? 1 : 0, plugin.error || null, plugin.sdkVersion, plugin.cardinality, plugin.flags, plugin.cid, id], (updateErr) => {
                if (updateErr) {
                  reject(updateErr);
                  return;
                }
                updatedCount++;
                processedCount++;
                processNextPlugin(index + 1);
              });
            } else {
              // Plugin doesn't exist - insert it
              insertStmt.run([id, pluginName, plugin.vendor, plugin.version, plugin.path, plugin.category, subCategories, plugin.isValid ? 1 : 0, plugin.error || null, plugin.sdkVersion, plugin.cardinality, plugin.flags, plugin.cid], (insertErr) => {
                if (insertErr) {
                  reject(insertErr);
                  return;
                }
                insertedCount++;
                processedCount++;
                processNextPlugin(index + 1);
              });
            }
          });
        };

        // Start processing plugins
        processNextPlugin(0);
      });
    });
  } catch (error) {
    console.error("Error syncing plugins from JSON:", error);
    throw error;
  }
}

// Helper function to run queries with promises
export function runQuery(query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to run single queries (INSERT, UPDATE, DELETE)
export function runCommand(query: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Add settings table to existing database
export async function addSettingsTable() {
  return new Promise<void>((resolve, reject) => {
    const db = getDatabase();

    db.serialize(() => {
      const tables = [
        {
          name: "settings",
          sql: `
            CREATE TABLE IF NOT EXISTS settings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              key TEXT UNIQUE NOT NULL,
              value TEXT NOT NULL,
              description TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `,
        },
      ];

      let completed = 0;
      const total = tables.length;

      tables.forEach((table) => {
        db.run(table.sql, (err) => {
          if (err) {
            console.error(`Error creating ${table.name} table:`, err);
            reject(err);
          } else {
            console.log(`${table.name} table created successfully`);
            completed++;
            if (completed === total) {
              resolve();
            }
          }
        });
      });
    });
  });
}
