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

// ... (rest of the code remains the same)

export default router;
