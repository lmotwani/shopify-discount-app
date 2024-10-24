import { Card, TextStyle, Stack, Banner } from "@shopify/polaris";
import { useApi } from "../hooks/useApi";
import { useState, useEffect } from "react";

export function DiscountPreview({ rule }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const api = useApi();

  useEffect(() => {
    if (!rule) return;

    const loadPreview = async () => {
      setLoading(true);
      try {
        // Calculate preview for different quantity tiers
        const tiers = [rule.quantity, rule.quantity * 2, rule.quantity * 3];
        const previews = await Promise.all(
          tiers.map(async (qty) => {
            const result = await api.calculateDiscount({
              productId: rule.productId,
              quantity: qty,
            });
            return { quantity: qty, ...result };
          })
        );
        setPreview(previews);
      } catch (err) {
        setError("Failed to load discount preview");
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [rule, api]);

  if (loading) return <Card sectioned>Loading preview...</Card>;
  if (error) return <Banner status="critical">{error}</Banner>;
  if (!preview) return null;

  return (
    <Card title="Discount Preview" sectioned>
      <Stack vertical spacing="tight">
        {preview.map((tier, index) => (
          <Stack distribution="equalSpacing" key={index}>
            <TextStyle>Buy {tier.quantity} items:</TextStyle>
            <TextStyle variation="strong">
              Save{" "}
              {rule.type === "percentage"
                ? `${rule.value}%`
                : `$${rule.value * tier.quantity}`}
            </TextStyle>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
