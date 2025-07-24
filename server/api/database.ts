import sqlite3 from "sqlite3";
import path from "path";
import { readFile } from "node:fs/promises";

// Database connection
const dbPath = path.join(process.cwd(), "data", "plugins.db");

export function getDatabase() {
  return new sqlite3.Database(dbPath);
}

// Initialize database with schema
export async function initializeDatabase() {
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
            db.close();
            reject(err);
          } else {
            // Run migration to rename manufacturer to vendor if needed
            migrateManufacturerToVendor(db)
              .then(() => {
                db.close();
                resolve();
              })
              .catch((migrationErr) => {
                db.close();
                reject(migrationErr);
              });
          }
        },
      );
    });
  });
}

// Migration function to rename manufacturer column to vendor
async function migrateManufacturerToVendor(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if manufacturer column exists
    db.get("PRAGMA table_info(plugins)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Get all column info
      db.all("PRAGMA table_info(plugins)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const hasManufacturer = columns.some((col: any) => col.name === "manufacturer");
        const hasVendor = columns.some((col: any) => col.name === "vendor");

        if (hasManufacturer && !hasVendor) {
          // Rename manufacturer to vendor
          db.run("ALTER TABLE plugins RENAME COLUMN manufacturer TO vendor", (err) => {
            if (err) {
              reject(err);
            } else {
              console.log("Successfully migrated manufacturer column to vendor");
              resolve();
            }
          });
        } else {
          // No migration needed
          resolve();
        }
      });
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
            const id = plugin.cid || plugin.path; // Use cid as primary key, fallback to path
            const subCategories = JSON.stringify(plugin.subCategories || []);

            stmt.run([id, plugin.name, plugin.vendor, plugin.version, plugin.path, plugin.category, subCategories, plugin.isValid ? 1 : 0, plugin.error || null, plugin.sdkVersion, plugin.cardinality, plugin.flags, plugin.cid]);
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
