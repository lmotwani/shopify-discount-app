import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Shopify, ApiVersion } from '@shopify/shopify-api';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import serveStatic from 'serve-static';

const PORT = parseInt(process.env.PORT || '3000', 10);
const STATIC_PATH = join(process.cwd(), 'frontend/dist');

// Initialize SQLite session storage
const sessionStorage = new SQLiteSessionStorage(join(process.cwd(), 'database/sessions.sqlite'));

// Initialize Shopify
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES?.split(',') || ['write_products', 'read_products'],
  HOST_NAME: process.env.HOST?.replace(/https?:\/\//, ''),
  HOST_SCHEME: process.env.HOST?.split('://')[0] || 'https',
  API_VERSION: ApiVersion.October23,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: sessionStorage,
});

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser(process.env.SHOPIFY_API_SECRET));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.get('/auth', async (req, res) => {
  try {
    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      req.query.shop,
      '/auth/callback',
      false
    );
    res.redirect(authRoute);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/auth/callback', async (req, res) => {
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
    console.error('Auth callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Shopify requests
app.use(async (req, res, next) => {
  const shop = req.query.shop;
  if (Shopify.Context.IS_EMBEDDED_APP && shop) {
    res.setHeader(
      'Content-Security-Policy',
      `frame-ancestors https://${shop} https://admin.shopify.com;`
    );
  }
  next();
});

// API routes
import discountRoutes from './routes/discounts.js';
app.use('/api/discounts', discountRoutes);

// Serve static files
app.use(serveStatic(STATIC_PATH, { index: false }));

// Serve frontend for all other routes
app.get('*', async (req, res) => {
  const shop = req.query.shop;
  
  if (!shop) {
    res.redirect(`/auth?shop=${shop}`);
    return;
  }

  try {
    const session = await Shopify.Utils.loadCurrentSession(req, res);
    if (!session && !req.url.includes('/auth')) {
      res.redirect(`/auth?shop=${shop}`);
      return;
    }
  } catch (error) {
    console.error('Session error:', error);
  }

  res.set('Content-Type', 'text/html');
  res.send(readFileSync(join(STATIC_PATH, 'index.html')));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('App error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files being served from: ${STATIC_PATH}`);
});
