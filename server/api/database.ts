import sqlite3 from "sqlite3";
import path from "path";
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

// Database connection
const dbPath = path.join(process.cwd(), "data", "plugins.db");

export function getDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      console.error("Database path:", dbPath);
    } else {
      console.log("Connected to SQLite database at:", dbPath);
    }
  });
  return db;
}

// Initialize database with schema
export async function initializeDatabase() {
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
              db.close();
              reject(err);
            } else {
              console.log("Table created successfully");
              db.close();
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
      db.close();
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
    const jsonPath = path.join(process.cwd(), "public", "scanned-plugins.json");
    const jsonData = await readFile(jsonPath, "utf8");
    const data = JSON.parse(jsonData);

    if (!data.plugins || !Array.isArray(data.plugins)) {
      throw new Error("Invalid plugins data in JSON file");
    }

    const db = getDatabase();

    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        // Clear existing plugins
        db.run("DELETE FROM plugins", (err) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }

          // Insert plugins from JSON
          const stmt = db.prepare(`
            INSERT INTO plugins (
              id, name, vendor, version, path, category, subCategories, 
              isValid, error, sdkVersion, cardinality, flags, cid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          data.plugins.forEach((plugin: any) => {
            // Include all plugins, including invalid ones
            const id = plugin.cid || plugin.path; // Use cid as primary key, fallback to path
            const subCategories = JSON.stringify(plugin.subCategories || []);

            // For invalid plugins without a name, extract name from path
            let pluginName = plugin.name;
            if (!pluginName && plugin.path) {
              const pathParts = plugin.path.split(/[\\\/]/);
              const fileName = pathParts[pathParts.length - 1];
              pluginName = fileName.replace(/\.vst3?$/i, "") || "Unknown Plugin";
            }

            stmt.run([id, pluginName, plugin.vendor, plugin.version, plugin.path, plugin.category, subCategories, plugin.isValid ? 1 : 0, plugin.error || null, plugin.sdkVersion, plugin.cardinality, plugin.flags, plugin.cid]);
          });

          stmt.finalize((err) => {
            db.close();
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
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
      db.close();
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
      db.close();
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
            db.close();
            reject(err);
          } else {
            console.log(`${table.name} table created successfully`);
            completed++;
            if (completed === total) {
              db.close();
              resolve();
            }
          }
        });
      });
    });
  });
}
