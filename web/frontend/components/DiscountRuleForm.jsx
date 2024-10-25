import React, { useState, useCallback } from "react";
import {
  Card,
  Page,
  Layout,
  FormLayout,
  TextField,
  Select,
  Button,
  VerticalStack,
  HorizontalStack,
  Banner,
  ResourceList,
  ResourceItem,
  Text,
  Modal,
  Box
} from "@shopify/polaris";
import { ResourcePicker } from "./ResourcePicker";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { DiscountPreview } from './DiscountPreview';

export function DiscountRuleForm() {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [resourceType, setResourceType] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    type: "percentage",
    quantity: "3",
    value: "10",
    scope: "all",
    productIds: [],
    productTitles: [],
    collectionIds: [],
    collectionTitles: [],
  });

  const tabs = [
    {
      id: "all",
      content: "All Products",
      accessibilityLabel: "All products",
      panelID: "all-products-content",
    },
    {
      id: "specific",
      content: "Specific Products",
      accessibilityLabel: "Specific products",
      panelID: "specific-products-content",
    },
    {
      id: "collections",
      content: "Collections",
      accessibilityLabel: "Collections",
      panelID: "collections-content",
    },
  ];

  // Fetch existing rules
  const { data: rulesData, isLoading } = useQuery("discountRules", async () => {
    const response = await fetch("/api/discounts");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch discount rules");
    }
    return response.json();
  });

  // Create rule mutation
  const createRule = useMutation(
    async (data) => {
      const response = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create discount rule");
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("discountRules");
        setFormData({
          type: "percentage",
          quantity: "3",
          value: "10",
          scope: "all",
          productIds: [],
          productTitles: [],
          collectionIds: [],
          collectionTitles: [],
        });
        setError(null);
      },
      onError: (error) => {
        setError(error.message);
      },
    }
  );

  // Delete rule mutation
  const deleteRule = useMutation(
    async (id) => {
      const response = await fetch(`/api/discounts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete discount rule");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("discountRules");
        setShowDeleteModal(false);
        setSelectedRuleId(null);
        setError(null);
      },
      onError: (error) => {
        setError(error.message);
      },
    }
  );

  const handleSubmit = useCallback(() => {
    // Validate form
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    if (formData.type === "percentage" && parseFloat(formData.value) > 100) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    const scope = tabs[selectedTab].id;
    if (scope === "specific" && formData.productIds.length === 0) {
      setError("Please select at least one product");
      return;
    }

    if (scope === "collections" && formData.collectionIds.length === 0) {
      setError("Please select at least one collection");
      return;
    }

    createRule.mutate({
      ...formData,
      scope,
      quantity: parseInt(formData.quantity),
      value: parseFloat(formData.value),
    });
  }, [formData, selectedTab, createRule, tabs]);

  const handleResourceSelection = useCallback(
    (resources) => {
      const ids = resources.selection.map((item) => item.id);
      const titles = resources.selection.map((item) => item.title);

      setFormData((prev) => ({
        ...prev,
        ...(resourceType === "Product"
          ? { productIds: ids, productTitles: titles }
          : { collectionIds: ids, collectionTitles: titles }),
      }));
      setShowResourcePicker(false);
    },
    [resourceType]
  );

  const handleDeleteClick = useCallback((id) => {
    setSelectedRuleId(id);
    setShowDeleteModal(true);
  }, []);

  return (
    <Page title="Quantity Discount Rules">
      <Layout>
        <Layout.Section>
          {error && (
            <Box paddingBlockEnd="4">
              <Banner status="critical" onDismiss={() => setError(null)}>
                <p>{error}</p>
              </Banner>
            </Box>
          )}

          <Card>
            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={(index) => setSelectedTab(index)}
            />

            <Card.Section>
              <FormLayout>
                <Select
                  label="Discount Type"
                  options={[
                    { label: "Percentage", value: "percentage" },
                    { label: "Fixed Amount", value: "fixed" },
                  ]}
                  value={formData.type}
                  onChange={(value) => setFormData({ ...formData, type: value })}
                />

                <TextField
                  label="Minimum Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(value) => setFormData({ ...formData, quantity: value })}
                  min="1"
                  error={
                    formData.quantity && parseInt(formData.quantity) < 1
                      ? "Quantity must be at least 1"
                      : undefined
                  }
                />

                <TextField
                  label={
                    formData.type === "percentage"
                      ? "Discount Percentage"
                      : "Discount Amount"
                  }
                  type="number"
                  value={formData.value}
                  onChange={(value) => setFormData({ ...formData, value: value })}
                  prefix={formData.type === "percentage" ? "%" : "$"}
                  error={
                    formData.type === "percentage" &&
                    parseFloat(formData.value) > 100
                      ? "Percentage cannot exceed 100%"
                      : undefined
                  }
                />

                {selectedTab === 1 && (
                  <VerticalStack gap="4">
                    <Button
                      onClick={() => {
                        setResourceType("Product");
                        setShowResourcePicker(true);
                      }}
                    >
                      Select Products
                    </Button>
                    {formData.productTitles.length > 0 && (
                      <Text variant="bodySm" color="subdued">
                        Selected {formData.productTitles.length} products
                      </Text>
                    )}
                  </VerticalStack>
                )}

                {selectedTab === 2 && (
                  <VerticalStack gap="4">
                    <Button
                      onClick={() => {
                        setResourceType("Collection");
                        setShowResourcePicker(true);
                      }}
                    >
                      Select Collections
                    </Button>
                    {formData.collectionTitles.length > 0 && (
                      <Text variant="bodySm" color="subdued">
                        Selected {formData.collectionTitles.length} collections
                      </Text>
                    )}
                  </VerticalStack>
                )}

                <Box paddingBlockStart="4">
                  <HorizontalStack align="end">
                    <Button primary onClick={handleSubmit} loading={createRule.isLoading}>
                      Create Discount Rule
                    </Button>
                  </HorizontalStack>
                </Box>
              </FormLayout>
            </Card.Section>
          </Card>

          {/* Preview Section */}
          {formData.quantity && formData.value && (
            <Box paddingBlockStart="4">
              <DiscountPreview
                rule={{
                  ...formData,
                  scope: tabs[selectedTab].id,
                  quantity: parseInt(formData.quantity),
                  value: parseFloat(formData.value),
                }}
              />
            </Box>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card title="Existing Rules">
            <ResourceList
              loading={isLoading}
              items={rulesData?.rules || []}
              renderItem={(rule) => (
                <ResourceItem id={rule.id}>
                  <HorizontalStack align="space-between">
                    <VerticalStack gap="1">
                      <Text variant="bodyMd" fontWeight="bold">
                        {rule.type === "percentage"
                          ? `${rule.value}% off`
                          : `$${rule.value} off`}
                        {" when buying "}
                        {rule.quantity}+ items
                      </Text>
                      <Text variant="bodySm" color="subdued">
                        {rule.scope === "all"
                          ? "Applied to all products"
                          : rule.scope === "products"
                          ? `Applied to ${rule.productTitles?.length || 0} products`
                          : `Applied to ${rule.collectionTitles?.length || 0} collections`}
                      </Text>
                    </VerticalStack>
                    <Button
                      destructive
                      onClick={() => handleDeleteClick(rule.id)}
                    >
                      Delete
                    </Button>
                  </HorizontalStack>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>

      {showResourcePicker && (
        <ResourcePicker
          resourceType={resourceType}
          open={showResourcePicker}
          onCancel={() => setShowResourcePicker(false)}
          onSelection={handleResourceSelection}
          showVariants={false}
          allowMultiple
        />
      )}

      {showDeleteModal && (
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Discount Rule"
          primaryAction={{
            content: "Delete",
            onAction: () => deleteRule.mutate(selectedRuleId),
            destructive: true,
            loading: deleteRule.isLoading,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setShowDeleteModal(false),
            },
          ]}
        >
          <Modal.Section>
            <Text>Are you sure you want to delete this discount rule?</Text>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
