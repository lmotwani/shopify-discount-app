import { ResourcePicker as ShopifyResourcePicker } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

export function ResourcePicker({ resourceType = "Product", open, onCancel, onSelection }) {
  const { t } = useTranslation();

  return (
    <ShopifyResourcePicker
      resourceType={resourceType === "products" ? "Product" : "Collection"}
      showVariants={false}
      open={open}
      onCancel={onCancel}
      onSelection={onSelection}
      selectMultiple
      showArchived={false}
      showDraft={false}
      initialQuery=""
    />
  );
}
