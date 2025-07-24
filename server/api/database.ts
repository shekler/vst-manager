import sqlite3 from "sqlite3";
import path from "path";

// Database connection
const dbPath = path.join(process.cwd(), "data", "plugins.db");

export function getDatabase() {
  return new sqlite3.Database(dbPath);
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
