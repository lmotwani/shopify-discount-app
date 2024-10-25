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
    const shopDomain = req.query.shop;
    const { type, quantity, value, productId, collectionId } = req.body;

    // Validate input
    if (!type || !quantity || !value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type !== 'percentage' && type !== 'fixed') {
      return res.status(400).json({ error: 'Invalid discount type' });
    }

    if (type === 'percentage' && (value < 0 || value > 100)) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
    }

    const result = await db.run(
      `INSERT INTO discount_rules (
        shop_domain, type, quantity, value, product_id, collection_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [shopDomain, type, quantity, value, productId || null, collectionId || null]
    );

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

// Delete discount rule
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const shopDomain = req.query.shop;

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
router.get('/calculate', async (req, res) => {
  try {
    const db = await getDatabase();
    const shopDomain = req.query.shop;
    const { productId, quantity } = req.query;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    const rule = await db.get(
      `SELECT * FROM discount_rules 
       WHERE shop_domain = ? 
       AND (product_id = ? OR product_id IS NULL)
       AND quantity <= ?
       AND active = 1
       ORDER BY quantity DESC, value DESC
       LIMIT 1`,
      [shopDomain, productId, quantity]
    );

    res.json({ discount: rule || null });
  } catch (error) {
    console.error('Error calculating discount:', error);
    res.status(500).json({ error: 'Failed to calculate discount' });
  }
});

export default router;
