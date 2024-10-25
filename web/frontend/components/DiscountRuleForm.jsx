import React, { useState, useCallback } from "react";
import {
  Card,
  Page,
  Layout,
  FormLayout,
  TextField,
  Select,
  Button,
  Stack,
  Banner,
  ResourceList,
  ResourceItem,
  TextStyle,
  SkeletonBodyText,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { ResourcePicker } from "./ResourcePicker";

export function DiscountRuleForm() {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: "percentage",
    quantity: "3",
    value: "10",
    productId: "",
    productTitle: "",
    collectionId: "",
    collectionTitle: "",
    scope: "all", // 'all', 'product', or 'collection'
  });
  const [error, setError] = useState(null);

  // Fetch existing rules
  const {
    data: rulesData,
    isLoading,
    error: fetchError,
  } = useQuery("discountRules", async () => {
    const response = await fetch("/api/discounts");
    if (!response.ok) {
      throw new Error("Failed to fetch discount rules");
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create discount rule");
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
          productId: "",
          productTitle: "",
          collectionId: "",
          collectionTitle: "",
          scope: "all",
        });
        setError(null);
      },
      onError: (err) => {
        setError(err.message);
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
        throw new Error("Failed to delete discount rule");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("discountRules");
      },
      onError: (err) => {
        setError(err.message);
      },
    }
  );

  const handleSubmit = useCallback(() => {
    // Validate form
    if (!formData.quantity || !formData.value) {
      setError("Quantity and value are required");
      return;
    }

    if (formData.type === "percentage" && (formData.value < 0 || formData.value > 100)) {
      setError("Percentage must be between 0 and 100");
      return;
    }

    if (formData.scope === "product" && !formData.productId) {
      setError("Please select a product");
      return;
    }

    if (formData.scope === "collection" && !formData.collectionId) {
      setError("Please select a collection");
      return;
    }

    createRule.mutate(formData);
  }, [formData, createRule]);

  const handleResourceSelect = useCallback((resource, type) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Id`]: resource.id,
      [`${type}Title`]: resource.title,
    }));
  }, []);

  if (isLoading) {
    return (
      <Page title="Quantity Discounts">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <SkeletonBodyText lines={6} />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (fetchError) {
    return (
      <Page title="Quantity Discounts">
        <Layout>
          <Layout.Section>
            <Banner status="critical">
              <p>Failed to load discount rules. Please try again later.</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Quantity Discounts">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <FormLayout>
              {error && (
                <Banner status="critical" onDismiss={() => setError(null)}>
                  <p>{error}</p>
                </Banner>
              )}

              <Select
                label="Apply To"
                options={[
                  { label: "All Products", value: "all" },
                  { label: "Specific Product", value: "product" },
                  { label: "Specific Collection", value: "collection" },
                ]}
                value={formData.scope}
                onChange={(value) => setFormData({ ...formData, scope: value })}
              />

              {formData.scope === "product" && (
                <ResourcePicker
                  type="Product"
                  onSelect={(resource) => handleResourceSelect(resource, "product")}
                  selectedResource={
                    formData.productId
                      ? { id: formData.productId, title: formData.productTitle }
                      : null
                  }
                />
              )}

              {formData.scope === "collection" && (
                <ResourcePicker
                  type="Collection"
                  onSelect={(resource) => handleResourceSelect(resource, "collection")}
                  selectedResource={
                    formData.collectionId
                      ? { id: formData.collectionId, title: formData.collectionTitle }
                      : null
                  }
                />
              )}

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
                error={formData.quantity < 1 ? "Quantity must be at least 1" : undefined}
              />

              <TextField
                label={formData.type === "percentage" ? "Discount (%)" : "Discount Amount ($)"}
                type="number"
                value={formData.value}
                onChange={(value) => setFormData({ ...formData, value: value })}
                min="0"
                max={formData.type === "percentage" ? "100" : undefined}
                error={
                  formData.type === "percentage" && formData.value > 100
                    ? "Percentage cannot exceed 100%"
                    : undefined
                }
              />

              <Stack distribution="trailing">
                <Button
                  primary
                  onClick={handleSubmit}
                  loading={createRule.isLoading}
                >
                  Create Discount Rule
                </Button>
              </Stack>
            </FormLayout>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Existing Rules">
            <ResourceList
              loading={isLoading}
              items={rulesData?.rules || []}
              renderItem={(rule) => (
                <ResourceItem id={rule.id}>
                  <Stack distribution="equalSpacing" alignment="center">
                    <Stack vertical spacing="extraTight">
                      <TextStyle variation="strong">
                        {rule.type === "percentage"
                          ? `${rule.value}% off`
                          : `$${rule.value} off`}
                      </TextStyle>
                      <TextStyle>When buying {rule.quantity}+ items</TextStyle>
                      {rule.productTitle && (
                        <TextStyle variation="subdued">
                          Product: {rule.productTitle}
                        </TextStyle>
                      )}
                      {rule.collectionTitle && (
                        <TextStyle variation="subdued">
                          Collection: {rule.collectionTitle}
                        </TextStyle>
                      )}
                    </Stack>
                    <Button
                      destructive
                      onClick={() => deleteRule.mutate(rule.id)}
                      loading={deleteRule.isLoading}
                    >
                      Delete
                    </Button>
                  </Stack>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
