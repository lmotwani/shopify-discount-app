import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbFile = join(__dirname, 'shopify.sqlite3');

let db;

export async function setupDatabase() {
  if (!db) {
    db = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS discount_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_domain TEXT NOT NULL,
        type TEXT CHECK(type IN ('percentage', 'fixed')) NOT NULL,
        quantity INTEGER NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        product_id TEXT,
        collection_id TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_shop_domain ON discount_rules(shop_domain);
      CREATE INDEX IF NOT EXISTS idx_product ON discount_rules(product_id);
      CREATE INDEX IF NOT EXISTS idx_collection ON discount_rules(collection_id);
    `);
  }
  return db;
}

export async function getDatabase() {
  if (!db) {
    await setupDatabase();
  }
  return db;
}
