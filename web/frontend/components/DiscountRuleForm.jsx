import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Stack,
  Banner,
  ResourceList,
  ResourceItem,
  TextStyle,
  Modal,
  Spinner,
  Layout,
} from "@shopify/polaris";
import { ResourcePicker } from "./ResourcePicker";
import { DiscountPreview } from "./DiscountPreview";
import { useApi } from "../hooks/useApi";
import { useNavigate } from "@shopify/app-bridge-react";

export function DiscountRuleForm() {
  const api = useApi();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rules, setRules] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    type: "percentage",
    quantity: "3",
    value: "10",
    scope: "all",
    productId: "",
    productTitle: "",
    collectionId: "",
    collectionTitle: "",
  });

  // Load existing rules
  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getDiscountRules();
      setRules(response.rules || []);
    } catch (err) {
      setError("Failed to load discount rules");
      console.error("Error loading rules:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Form validation
  const validateForm = () => {
    const errors = [];
    if (!formData.type) errors.push("Discount type is required");
    if (!formData.quantity || formData.quantity < 1) {
      errors.push("Quantity must be at least 1");
    }
    if (!formData.value || formData.value < 0) {
      errors.push("Discount value must be positive");
    }
    if (formData.type === "percentage" && formData.value > 100) {
      errors.push("Percentage discount cannot exceed 100%");
    }
    if (formData.scope === "product" && !formData.productId) {
      errors.push("Please select a product");
    }
    if (formData.scope === "collection" && !formData.collectionId) {
      errors.push("Please select a collection");
    }
    return errors;
  };

  // Create new rule
  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(". "));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createDiscountRule(formData);
      // Reset form
      setFormData({
        type: "percentage",
        quantity: "3",
        value: "10",
        scope: "all",
        productId: "",
        productTitle: "",
        collectionId: "",
        collectionTitle: "",
      });
      await loadRules();
      navigate("/success"); // Show success notification
    } catch (err) {
      setError(err.message || "Failed to create discount rule");
      console.error("Error creating rule:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete rule
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);
      await api.deleteDiscountRule(deleteId);
      await loadRules();
      setShowDeleteModal(false);
      setDeleteId(null);
      navigate("/success-delete"); // Show success notification
    } catch (err) {
      setError("Failed to delete discount rule");
      console.error("Error deleting rule:", err);
    } finally {
      setLoading(false);
    }
  };

  // Resource selection handler
  const handleResourceSelect = (resource) => {
    if (formData.scope === "product") {
      setFormData({
        ...formData,
        productId: resource.id,
        productTitle: resource.title,
      });
    } else if (formData.scope === "collection") {
      setFormData({
        ...formData,
        collectionId: resource.id,
        collectionTitle: resource.title,
      });
    }
  };

  return (
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
              label="Discount Type"
              options={[
                { label: "Percentage", value: "percentage" },
                { label: "Fixed Amount", value: "fixed" },
              ]}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
              disabled={loading}
            />

            <Select
              label="Apply To"
              options={[
                { label: "All Products", value: "all" },
                { label: "Specific Collection", value: "collection" },
                { label: "Specific Product", value: "product" },
              ]}
              value={formData.scope}
              onChange={(value) => setFormData({ ...formData, scope: value })}
              disabled={loading}
            />

            {formData.scope === "collection" && (
              <Stack vertical>
                <ResourcePicker
                  type="Collection"
                  onSelect={handleResourceSelect}
                  buttonText={formData.collectionTitle || "Select Collection"}
                />
              </Stack>
            )}

            {formData.scope === "product" && (
              <Stack vertical>
                <ResourcePicker
                  type="Product"
                  onSelect={handleResourceSelect}
                  buttonText={formData.productTitle || "Select Product"}
                />
              </Stack>
            )}

            <TextField
              label="Minimum Quantity"
              type="number"
              value={formData.quantity}
              onChange={(value) => setFormData({ ...formData, quantity: value })}
              min="1"
              disabled={loading}
              autoComplete="off"
            />

            <TextField
              label={formData.type === "percentage" ? "Discount (%)" : "Discount Amount ($)"}
              type="number"
              value={formData.value}
              onChange={(value) => setFormData({ ...formData, value: value })}
              min="0"
              max={formData.type === "percentage" ? "100" : undefined}
              disabled={loading}
              autoComplete="off"
            />

            <Stack distribution="trailing">
              <Button primary submit loading={loading} onClick={handleSubmit}>
                Create Discount Rule
              </Button>
            </Stack>
          </FormLayout>
        </Card>

        {formData.type && formData.quantity && formData.value && (
          <DiscountPreview rule={formData} />
        )}
      </Layout.Section>

      <Layout.Section>
        <Card title="Existing Discount Rules">
          {loading && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Spinner accessibilityLabel="Loading" size="large" />
            </div>
          )}
          
          {!loading && rules.length === 0 && (
            <Banner status="info">
              <p>No discount rules created yet.</p>
            </Banner>
          )}

          {!loading && rules.length > 0 && (
            <ResourceList
              items={rules}
              renderItem={(rule) => (
                <ResourceItem id={rule.id}>
                  <Stack distribution="equalSpacing" alignment="center">
                    <Stack vertical spacing="extraTight">
                      <TextStyle variation="strong">
                        {rule.type === "percentage" ? `${rule.value}% off` : `$${rule.value} off`}
                      </TextStyle>
                      <TextStyle>When buying {rule.quantity}+ items</TextStyle>
                      <TextStyle>
                        Applies to:{" "}
                        {rule.scope === "all"
                          ? "All Products"
                          : rule.scope === "collection"
                          ? rule.collectionTitle
                          : rule.productTitle}
                      </TextStyle>
                    </Stack>
                    <Button
                      destructive
                      onClick={() => {
                        setDeleteId(rule.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </ResourceItem>
              )}
            />
          )}
        </Card>
      </Layout.Section>

      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteId(null);
        }}
        title="Delete Discount Rule"
        primaryAction={{
          content: "Delete",
          onAction: handleDelete,
          destructive: true,
          loading: loading,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowDeleteModal(false);
              setDeleteId(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <p>Are you sure you want to delete this discount rule? This action cannot be undone.</p>
        </Modal.Section>
      </Modal>
    </Layout>
  );
}
