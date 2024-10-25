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
    "write_price_rules"
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
app.get("/debug", (req, res) => {
  res.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HOST: process.env.HOST,
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "Set" : "Not Set",
      SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "Set" : "Not Set",
      SCOPES: process.env.SCOPES
    },
    staticPath: {
      path: STATIC_PATH,
      exists: require('fs').existsSync(STATIC_PATH),
      files: require('fs').existsSync(STATIC_PATH) ? 
        require('fs').readdirSync(STATIC_PATH) : []
    }
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// Auth endpoints
app.get("/auth", async (req, res) => {
  try {
    logAccess(req, res, () => {});
    console.log("Auth request:", {
      shop: req.query.shop,
      host: req.query.host,
      headers: req.headers
    });

    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      req.query.shop,
      "/auth/callback",
      false
    );
    console.log("Auth route:", authRoute);
    res.redirect(authRoute);
  } catch (error) {
    logError(error, req);
    res.status(500).json({ error: error.message });
  }
});

app.get("/auth/callback", async (req, res) => {
  try {
    logAccess(req, res, () => {});
    console.log("Auth callback request:", {
      query: req.query,
      headers: req.headers
    });

    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query
    );
    console.log("Auth session:", session);

    const host = req.query.host;
    const shop = session.shop;
    res.redirect(`/?shop=${shop}&host=${host}`);
  } catch (error) {
    logError(error, req);
    res.status(500).json({ error: error.message });
  }
});

// CORS and security headers
app.use((_req, res, next) => {
  res.set("Access-Control-Allow-Origin", process.env.HOST);
  res.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("X-XSS-Protection", "1; mode=block");
  next();
});

// API routes
app.use("/api/discounts", discountRoutes);

// Serve static files
app.use(serveStatic(STATIC_PATH, { index: false }));

// Serve frontend
app.get("*", async (req, res) => {
  try {
    logAccess(req, res, () => {});
    const shop = req.query.shop;
    
    console.log("Frontend request:", {
      url: req.url,
      shop,
      headers: req.headers
    });

    if (!shop) {
      console.log("No shop parameter, redirecting to auth");
      res.redirect(`/auth?shop=${shop}`);
      return;
    }

    const session = await Shopify.Utils.loadCurrentSession(req, res);
    console.log("Session status:", {
      exists: !!session,
      shop: session?.shop,
      isAuthenticated: session?.isAuthenticated
    });

    if (!session && !req.url.includes("/auth")) {
      console.log("No session, redirecting to auth");
      res.redirect(`/auth?shop=${shop}`);
      return;
    }

    const indexPath = join(STATIC_PATH, "index.html");
    console.log("Serving index from:", indexPath);

    if (!require('fs').existsSync(indexPath)) {
      throw new Error(`index.html not found at ${indexPath}`);
    }

    res.set("Content-Type", "text/html");
    res.send(readFileSync(indexPath));
  } catch (error) {
    logError(error, req);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files being served from: ${STATIC_PATH}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST
  });
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
