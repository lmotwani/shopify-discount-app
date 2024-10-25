import React, { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import "./styles/QuantityDiscountWidget.css";

export function QuantityDiscountWidget({ product, shop }) {
  const fetch = useAuthenticatedFetch();
  const [quantity, setQuantity] = useState(1);
  const [discountTiers, setDiscountTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const basePrice = product?.variants[0]?.price || 0;
  const productId = product?.id;
  const productTitle = product?.title || 'item';

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await fetch(
          `/api/discounts/calculate?shop=${shop}&productId=${productId}`
        );
        if (!response.ok) throw new Error("Failed to fetch discounts");
        const data = await response.json();
        setDiscountTiers(data.tiers.filter(tier => tier.rule));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId && shop) {
      fetchDiscounts();
    }
  }, [productId, shop, fetch]);

  // Calculate price for a given quantity
  const calculatePrice = (qty) => {
    const tier = discountTiers.find(t => t.quantity <= qty);
    if (!tier || !tier.rule) return basePrice * qty;

    const { type, value } = tier.rule;
    if (type === "percentage") {
      const discount = (basePrice * qty * value) / 100;
      return basePrice * qty - discount;
    } else {
      return basePrice * qty - (value * qty);
    }
  };

  // Calculate savings for a given quantity
  const calculateSavings = (qty) => {
    const originalPrice = basePrice * qty;
    const discountedPrice = calculatePrice(qty);
    return originalPrice - discountedPrice;
  };

  // Get discount text for a given tier
  const getDiscountText = (tier) => {
    if (!tier.rule) return "";
    const { type, value } = tier.rule;
    return type === "percentage" 
      ? `${value}% off`
      : `$${value.toFixed(2)} off per item`;
  };

  // Find best available discount
  const getBestDiscount = () => {
    if (discountTiers.length === 0) return null;
    return discountTiers.reduce((best, current) => {
      const currentSavings = calculateSavings(current.quantity) / current.quantity;
      const bestSavings = best ? calculateSavings(best.quantity) / best.quantity : 0;
      return currentSavings > bestSavings ? current : best;
    }, null);
  };

  if (loading) return <div className="quantity-widget">Loading...</div>;
  if (error) return <div className="quantity-widget">Error: {error}</div>;
  if (discountTiers.length === 0) return null;

  const bestDiscount = getBestDiscount();

  return (
    <div className="quantity-widget">
      {/* Regular Price */}
      <div className="price-display">
        ${basePrice.toFixed(2)}
        <span className="per-item">per {productTitle}</span>
      </div>

      {/* Best Discount Banner */}
      {bestDiscount && (
        <div className="best-discount-banner">
          <div className="discount-text">
            {getDiscountText(bestDiscount)}
            <br />
            when you buy {bestDiscount.quantity}+ {bestDiscount.quantity === 1 ? productTitle : productTitle + 's'}
          </div>
          <div className="savings-badge">
            Save ${(calculateSavings(bestDiscount.quantity) / bestDiscount.quantity).toFixed(2)} per item
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="quantity-section">
        <select 
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          className="quantity-select"
        >
          {[1, ...discountTiers.map(t => t.quantity)].map(qty => (
            <option key={qty} value={qty}>{qty}</option>
          ))}
        </select>

        <button className="add-cart-button">
          Add to Cart - ${calculatePrice(quantity).toFixed(2)}
        </button>
      </div>

      {/* Discount Tiers */}
      <div className="discount-tiers">
        {discountTiers.map(tier => (
          <div 
            key={tier.quantity}
            className={`discount-tier ${quantity === tier.quantity ? 'selected' : ''}`}
            onClick={() => setQuantity(tier.quantity)}
          >
            <div className="tier-header">Buy {tier.quantity}+</div>
            <div className="tier-price">
              ${(calculatePrice(tier.quantity) / tier.quantity).toFixed(2)} per item
            </div>
            <div className="tier-savings">
              {getDiscountText(tier)}
              <br />
              Total savings: ${calculateSavings(tier.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Current Selection Summary */}
      {quantity > 1 && calculateSavings(quantity) > 0 && (
        <div className="selection-summary">
          <div className="total-price">
            Total: ${calculatePrice(quantity).toFixed(2)}
          </div>
          <div className="total-savings">
            You save: ${calculateSavings(quantity).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
