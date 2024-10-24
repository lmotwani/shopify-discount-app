require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const { Shopify } = require('@shopify/koa-shopify-auth');

const app = new Koa();
const router = new Router();
const port = parseInt(process.env.PORT, 10) || 3000;

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, SHOPIFY_API_VERSION, SCOPES } = process.env;

// Check if required environment variables are set
if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_APP_URL || !SCOPES) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

const shopify = Shopify({
    apiKey: SHOPIFY_API_KEY,
    secret: SHOPIFY_API_SECRET,
    scopes: SCOPES.split(','), // Use environment variable for scopes
    async afterAuth(ctx) {
        // ... authorization logic ...
    },
};

// Check if required environment variables are set
if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_APP_URL) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}


const shopify = Shopify(shopifyConfig);

// ... routes and other middleware ...

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
