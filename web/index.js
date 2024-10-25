import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import { Shopify } from "@shopify/shopify-api";
import serveStatic from "serve-static";
import { setupDatabase } from "./database/index.js";
import discountRoutes from "./routes/discounts.js";
import compression from "compression";
import { logError, logAccess } from "./middleware/logging.js";

// Initialize database
await setupDatabase();

const PORT = parseInt(process.env.PORT || "3000", 10);
const STATIC_PATH = join(process.cwd(), "web/frontend/dist");

// Initialize Shopify
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES?.split(",") || [
    "write_products",
    "read_products",
    "read_price_rules",
    "write_price_rules",
    "read_discounts",
    "write_discounts"
  ],
  HOST_NAME: process.env.HOST?.replace(/https?:\/\//, ""),
  HOST_SCHEME: process.env.HOST?.split("://")[0] || "https",
  API_VERSION: "2023-10",
  IS_EMBEDDED_APP: true,
});

const app = express();

// Middleware
app.use(compression());
app.use(cookieParser(process.env.SHOPIFY_API_SECRET));
app.use(express.json());
app.use(logAccess);

// Debug endpoint
app.get("/debug", (_req, res) => {
  res.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HOST: process.env.HOST,
      PORT: process.env.PORT,
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "Set" : "Not Set",
      SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "Set" : "Not Set",
      SCOPES: process.env.SCOPES
    },
    paths: {
      static: STATIC_PATH,
      current: process.cwd()
    }
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use("/api/discounts", discountRoutes);

// Serve static files
app.use(serveStatic(STATIC_PATH, { index: false }));

// Serve frontend
app.get("*", async (req, res) => {
  try {
    const shop = req.query.shop;
    
    if (!shop) {
      res.redirect(`/auth?shop=${shop}`);
      return;
    }

    const session = await Shopify.Utils.loadCurrentSession(req, res);
    if (!session && !req.url.includes("/auth")) {
      res.redirect(`/auth?shop=${shop}`);
      return;
    }

    res.set("Content-Type", "text/html");
    res.send(readFileSync(join(STATIC_PATH, "index.html")));
  } catch (error) {
    logError(error, req);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Error handling
app.use((err, req, res, _next) => {
  logError(err, req);
  res.status(500).json({
    error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error"
  });
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
  logError(error);
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  logError(error);
  console.error("Unhandled Rejection:", error);
});
