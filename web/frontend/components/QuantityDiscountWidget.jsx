import React, { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import {
  VerticalStack,
  HorizontalStack,
  Text,
  Button,
  Select,
  Box,
  Banner
} from "@shopify/polaris";
import "./styles/QuantityDiscountWidget.css";

export function QuantityDiscountWidget({ product, shop }) {
  const fetch = useAuthenticatedFetch();
  const [quantity, setQuantity] = useState(1);
  const [discountTiers, setDiscountTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const basePrice = product?.variants[0]?.price || 0;
  const productId = product?.id;

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

  const calculateSavings = (qty) => {
    const originalPrice = basePrice * qty;
    const discountedPrice = calculatePrice(qty);
    return originalPrice - discountedPrice;
  };

  if (loading) return <div className="quantity-widget">Loading...</div>;
  if (error) return <div className="quantity-widget">Error: {error}</div>;
  if (discountTiers.length === 0) return null;

  return (
    <Box padding="4" background="bg-surface">
      <VerticalStack gap="4">
        {/* Regular Price */}
        <Box>
          <Text variant="headingLg">${basePrice.toFixed(2)}</Text>
          <Text variant="bodySm" color="subdued">per item</Text>
        </Box>

        {/* Quantity Selector */}
        <HorizontalStack gap="3">
          <Box minWidth="100px">
            <Select
              label="Quantity"
              labelHidden
              value={quantity.toString()}
              onChange={(value) => setQuantity(parseInt(value, 10))}
              options={[
                { label: "1", value: "1" },
                ...discountTiers.map(tier => ({
                  label: tier.quantity.toString(),
                  value: tier.quantity.toString()
                }))
              ]}
            />
          </Box>
          <Button primary fullWidth>
            Add to Cart - ${calculatePrice(quantity).toFixed(2)}
          </Button>
        </HorizontalStack>

        {/* Discount Tiers */}
        <VerticalStack gap="3">
          {discountTiers.map(tier => {
            const savings = calculateSavings(tier.quantity);
            return (
              <Box
                key={tier.quantity}
                padding="3"
                background="bg-surface-secondary"
                borderRadius="2"
                borderWidth="1"
                borderColor="border"
                onClick={() => setQuantity(tier.quantity)}
                cursor="pointer"
              >
                <VerticalStack gap="1">
                  <Text variant="headingSm">Buy {tier.quantity}+ items</Text>
                  <Text variant="bodyMd">
                    ${(calculatePrice(tier.quantity) / tier.quantity).toFixed(2)} per item
                  </Text>
                  {savings > 0 && (
                    <Text variant="bodySm" color="success">
                      Save ${savings.toFixed(2)}
                    </Text>
                  )}
                </VerticalStack>
              </Box>
            );
          })}
        </VerticalStack>

        {/* Current Selection Summary */}
        {quantity > 1 && calculateSavings(quantity) > 0 && (
          <Banner status="success" title={`Save ${calculateSavings(quantity).toFixed(2)}`}>
            <Text variant="bodySm">
              {discountTiers.find(t => t.quantity <= quantity)?.rule?.type === "percentage"
                ? `${discountTiers.find(t => t.quantity <= quantity)?.rule?.value}% off`
                : `$${discountTiers.find(t => t.quantity <= quantity)?.rule?.value} off per item`}
            </Text>
          </Banner>
        )}
      </VerticalStack>
    </Box>
  );
}
