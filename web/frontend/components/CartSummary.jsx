import React from "react";
import {
  Card,
  Text,
  VerticalStack,
  HorizontalStack,
  Banner,
  Box
} from "@shopify/polaris";
import "./styles/CartSummary.css";

export function CartSummary({ items, discounts }) {
  const calculateItemTotal = (item) => {
    const discount = discounts.find(d => d.productId === item.productId)?.discount;
    if (!discount) return item.price * item.quantity;

    if (discount.type === "percentage") {
      const discountAmount = (item.price * item.quantity * discount.value) / 100;
      return item.price * item.quantity - discountAmount;
    } else {
      return item.price * item.quantity - (discount.value * item.quantity);
    }
  };

  const calculateItemSavings = (item) => {
    const originalTotal = item.price * item.quantity;
    const discountedTotal = calculateItemTotal(item);
    return originalTotal - discountedTotal;
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalSavings = items.reduce((sum, item) => sum + calculateItemSavings(item), 0);
  const total = subtotal - totalSavings;

  return (
    <Card sectioned>
      <VerticalStack gap="4">
        <Text variant="headingMd">Cart Summary</Text>

        {/* Items Breakdown */}
        {items.map((item) => {
          const discount = discounts.find(d => d.productId === item.productId)?.discount;
          const savings = calculateItemSavings(item);

          return (
            <div key={item.productId} className="cart-item">
              <HorizontalStack align="space-between">
                <VerticalStack gap="1">
                  <Text variant="bodyMd">{item.title}</Text>
                  <Text variant="bodySm" color="subdued">
                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                  </Text>
                </VerticalStack>
                <VerticalStack gap="1" align="end">
                  <Text variant="bodyMd">${calculateItemTotal(item).toFixed(2)}</Text>
                  {savings > 0 && (
                    <Text variant="bodySm" color="success">
                      Save ${savings.toFixed(2)}
                    </Text>
                  )}
                </VerticalStack>
              </HorizontalStack>
              {discount && (
                <Box paddingBlock="3">
                  <Banner status="success" icon={false}>
                    {discount.type === "percentage"
                      ? `${discount.value}% off ${discount.quantity}+ items`
                      : `$${discount.value} off per item for ${discount.quantity}+ items`}
                  </Banner>
                </Box>
              )}
            </div>
          );
        })}

        {/* Totals */}
        <div className="cart-totals">
          <HorizontalStack align="space-between">
            <Text variant="bodyMd">Subtotal</Text>
            <Text variant="bodyMd">${subtotal.toFixed(2)}</Text>
          </HorizontalStack>

          {totalSavings > 0 && (
            <HorizontalStack align="space-between">
              <Text variant="bodyMd" color="success">Total Savings</Text>
              <Text variant="bodyMd" color="success">-${totalSavings.toFixed(2)}</Text>
            </HorizontalStack>
          )}

          <Box paddingBlockStart="4">
            <HorizontalStack align="space-between">
              <Text variant="headingMd">Total</Text>
              <Text variant="headingMd">${total.toFixed(2)}</Text>
            </HorizontalStack>
          </Box>
        </div>

        {/* Savings Summary */}
        {totalSavings > 0 && (
          <Banner status="success">
            <VerticalStack gap="2">
              <Text>You're saving ${totalSavings.toFixed(2)} with quantity discounts!</Text>
              <Text variant="bodySm" color="subdued">
                {discounts.filter(d => d.discount).length} items have quantity discounts applied
              </Text>
            </VerticalStack>
          </Banner>
        )}
      </VerticalStack>
    </Card>
  );
}
