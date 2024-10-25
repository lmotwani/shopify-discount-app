import express from 'express';
import { getDatabase } from '../database/index.js';

const router = express.Router();

// Get all discount rules for a shop
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const shopDomain = req.query.shop;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    const rules = await db.all(
      'SELECT * FROM discount_rules WHERE shop_domain = ? AND active = 1 ORDER BY quantity ASC',
      [shopDomain]
    );
    
    res.json({ rules });
  } catch (error) {
    console.error('Error fetching discount rules:', error);
    res.status(500).json({ error: 'Failed to fetch discount rules' });
  }
});

// Create new discount rule
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { shop, type, quantity, value, productIds, collectionIds, scope } = req.body;

    // Validate input
    if (!shop || !type || !quantity || !value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type !== 'percentage' && type !== 'fixed') {
      return res.status(400).json({ error: 'Invalid discount type' });
    }

    if (type === 'percentage' && (value < 0 || value > 100)) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
    }

    // Save rule in database
    const result = await db.run(`
      INSERT INTO discount_rules (
        shop_domain, type, quantity, value, scope, 
        product_ids, collection_ids, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      shop, type, quantity, value, scope,
      productIds ? JSON.stringify(productIds) : null,
      collectionIds ? JSON.stringify(collectionIds) : null
    ]);

    const newRule = await db.get(
      'SELECT * FROM discount_rules WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({ rule: newRule });
  } catch (error) {
    console.error('Error creating discount rule:', error);
    res.status(500).json({ error: 'Failed to create discount rule' });
  }
});

// Get applicable discounts for a product
router.get('/calculate', async (req, res) => {
  try {
    const db = await getDatabase();
    const { shop, productId } = req.query;

    if (!shop || !productId) {
      return res.status(400).json({ error: 'Shop and product ID are required' });
    }

    // Get all applicable rules for the product
    const rules = await db.all(`
      SELECT * FROM discount_rules 
      WHERE shop_domain = ? 
      AND active = 1
      AND (
        scope = 'all'
        OR (scope = 'products' AND JSON_EXTRACT(product_ids, '$[*]') LIKE ?)
        OR (scope = 'collections' AND EXISTS (
          SELECT 1 FROM json_each(collection_ids) 
          WHERE value IN (
            SELECT collection_id 
            FROM product_collections 
            WHERE product_id = ?
          )
        ))
      )
      ORDER BY quantity ASC
    `, [shop, `%${productId}%`, productId]);

    // Create tiers from rules
    const tiers = rules.map(rule => ({
      quantity: rule.quantity,
      rule: {
        type: rule.type,
        value: rule.value,
        quantity: rule.quantity
      }
    }));

    res.json({ tiers });
  } catch (error) {
    console.error('Error calculating discount:', error);
    res.status(500).json({ error: 'Failed to calculate discount' });
  }
});

// Calculate cart discounts
router.post('/cart/calculate', async (req, res) => {
  try {
    const db = await getDatabase();
    const { shop, items } = req.body;

    if (!shop || !items) {
      return res.status(400).json({ error: 'Shop and items are required' });
    }

    // Calculate discounts for each item
    const itemDiscounts = await Promise.all(items.map(async (item) => {
      const { productId, quantity, price } = item;

      // Get applicable rules for this product
      const rules = await db.all(`
        SELECT * FROM discount_rules 
        WHERE shop_domain = ? 
        AND active = 1
        AND quantity <= ?
        AND (
          scope = 'all'
          OR (scope = 'products' AND JSON_EXTRACT(product_ids, '$[*]') LIKE ?)
          OR (scope = 'collections' AND EXISTS (
            SELECT 1 FROM json_each(collection_ids) 
            WHERE value IN (
              SELECT collection_id 
              FROM product_collections 
              WHERE product_id = ?
            )
          ))
        )
        ORDER BY quantity DESC
        LIMIT 1
      `, [shop, quantity, `%${productId}%`, productId]);

      const rule = rules[0];
      
      // Calculate savings
      let originalPrice = price * quantity;
      let discountedPrice = originalPrice;
      let savings = 0;

      if (rule) {
        if (rule.type === 'percentage') {
          savings = (originalPrice * rule.value) / 100;
        } else {
          savings = rule.value * quantity;
        }
        discountedPrice = originalPrice - savings;
      }

      return {
        productId,
        quantity,
        originalPrice,
        discountedPrice,
        savings,
        discount: rule || null
      };
    }));

    // Calculate totals
    const summary = {
      subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      totalSavings: itemDiscounts.reduce((sum, item) => sum + item.savings, 0),
      discountedItems: itemDiscounts.filter(item => item.discount).length,
      discounts: itemDiscounts,
    };

    summary.total = summary.subtotal - summary.totalSavings;

    res.json({
      summary,
      itemDiscounts
    });
  } catch (error) {
    console.error('Error calculating cart discounts:', error);
    res.status(500).json({ error: 'Failed to calculate cart discounts' });
  }
});

// Delete discount rule
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const shop = req.query.shop;

    const result = await db.run(
      'DELETE FROM discount_rules WHERE id = ? AND shop_domain = ?',
      [id, shop]
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

export default router;
