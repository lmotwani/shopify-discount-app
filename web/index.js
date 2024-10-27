import dotenv from "dotenv";
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import discountRoutes from "./routes/discounts.js";
import { setupDatabase } from "./database/index.js";
import { logError, logAccess } from "./middleware/logging.js";
import cors from 'cors';

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "8081", 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? join(process.cwd(), "frontend", "dist")
    : join(process.cwd(), "frontend");

// Initialize database
await setupDatabase();

const app = express();

// Set up middleware
app.use(express.json());
app.use(logAccess);

// Allow all origins for testing purposes
app.use(cors({
  origin: '*', // Allow all origins (for testing only)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Access-Token']
}));

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res) => {
    if (req.query.host && req.query.shop) {
      if (await shopify.config.sessionStorage.findSessionsByShop(req.query.shop) && shopify.config.isEmbeddedApp) {
        return shopify.redirectToShopifyOrAppRoot({
          req,
          res
        });
      } else {
        res.redirect(`/?shop=${req.query.shop}&host=${encodeURIComponent(req.query.host)}`);
      }
    } else {
      return res.status(400).send('Missing shop or host query parameter');
    }
  }
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
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

// Error handling
app.use((err, req, res, next) => {
  console.error("App error:", err.stack); // Include stack trace
  logError(err, req);
  res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" }); // More informative error message
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
