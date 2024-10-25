import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbFile = join(__dirname, 'shopify.sqlite3');
const dbDir = dirname(dbFile);

// Ensure database directory exists with proper permissions
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true, mode: 0o777 });
}

let db;

export async function setupDatabase() {
  if (!db) {
    try {
      // Ensure database file has proper permissions
      if (fs.existsSync(dbFile)) {
        fs.chmodSync(dbFile, 0o777);
      }

      db = await open({
        filename: dbFile,
        driver: sqlite3.Database
      });

      // Create tables if they don't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS discount_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_domain TEXT NOT NULL,
          type TEXT CHECK(type IN ('percentage', 'fixed')) NOT NULL,
          quantity INTEGER NOT NULL,
          value DECIMAL(10,2) NOT NULL,
          scope TEXT CHECK(scope IN ('all', 'products', 'collections')) NOT NULL,
          product_ids TEXT,
          collection_ids TEXT,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_shop_domain ON discount_rules(shop_domain);
        CREATE INDEX IF NOT EXISTS idx_scope ON discount_rules(scope);
        CREATE INDEX IF NOT EXISTS idx_active ON discount_rules(active);

        CREATE TABLE IF NOT EXISTS product_collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT NOT NULL,
          collection_id TEXT NOT NULL,
          shop_domain TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(product_id, collection_id, shop_domain)
        );

        CREATE INDEX IF NOT EXISTS idx_product_collections_product ON product_collections(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_collections_collection ON product_collections(collection_id);
      `);

      // Set busy timeout to handle concurrent access
      await db.run('PRAGMA busy_timeout = 6000');
      await db.run('PRAGMA journal_mode = WAL');
      await db.run('PRAGMA foreign_keys = ON');
    } catch (error) {
      console.error('Database setup error:', error);
      throw error;
    }
  }
  return db;
}

export async function getDatabase() {
  if (!db) {
    await setupDatabase();
  }
  return db;
}

// Handle cleanup on process exit
process.on('SIGINT', async () => {
  if (db) {
    try {
      await db.close();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
  process.exit(0);
});
