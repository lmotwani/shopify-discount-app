import React, { useState, useCallback } from "react";
import { ResourcePicker as ShopifyResourcePicker } from "@shopify/app-bridge-react";
import { Button, Stack, TextStyle } from "@shopify/polaris";

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
    <Stack vertical>
      <Button onClick={() => setIsOpen(true)}>
        {selectedResource ? `Change ${type}` : `Select ${type}`}
      </Button>

      {selectedResource && (
        <TextStyle variation="subdued">
          Selected: {selectedResource.title}
        </TextStyle>
      )}

      <ShopifyResourcePicker
        resourceType={type === "Product" ? "Product" : "Collection"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        onSelection={handleSelection}
        allowMultiple={false}
      />
    </Stack>
  );
}
