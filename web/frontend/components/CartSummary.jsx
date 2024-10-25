import React from "react";
import {
  Card,
  TextStyle,
  Stack,
  Banner,
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
      <Stack vertical spacing="tight">
        <TextStyle variation="strong">Cart Summary</TextStyle>

        {/* Items Breakdown */}
        {items.map((item) => {
          const discount = discounts.find(d => d.productId === item.productId)?.discount;
          const savings = calculateItemSavings(item);

          return (
            <div key={item.productId} className="cart-item">
              <Stack distribution="equalSpacing">
                <Stack vertical spacing="extraTight">
                  <TextStyle>{item.title}</TextStyle>
                  <TextStyle variation="subdued">
                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                  </TextStyle>
                </Stack>
                <Stack vertical spacing="extraTight" alignment="trailing">
                  <TextStyle>${calculateItemTotal(item).toFixed(2)}</TextStyle>
                  {savings > 0 && (
                    <TextStyle variation="positive">
                      Save ${savings.toFixed(2)}
                    </TextStyle>
                  )}
                </Stack>
              </Stack>
              {discount && (
                <Banner status="success" icon={false}>
                  {discount.type === "percentage"
                    ? `${discount.value}% off ${discount.quantity}+ items`
                    : `$${discount.value} off per item for ${discount.quantity}+ items`}
                </Banner>
              )}
            </div>
          );
        })}

        {/* Totals */}
        <div className="cart-totals">
          <Stack distribution="equalSpacing">
            <TextStyle>Subtotal</TextStyle>
            <TextStyle>${subtotal.toFixed(2)}</TextStyle>
          </Stack>

          {totalSavings > 0 && (
            <Stack distribution="equalSpacing">
              <TextStyle variation="positive">Total Savings</TextStyle>
              <TextStyle variation="positive">-${totalSavings.toFixed(2)}</TextStyle>
            </Stack>
          )}

          <Stack distribution="equalSpacing">
            <TextStyle variation="strong">Total</TextStyle>
            <TextStyle variation="strong">${total.toFixed(2)}</TextStyle>
          </Stack>
        </div>

        {/* Savings Summary */}
        {totalSavings > 0 && (
          <Banner status="success">
            <p>You're saving ${totalSavings.toFixed(2)} with quantity discounts!</p>
            <TextStyle variation="subdued">
              {discounts.filter(d => d.discount).length} items have quantity discounts applied
            </TextStyle>
          </Banner>
        )}
      </Stack>
    </Card>
  );
}
