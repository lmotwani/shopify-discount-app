import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import { shopifyApp } from '@shopify/shopify-app-express';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-01';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import serveStatic from "serve-static";
import { setupDatabase } from "./database/index.js";
import discountRoutes from "./routes/discounts.js";
import compression from "compression";
import { logError, logAccess } from "./middleware/logging.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const STATIC_PATH = join(process.cwd(), "web/frontend/dist");

// Initialize database
await setupDatabase();

// Set up Shopify authentication
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
    restResources
  },
  auth: {
    path: "/auth",
    callbackPath: "/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
    handlers: {
      "APP_UNINSTALLED": {
        deliveryMethod: "http",
        callback: async (topic, shop, body) => {
          console.log("App uninstalled from shop:", shop);
          // Clean up shop data
          try {
            await db.run('DELETE FROM discount_rules WHERE shop_domain = ?', [shop]);
          } catch (err) {
            console.error('Error cleaning up shop data:', err);
          }
        },
      },
    },
  },
  sessionStorage: new SQLiteSessionStorage(join(process.cwd(), 'sessions.sqlite'))
});

// Create express app
const app = express();

// Set up middleware
app.use(compression());
app.use(cookieParser(process.env.SHOPIFY_API_SECRET));
app.use(express.json());
app.use(logAccess);

// Set security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Set up Shopify auth
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// Set up webhooks
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: shopify.config.webhooks.handlers })
);

// API routes - ensure authenticated
app.use("/api/*", shopify.validateAuthenticatedSession());
app.use("/api/discounts", discountRoutes);

// Serve static files
app.use(serveStatic(STATIC_PATH, { index: false }));

// Everything else goes to index.html
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  res.set("Content-Type", "text/html");
  res.send(readFileSync(join(STATIC_PATH, "index.html")));
});

// Error handling
app.use((err, req, res, _next) => {
  console.error("App error:", err);
  logError(err, req);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`Static files being served from: ${STATIC_PATH}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST
  });
}).on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  logError(error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  logError(error);
});
