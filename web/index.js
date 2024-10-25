import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import { setupDatabase } from "./database/index.js";
import discountRoutes from "./routes/discounts.js";
import compression from "compression";
import { logError, logAccess } from "./middleware/logging.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH = join(process.cwd(), "web/frontend/dist");

// Initialize database
await setupDatabase();

const app = express();

// Set up middleware
app.use(compression());
app.use(shopify.validateAuthenticatedSession());
app.use(express.json());
app.use(logAccess);

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

// API routes
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
