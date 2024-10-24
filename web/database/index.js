import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbFile = process.env.SQLITE_PATH || `${__dirname}/shopify.sqlite3`;

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
        scope TEXT CHECK(scope IN ('all', 'collection', 'product')) NOT NULL,
        quantity INTEGER NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        product_id TEXT,
        collection_id TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_shop_domain ON discount_rules(shop_domain);
      CREATE INDEX IF NOT EXISTS idx_product_id ON discount_rules(product_id);
      CREATE INDEX IF NOT EXISTS idx_collection_id ON discount_rules(collection_id);
      CREATE INDEX IF NOT EXISTS idx_scope ON discount_rules(scope);

      CREATE TABLE IF NOT EXISTS product_collections (
        product_id TEXT NOT NULL,
        collection_id TEXT NOT NULL,
        shop_domain TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (product_id, collection_id, shop_domain)
      );

      CREATE INDEX IF NOT EXISTS idx_pc_shop ON product_collections(shop_domain);
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
