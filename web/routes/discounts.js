import express from 'express';
import { getDatabase } from '../database/index.js';
// Remove the import of verifyRequest as it's no longer needed here

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

// Create a new discount rule
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { shopDomain, quantity, discountType, discountValue } = req.body;

    // Input validation
    if (!shopDomain || !quantity || !discountType || !discountValue) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (quantity < 1 || discountValue < 0) {
      return res.status(400).json({ error: 'Invalid quantity or discount value' });
    }

    if (discountType !== 'percentage' && discountType !== 'fixed') {
      return res.status(400).json({ error: 'Invalid discount type' });
    }


    const result = await db.run(
      'INSERT INTO discount_rules (shop_domain, quantity, discount_type, discount_value, active) VALUES (?, ?, ?, ?, ?)',
      [shopDomain, quantity, discountType, discountValue, 1]
    );

    res.json({ message: 'Discount rule created', ruleId: result.lastID });
  } catch (error) {
    console.error('Error creating discount rule:', error);
    res.status(500).json({ error: 'Failed to create discount rule' });
  }
});


// ... other routes (update, delete, etc.) with similar error handling and input validation

export default router;
