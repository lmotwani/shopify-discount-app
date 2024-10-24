// server.js
require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const { Shopify } = require('@shopify/koa-shopify-auth');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

// Models
const DiscountRule = {
  id: String,
  productId: String,
  collectionId: String, // optional
  type: 'percentage' | 'fixed',
  tiers: [{
    quantity: Number,
    discount: Number,
    savings: Number // calculated field
  }],
  active: Boolean,
  startDate: Date,
  endDate: Date // optional
};

// Middleware for validation
const validateDiscountRule = async (ctx, next) => {
  const rule = ctx.request.body;
  if (!rule.type || !rule.tiers || rule.tiers.length === 0) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid discount rule format' };
    return;
  }
  await next();
};

// Routes
router.post('/api/discount-rules', validateDiscountRule, async (ctx) => {
  // Create new discount rule
  const rule = ctx.request.body;
  // Save to database
  ctx.body = { success: true, rule };
});

router.get('/api/discount-rules/:productId', async (ctx) => {
  // Fetch rules for specific product
  const { productId } = ctx.params;
  // Fetch from database
  ctx.body = { rules: [] };
});

// Client-side script for product pages
const productDiscountScript = `
  const calculateDiscount = (quantity, rules) => {
    if (!rules || rules.length === 0) return 0;
    
    const applicableRule = rules.find(rule => {
      const currentDate = new Date();
      return rule.active && 
             (!rule.startDate || currentDate >= new Date(rule.startDate)) &&
             (!rule.endDate || currentDate <= new Date(rule.endDate));
    });

    if (!applicableRule) return 0;

    const applicableTier = applicableRule.tiers
      .filter(tier => quantity >= tier.quantity)
      .sort((a, b) => b.quantity - a.quantity)[0];

    if (!applicableTier) return 0;

    return {
      discountAmount: applicableTier.discount,
      type: applicableRule.type,
      savings: applicableTier.savings
    };
  };

  const updateProductPrice = (quantity) => {
    const basePrice = parseFloat(document.querySelector('[data-base-price]').dataset.basePrice);
    const rules = JSON.parse(document.querySelector('[data-discount-rules]').dataset.discountRules);
    
    const discount = calculateDiscount(quantity, rules);
    const finalPrice = discount.type === 'percentage' 
      ? basePrice * (1 - discount.discountAmount / 100)
      : basePrice - discount.discountAmount;

    // Update UI
    document.querySelector('.final-price').textContent = finalPrice.toFixed(2);
    document.querySelector('.savings').textContent = discount.savings.toFixed(2);
  };
`;

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));