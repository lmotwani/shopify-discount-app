# Shopify Quantity Discount App

A Shopify app that enables merchants to offer dynamic quantity-based discounts on their products. This app helps increase average order value by incentivizing customers to buy more with automatic discounts.

## Features

### For Store Owners
- Create flexible quantity-based discount rules
  - Set minimum quantity thresholds (e.g., 3+, 6+, 12+ items)
  - Choose between percentage or fixed amount discounts
  - Apply to all products or specific products/collections
  - Multiple discount tiers per product
  - Easy rule management through admin interface

### For Customers
- Clear discount display on product pages
  - See available quantity discounts
  - Real-time price calculations
  - Automatic discount application
  - Easy quantity selection
  - Total savings display

### Discount Types
- Percentage discounts (e.g., 20% off when buying 6+ items)
- Fixed amount discounts (e.g., $5 off per item when buying 3+)
- Mix and match discounts across products
- Collection-wide discounts

### Cart Features
- Automatic discount calculations
- Clear savings breakdown
- Per-item and total discount display
- Multiple discount support
- Real-time updates

## Project Structure

```
/web
├── frontend/           # React frontend
│   ├── components/    # UI components
│   │   ├── DiscountRuleForm.jsx    # Discount rule management
│   │   ├── QuantityDiscountWidget.jsx  # Product page widget
│   │   └── CartSummary.jsx         # Cart calculations
│   ├── hooks/        # Custom hooks
│   ├── pages/        # Page components
│   └── providers/    # Context providers
├── database/          # Database setup
├── middleware/        # Express middleware
└── routes/           # API routes
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Build frontend:
```bash
npm run build
```

4. Start server:
```bash
npm start
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Required environment variables:
- SHOPIFY_API_KEY - Your Shopify API key
- SHOPIFY_API_SECRET - Your Shopify API secret
- HOST - Your app's host URL
- SCOPES - Required Shopify access scopes
- PORT - Server port (default: 3000)
- NODE_ENV - Environment (development/production)
- DATABASE_URL - SQLite database path

## Example Usage

### Creating a Discount Rule
1. Access the app in Shopify admin
2. Click "Create Discount Rule"
3. Set:
   - Minimum quantity (e.g., 6)
   - Discount type (percentage/fixed)
   - Discount value (e.g., 20%)
   - Apply to (all/specific products/collections)
4. Save rule

### Customer Experience
1. Customer views product
2. Sees available quantity discounts
3. Selects quantity
4. Sees total savings
5. Adds to cart with discount applied

## Technical Details

- Built with React and Express
- Uses SQLite for data storage
- Integrates with Shopify Admin API
- Real-time price calculations
- Responsive design
- Error handling and logging
- Session management
- Secure authentication

## Support

For support, contact: [Your Support Email]

## License

This project is licensed under the MIT License - see the LICENSE file for details.
