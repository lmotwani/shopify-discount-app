import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import { Shopify } from "@shopify/shopify-api";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import serveStatic from "serve-static";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_PATH = join(__dirname, "frontend/dist");
const PORT = parseInt(process.env.PORT || "3000", 10);

// Database setup
const sessionStorage = new SQLiteSessionStorage(join(__dirname, "database/sessions.sqlite"));

// Initialize Shopify
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES?.split(",") || ["write_products", "read_products"],
  HOST_NAME: process.env.HOST?.replace(/https?:\/\//, ""),
  HOST_SCHEME: process.env.HOST?.split("://")[0] || "https",
  API_VERSION: "2023-10",
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: sessionStorage,
});

const app = express();

// Middleware
app.use(cookieParser(process.env.SHOPIFY_API_SECRET));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// Auth endpoints
app.get("/auth", async (req, res) => {
  try {
    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      req.query.shop,
      "/auth/callback",
      false
    );
    res.redirect(authRoute);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: error.message });
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
    res.redirect(`/?shop=${shop}&host=${host}`);
  } catch (error) {
    console.error("Auth callback error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API routes
import discountRoutes from "./routes/discounts.js";
app.use("/api/discounts", discountRoutes);

// Serve static files
app.use(serveStatic(STATIC_PATH));

// Serve frontend
app.get("*", async (req, res) => {
  const shop = req.query.shop;
  
  try {
    if (!shop) {
      res.redirect(`/auth?shop=${shop}`);
      return;
    }

    const session = await Shopify.Utils.loadCurrentSession(req, res);
    if (!session && !req.url.includes("/auth")) {
      res.redirect(`/auth?shop=${shop}`);
      return;
    }

    const indexPath = join(STATIC_PATH, "index.html");
    if (indexPath) {
      res.set("Content-Type", "text/html");
      res.send(readFileSync(indexPath));
    } else {
      throw new Error("index.html not found");
    }
  } catch (error) {
    console.error("Error serving frontend:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files being served from: ${STATIC_PATH}`);
});
