import React, { useState } from "react";
import {
  Card,
  Text,
  VerticalStack,
  Banner,
  Select,
  Button,
  TextField,
  HorizontalStack,
  Box
} from "@shopify/polaris";
import "./styles/QuantityDiscountWidget.css";

export function DiscountPreview({ rule }) {
  const [previewQuantity, setPreviewQuantity] = useState(1);
  const [previewPrice, setPreviewPrice] = useState(19.99); // Default preview price

  // Sample quantities based on the rule's minimum
  const quantities = [1, rule.quantity, rule.quantity * 2].map(qty => ({
    label: qty.toString(),
    value: qty.toString()
  }));

  const calculateDiscountedPrice = (qty) => {
    if (qty < rule.quantity) return previewPrice * qty;

    if (rule.type === "percentage") {
      const discount = (previewPrice * qty * rule.value) / 100;
      return previewPrice * qty - discount;
    } else {
      return previewPrice * qty - (rule.value * qty);
    }
  };

  const calculateSavings = (qty) => {
    if (qty < rule.quantity) return 0;
    const originalPrice = previewPrice * qty;
    const discountedPrice = calculateDiscountedPrice(qty);
    return originalPrice - discountedPrice;
  };

  return (
    <Card sectioned title="Preview Widget">
      <VerticalStack gap="4">
        <HorizontalStack align="space-between">
          <TextField
            label="Sample Product Price"
            type="number"
            value={previewPrice.toString()}
            onChange={(value) => setPreviewPrice(parseFloat(value) || 0)}
            prefix="$"
          />
        </HorizontalStack>

        <div className="quantity-widget preview-widget">
          <div className="widget-header">
            <Box>
              <Text variant="headingLg" as="h2">
                ${(calculateDiscountedPrice(rule.quantity) / rule.quantity).toFixed(2)} per item
              </Text>
              <Text variant="bodyMd" color="subdued">
                ${previewPrice.toFixed(2)} regular price
              </Text>
              {calculateSavings(rule.quantity) > 0 && (
                <Box className="save-badge">
                  <Text variant="bodyMd" color="success">
                    SAVE ${(calculateSavings(rule.quantity) / rule.quantity).toFixed(2)} per item
                  </Text>
                </Box>
              )}
            </Box>
          </div>

          <div className="quantity-section">
            <Select
              value={previewQuantity.toString()}
              onChange={(value) => setPreviewQuantity(parseInt(value, 10))}
              options={quantities}
            />
            <Button primary>Add to Cart</Button>
          </div>

          <div className="discount-tiers">
            <div className="discount-tier">
              <div className="tier-header">Buy {rule.quantity}+</div>
              <div className="tier-price">
                ${(calculateDiscountedPrice(rule.quantity) / rule.quantity).toFixed(2)} per item
              </div>
              <div className="tier-savings">
                {rule.type === "percentage" 
                  ? `Save ${rule.value}% off`
                  : `Save $${rule.value} per item`}
                <br />
                Total savings: ${calculateSavings(rule.quantity).toFixed(2)}
              </div>
            </div>

            <div className="discount-tier">
              <div className="tier-header">Buy {rule.quantity * 2}+</div>
              <div className="tier-price">
                ${(calculateDiscountedPrice(rule.quantity * 2) / (rule.quantity * 2)).toFixed(2)} per item
              </div>
              <div className="tier-savings">
                {rule.type === "percentage" 
                  ? `Save ${rule.value}% off`
                  : `Save $${rule.value} per item`}
                <br />
                Total savings: ${calculateSavings(rule.quantity * 2).toFixed(2)}
              </div>
            </div>
          </div>

          {previewQuantity >= rule.quantity && (
            <div className="selection-summary">
              <div className="total-price">
                Total: ${calculateDiscountedPrice(previewQuantity).toFixed(2)}
              </div>
              <div className="total-savings">
                You save: ${calculateSavings(previewQuantity).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <Banner status="info">
          <p>This is how your discount rule will appear to customers on product pages.</p>
          <Text variant="bodySm" color="subdued">
            {rule.scope === "all" 
              ? "This rule will apply to all products"
              : rule.scope === "products"
              ? `This rule will apply to ${rule.productTitles?.length || 0} selected products`
              : `This rule will apply to products in ${rule.collectionTitles?.length || 0} selected collections`}
          </Text>
        </Banner>
      </VerticalStack>
    </Card>
  );
}
