import { shopifyApp } from '@shopify/shopify-app-express';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-01';
import { join } from 'path';

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(",") || [
      "write_products",
      "read_products",
      "read_price_rules",
      "write_price_rules",
      "read_discounts",
      "write_discounts",
      "read_themes",
      "write_themes",
      "read_script_tags",
      "write_script_tags"
    ],
    hostName: process.env.HOST?.replace(/https?:\/\//, ""),
    hostScheme: process.env.HOST?.split("://")[0] || "https",
    apiVersion: "2024-01",
    isEmbeddedApp: true,
    restResources,
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      httpRequests: process.env.NODE_ENV !== 'production',
    },
  },
  auth: {
    path: "/auth",
    callbackPath: "/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new SQLiteSessionStorage(join(process.cwd(), 'sessions.sqlite'))
});

export default shopify;
