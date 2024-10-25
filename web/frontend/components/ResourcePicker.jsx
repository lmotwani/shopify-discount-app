import React, { useState, useCallback } from "react";
import { ResourcePicker as ShopifyResourcePicker } from "@shopify/app-bridge-react";
import { Button, VerticalStack, Text } from "@shopify/polaris";

export function ResourcePicker({ type, onSelect, selectedResource }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelection = useCallback(
    (resources) => {
      const selection = resources.selection[0];
      onSelect({
        id: selection.id,
        title: selection.title,
      });
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <VerticalStack gap="2">
      <Button onClick={() => setIsOpen(true)}>
        {selectedResource ? `Change ${type}` : `Select ${type}`}
      </Button>

      {selectedResource && (
        <Text variant="bodySm" color="subdued">
          Selected: {selectedResource.title}
        </Text>
      )}

      <ShopifyResourcePicker
        resourceType={type === "Product" ? "Product" : "Collection"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        onSelection={handleSelection}
        allowMultiple={false}
      />
    </VerticalStack>
  );
}
