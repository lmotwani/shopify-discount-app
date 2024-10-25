import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import { Shopify, ApiVersion } from "@shopify/shopify-api";
import serveStatic from "serve-static";
import { setupDatabase } from "./database/index.js";
import discountRoutes from "./routes/discounts.js";
import compression from "compression";
import { logError, logAccess } from "./middleware/logging.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const STATIC_PATH = join(process.cwd(), "web/frontend/dist");

// Initialize database
await setupDatabase();

// Initialize Shopify
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST } = process.env;
Shopify.Context.initialize({
  API_KEY: SHOPIFY_API_KEY,
  API_SECRET_KEY: SHOPIFY_API_SECRET,
  SCOPES: SCOPES?.split(",") || [
    "write_products",
    "read_products",
    "read_price_rules",
    "write_price_rules",
    "read_discounts",
    "write_discounts"
  ],
  HOST_NAME: HOST?.replace(/https?:\/\//, ""),
  HOST_SCHEME: HOST?.split("://")[0] || "https",
  API_VERSION: ApiVersion.October23,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

const app = express();

// Middleware
app.use(compression());
app.use(cookieParser(SHOPIFY_API_SECRET));
app.use(express.json());
app.use(logAccess);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// OAuth endpoints
app.get("/auth", async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) {
      res.status(400).send("Missing shop parameter");
      return;
    }

    // If we're not logged in, begin OAuth
    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      shop,
      "/auth/callback",
      false,
    );

    res.redirect(authRoute);
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("OAuth error");
  }
});

app.get("/auth/callback", async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query
    );

    const host = req.query.host;
    const shop = session.shop;

    // Redirect to app with shop parameter
    res.redirect(`/?shop=${shop}&host=${host}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("OAuth callback error");
  }
});

// Verify request is from Shopify
app.use(async (req, res, next) => {
  const shop = req.query.shop;
  
  if (Shopify.Context.IS_EMBEDDED_APP && shop) {
    res.setHeader(
      "Content-Security-Policy",
      `frame-ancestors https://${shop} https://admin.shopify.com;`
    );
  } else {
    res.setHeader("Content-Security-Policy", "frame-ancestors 'none';");
  }

  next();
});

// API routes - ensure authenticated
app.use("/api/*", async (req, res, next) => {
  const session = await Shopify.Utils.loadCurrentSession(req, res, true);
  if (!session?.shop) {
    res.status(401).send("Unauthorized");
    return;
  }
  next();
});

app.use("/api/discounts", discountRoutes);

// Serve static files
app.use(serveStatic(STATIC_PATH, { index: false }));

// Everything else goes to index.html
app.use("/*", async (req, res, next) => {
  const shop = req.query.shop;
  
  // Check if we need to redirect to OAuth
  if (shop) {
    const session = await Shopify.Utils.loadCurrentSession(req, res);
    if (!session) {
      res.redirect(`/auth?shop=${shop}`);
      return;
    }
  }

  res.set("Content-Type", "text/html");
  res.send(readFileSync(join(STATIC_PATH, "index.html")));
});

// Error handling
app.use((err, req, res, _next) => {
  console.error("App error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
}).on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
