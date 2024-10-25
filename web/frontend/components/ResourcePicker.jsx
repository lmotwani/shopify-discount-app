import { ResourcePicker as ShopifyResourcePicker } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

export function ResourcePicker({ open, onCancel, onSelection }) {
  const { t } = useTranslation();

  return (
    <ShopifyResourcePicker
      resourceType="Product"
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
