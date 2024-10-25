import { useState, useCallback } from "react";
import {
  Card,
  Page,
  Layout,
  Form,
  FormLayout,
  Button,
  Select,
  TextField,
  Banner,
  Stack,
  PageActions,
  Frame,
  Toast,
  Loading,
  ChoiceList
} from "@shopify/polaris";
import { useApi } from "../hooks/useApi";
import { useTranslation } from "react-i18next";
import { ResourcePicker } from "./ResourcePicker";
import { DiscountPreview } from "./DiscountPreview";

export function DiscountRuleForm() {
  const { t } = useTranslation();
  const { createDiscountRule } = useApi();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [resourceType, setResourceType] = useState("products");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [formData, setFormData] = useState({
    type: "percentage",
    quantity: "",
    value: "",
    scope: "all",
  });

  const handleSubmit = useCallback(async () => {
    try {
      const data = {
        ...formData,
        product_ids: formData.scope === "products" ? selectedProducts.map(p => p.id).join(",") : null,
        collection_ids: formData.scope === "collections" ? selectedCollections.map(c => c.id).join(",") : null,
      };
      await createDiscountRule.mutateAsync(data);
      setToastMessage(t("discountRule.createSuccess"));
      setShowToast(true);
      setFormData({
        type: "percentage",
        quantity: "",
        value: "",
        scope: "all",
      });
      setSelectedProducts([]);
      setSelectedCollections([]);
    } catch (error) {
      setToastMessage(t("discountRule.createError"));
      setShowToast(true);
    }
  }, [formData, selectedProducts, selectedCollections, createDiscountRule, t]);

  const handleChange = useCallback((value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleScopeChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, scope: value }));
    setSelectedProducts([]);
    setSelectedCollections([]);
  }, []);

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setShowToast(false)}
      duration={3000}
    />
  ) : null;

  return (
    <Frame>
      {createDiscountRule.isLoading && <Loading />}
      {toastMarkup}
      
      <Page
        title={t("discountRule.title")}
        divider
      >
        <Layout>
          <Layout.Section>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <Card sectioned>
                  <FormLayout>
                    <Select
                      label={t("discountRule.type")}
                      options={[
                        { label: t("discountRule.percentage"), value: "percentage" },
                        { label: t("discountRule.fixed"), value: "fixed" },
                      ]}
                      value={formData.type}
                      onChange={value => handleChange(value, "type")}
                    />

                    <TextField
                      label={t("discountRule.quantity")}
                      type="number"
                      value={formData.quantity}
                      onChange={value => handleChange(value, "quantity")}
                      min="1"
                      autoComplete="off"
                    />

                    <TextField
                      label={t("discountRule.value")}
                      type="number"
                      value={formData.value}
                      onChange={value => handleChange(value, "value")}
                      min="0"
                      suffix={formData.type === "percentage" ? "%" : ""}
                      autoComplete="off"
                    />

                    <ChoiceList
                      title={t("discountRule.scope")}
                      choices={[
                        { label: t("discountRule.allProducts"), value: "all" },
                        { label: t("discountRule.specificProducts"), value: "products" },
                        { label: t("discountRule.collections"), value: "collections" },
                      ]}
                      selected={[formData.scope]}
                      onChange={([value]) => handleScopeChange(value)}
                    />

                    {formData.scope !== "all" && (
                      <Stack vertical>
                        <Button onClick={() => {
                          setResourceType(formData.scope);
                          setShowResourcePicker(true);
                        }}>
                          {formData.scope === "products" 
                            ? t("discountRule.selectProducts")
                            : t("discountRule.selectCollections")}
                        </Button>
                        {((formData.scope === "products" && selectedProducts.length > 0) ||
                          (formData.scope === "collections" && selectedCollections.length > 0)) && (
                          <Banner status="info">
                            {formData.scope === "products"
                              ? t("discountRule.selectedProducts", { count: selectedProducts.length })
                              : t("discountRule.selectedCollections", { count: selectedCollections.length })}
                          </Banner>
                        )}
                      </Stack>
                    )}
                  </FormLayout>
                </Card>

                <PageActions
                  primaryAction={{
                    content: t("discountRule.create"),
                    onAction: handleSubmit,
                    loading: createDiscountRule.isLoading,
                    disabled: createDiscountRule.isLoading || !formData.quantity || !formData.value
                  }}
                />
              </FormLayout>
            </Form>
          </Layout.Section>

          <Layout.Section secondary>
            <DiscountPreview
              rule={{
                ...formData,
                product_ids: selectedProducts.map(p => p.id).join(","),
                collection_ids: selectedCollections.map(c => c.id).join(",")
              }}
            />
          </Layout.Section>
        </Layout>
      </Page>

      <ResourcePicker
        resourceType={resourceType}
        open={showResourcePicker}
        onCancel={() => setShowResourcePicker(false)}
        onSelection={(resources) => {
          if (resourceType === "products") {
            setSelectedProducts(resources.selection);
          } else {
            setSelectedCollections(resources.selection);
          }
          setShowResourcePicker(false);
        }}
      />
    </Frame>
  );
}
