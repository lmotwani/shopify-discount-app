import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Shopify, ApiVersion } from '@shopify/shopify-api';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;

// Initialize SQLite session storage
const sessionStorage = new SQLiteSessionStorage(`${process.cwd()}/web/database/sessions.sqlite`);

// Initialize Shopify
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES?.split(',') || ['write_products', 'read_products'],
  HOST_NAME: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
  HOST_SCHEME: process.env.HOST?.split('://')[0] || 'http',
  API_VERSION: ApiVersion.October23,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: sessionStorage,
});

const STATIC_PATH = `${process.cwd()}/frontend/dist`;

const app = express();
app.use(cookieParser(process.env.SHOPIFY_API_SECRET));

// Set up Shopify authentication and webhook handling
app.get(Shopify.Context.AUTH_PATH, async (req, res, next) => {
  try {
    await Shopify.Auth.begin({
      shop: req.query.shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send(error.message);
  }
});

app.get('/auth/callback', async (req, res, next) => {
  try {
    const session = await Shopify.Auth.callback({
      rawRequest: req,
      rawResponse: res,
      isOnline: false,
    });

    // Redirect to app with shop parameter
    const shop = session.shop;
    const host = req.query.host;
    const redirectUrl = `/?shop=${shop}&host=${host}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send(error.message);
  }
});

// Verify requests are from Shopify
app.use(async (req, res, next) => {
  const shop = req.query.shop;
  if (Shopify.Context.IS_EMBEDDED_APP && shop) {
    res.setHeader(
      'Content-Security-Policy',
      `frame-ancestors https://${shop} https://admin.shopify.com;`
    );
  } else {
    res.setHeader('Content-Security-Policy', 'frame-ancestors none;');
  }
  next();
});

// Handle webhooks
app.post('/webhooks/:topic', async (req, res) => {
  const { topic } = req.params;
  const shop = req.headers['x-shopify-shop-domain'];

  try {
    await Shopify.Webhooks.Registry.process({
      shop,
      topic,
      rawBody: req.body,
    });
    console.log(`Webhook processed, shop ${shop} topic ${topic}`);
    res.status(200).send('OK');
  } catch (error) {
    console.error(`Failed to process webhook: ${error}`);
    res.status(500).send(error.message);
  }
});

// Serve static files and handle client routes
app.use(express.static(STATIC_PATH));
app.use((req, res, next) => {
  const shop = req.query.shop;
  if (!shop && req.path !== '/login') {
    res.redirect(`/login?shop=${shop}`);
    return;
  }
  next();
});

app.get('/*', async (req, res) => {
  const shop = req.query.shop;
  const appInstalled = await Shopify.Auth.isAppInstalled(shop);

  if (!appInstalled && !req.path.includes('/auth')) {
    res.redirect(`/auth?shop=${shop}`);
    return;
  }

  res.set('Content-Type', 'text/html');
  res.send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files being served from: ${STATIC_PATH}`);
});
