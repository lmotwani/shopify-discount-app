import { Card, TextContainer, Text, Banner, List } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export function DiscountPreview({ rule }) {
  const { t } = useTranslation();

  if (!rule?.quantity || !rule?.value) {
    return null;
  }

  const formatDiscount = () => {
    if (rule.type === "percentage") {
      return `${rule.value}%`;
    }
    return `$${rule.value}`;
  };

  return (
    <Card sectioned>
      <TextContainer spacing="tight">
        <Text variant="headingMd" as="h2">
          {t("discountPreview.title")}
        </Text>
        
        <Banner status="info">
          <List type="bullet">
            <List.Item>
              {t("discountPreview.quantity", { quantity: rule.quantity })}
            </List.Item>
            <List.Item>
              {t("discountPreview.discount", { discount: formatDiscount() })}
            </List.Item>
            <List.Item>
              {rule.scope === "all" 
                ? t("discountPreview.allProducts")
                : t("discountPreview.selectedProducts", {
                    count: rule.product_ids?.split(",").length || 0
                  })}
            </List.Item>
          </List>
        </Banner>
      </TextContainer>
    </Card>
  );
}
