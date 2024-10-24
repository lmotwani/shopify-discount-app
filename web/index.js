import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import { Shopify, LATEST_API_VERSION } from "@shopify/shopify-api";
import applyAuthMiddleware from "./middleware/auth.js";
import { setupDatabase } from "./database/index.js";
import { discountRoutes } from "./routes/discounts.js";
import { requestLogger, errorLogger } from "./middleware/logging.js";

const PORT = parseInt(process.env.PORT || "8081", 10);
const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;

// Initialize SQLite database
setupDatabase();

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// Set up app middleware
app.use(cookieParser(process.env.SHOPIFY_API_SECRET));
app.use(requestLogger);

// Set up API endpoints
app.use("/api/discounts", discountRoutes);

// Set up error handling
app.use(errorLogger);

// Set up static file serving for frontend
const STATIC_PATH = join(process.cwd(), "frontend/dist");
app.use(express.static(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
