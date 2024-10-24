import express from 'express';
import { getDatabase } from '../database/index.js';

export const discountRoutes = express.Router();

// Get all discount rules for a shop
discountRoutes.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const shopDomain = req.shopify.session.shop;
    
    const rules = await db.all(
      'SELECT * FROM discount_rules WHERE shop_domain = ? AND active = 1 ORDER BY created_at DESC',
      [shopDomain]
    );
    
    res.json({ rules });
  } catch (error) {
    console.error('Error fetching discount rules:', error);
    res.status(500).json({ error: 'Failed to fetch discount rules' });
  }
});

// Create new discount rule
discountRoutes.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const shopDomain = req.shopify.session.shop;
    const { type, quantity, value, scope, productId, collectionId } = req.body;

    // Validate input
    if (!type || !quantity || !value || !scope) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type !== 'percentage' && type !== 'fixed') {
      return res.status(400).json({ error: 'Invalid discount type' });
    }

    if (type === 'percentage' && (value < 0 || value > 100)) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const result = await db.run(
      `INSERT INTO discount_rules 
       (shop_domain, type, quantity, value, product_id, collection_id, scope) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [shopDomain, type, quantity, value, productId || null, collectionId || null, scope]
    );

    const newRule = await db.get(
      'SELECT * FROM discount_rules WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating discount rule:', error);
    res.status(500).json({ error: 'Failed to create discount rule' });
  }
});

// Delete discount rule
discountRoutes.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const shopDomain = req.shopify.session.shop;
    const { id } = req.params;

    const result = await db.run(
      'DELETE FROM discount_rules WHERE id = ? AND shop_domain = ?',
      [id, shopDomain]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting discount rule:', error);
    res.status(500).json({ error: 'Failed to delete discount rule' });
  }
});

// Calculate discount for a product
discountRoutes.get('/calculate', async (req, res) => {
  try {
    const db = await getDatabase();
    const shopDomain = req.shopify.session.shop;
    const { productId, quantity } = req.query;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const rules = await db.all(
      `SELECT * FROM discount_rules 
       WHERE shop_domain = ? 
       AND active = 1
       AND (
         product_id = ? 
         OR collection_id IN (
           SELECT collection_id 
           FROM product_collections 
           WHERE product_id = ?
         )
         OR (scope = 'all')
       )
       AND quantity <= ?
       ORDER BY quantity DESC, value DESC
       LIMIT 1`,
      [shopDomain, productId, productId, quantity]
    );

    if (rules.length === 0) {
      return res.json({ discount: null });
    }

    const rule = rules[0];
    res.json({ discount: rule });
  } catch (error) {
    console.error('Error calculating discount:', error);
    res.status(500).json({ error: 'Failed to calculate discount' });
  }
});
