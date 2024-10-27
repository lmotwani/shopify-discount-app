import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10"; // Updated to the latest version
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const DB_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/database/shopify.sqlite`
    : `${process.cwd()}/database.sqlite`;

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    hostName: process.env.SHOPIFY_HOST_NAME,
    billing: undefined, // or replace with billingConfig if you have billing set up
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
    scopes: [
      'write_products',
      'read_products',
      'read_price_rules',
      'write_price_rules',
      'read_discounts',
      'write_discounts',
      'read_themes',
      'write_themes',
      'read_script_tags',
      'write_script_tags'
    ],
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

export default shopify;

export const validateAuthenticatedSession = shopify.validateAuthenticatedSession();
