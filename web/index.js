import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import discountRoutes from "./routes/discounts.js";
import { setupDatabase } from "./database/index.js";
import { logError, logAccess } from "./middleware/logging.js";
import cors from 'cors';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "8081", 10);
const STATIC_PATH = process.env.NODE_ENV === "production" ? `${process.cwd()}/frontend/dist` : `${process.cwd()}/frontend/`;

// Initialize database
await setupDatabase();

const app = express();

// Set up middleware
app.use(express.json());
app.use(logAccess);

// Add CORS middleware
app.use(cors({
  origin: process.env.SHOPIFY_APP_URL || 'https://localhost:3000',
  credentials: true
}));

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// All endpoints after this point will require an active session
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use("/api/discounts", discountRoutes);

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

// Error handling
app.use((err, req, res, next) => {
  console.error("App error:", err);
  logError(err, req);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
