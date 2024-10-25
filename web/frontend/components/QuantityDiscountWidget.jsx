import React, { useState, useEffect } from "react";
import {
  VerticalStack,
  HorizontalStack,
  Text,
  Button,
  Select,
  Box,
  Banner,
  Loading,
  Toast
} from "@shopify/polaris";
import { useApi } from "../hooks/useApi";
import "./styles/QuantityDiscountWidget.css";

export function QuantityDiscountWidget({ product, shop }) {
  const { addToCart, makeRequest, isLoading, error } = useApi();
  const [quantity, setQuantity] = useState(1);
  const [discountTiers, setDiscountTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const basePrice = product?.variants[0]?.price || 0;
  const productId = product?.id;
  const variantId = product?.variants[0]?.id;

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const data = await makeRequest(
          `/api/discounts/calculate?shop=${shop}&productId=${productId}`
        );
        setDiscountTiers(data.tiers.filter(tier => tier.rule));
      } catch (err) {
        console.error('Error fetching discounts:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId && shop) {
      fetchDiscounts();
    }
  }, [productId, shop, makeRequest]);

  const handleAddToCart = async (qty) => {
    try {
      await addToCart(variantId, qty);
      setToastMessage(`Added ${qty} item${qty > 1 ? 's' : ''} to cart`);
      setShowToast(true);
    } catch (err) {
      setToastMessage(err.message || 'Failed to add to cart');
      setShowToast(true);
    }
  };

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

  if (loading) return <Loading />;
  if (!product || !variantId) return null;
  if (discountTiers.length === 0) return null;

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setShowToast(false)}
      duration={3000}
    />
  ) : null;

  return (
    <Box padding="4" background="bg-surface">
      {isLoading && <Loading />}
      {toastMarkup}
      
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
              disabled={isLoading}
            />
          </Box>
          <Button 
            primary 
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            onClick={() => handleAddToCart(quantity)}
          >
            Add {quantity} to Cart - ${calculatePrice(quantity).toFixed(2)}
          </Button>
        </HorizontalStack>

        {/* Quick Add Buttons */}
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
                onClick={() => !isLoading && handleAddToCart(tier.quantity)}
                cursor={isLoading ? "wait" : "pointer"}
              >
                <VerticalStack gap="1">
                  <Text variant="headingSm">Add {tier.quantity} items</Text>
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

        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            <p>{error}</p>
          </Banner>
        )}
      </VerticalStack>
    </Box>
  );
}
