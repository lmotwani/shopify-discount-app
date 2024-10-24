import { Request, Response, NextFunction } from 'express';
import Shopify from '@shopify/shopify-api';

export const authenticateShopify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = req.headers['x-shopify-shop-domain'] as string;
    const accessToken = req.headers['x-shopify-access-token'] as string;

    if (!shop || !accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify HMAC
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const rawBody = JSON.stringify(req.body);
    
    if (!Shopify.Utils.verifyHmac(hmac, rawBody, process.env.SHOPIFY_API_SECRET!)) {
      return res.status(401).json({ error: 'Invalid HMAC' });
    }

    // Store shop and access token in request for later use
    req.shopify = { shop, accessToken };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
