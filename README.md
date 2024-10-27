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

## Development

```bash
# Install dependencies
npm install

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
