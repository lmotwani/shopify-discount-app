import { useState, useCallback } from "react";
import { Button, Modal, TextContainer } from "@shopify/polaris";
import { ResourcePicker as ShopifyResourcePicker } from "@shopify/app-bridge-react";

export function ResourcePicker({ type, onSelect, buttonText }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSelection = useCallback(
    (resources) => {
      const selection = resources.selection[0];
      setSelectedItem(selection);
      onSelect(selection);
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        {buttonText || `Select ${type}`}
      </Button>

      {selectedItem && (
        <TextContainer>
          <p>Selected: {selectedItem.title}</p>
        </TextContainer>
      )}

      <ShopifyResourcePicker
        resourceType={type}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        onSelection={handleSelection}
        allowMultiple={false}
      />
    </>
  );
}
