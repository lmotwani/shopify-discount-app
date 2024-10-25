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
  Loading
} from "@shopify/polaris";
import { useApi } from "../hooks/useApi";
import { useTranslation } from "react-i18next";
import { ResourcePicker } from "./ResourcePicker";
import { DiscountPreview } from "./DiscountPreview";

export function DiscountRuleForm() {
  const { t } = useTranslation();
  const { createDiscountRule } = useApi();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
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
        product_ids: selectedProducts.map(p => p.id).join(","),
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
    } catch (error) {
      setToastMessage(t("discountRule.createError"));
      setShowToast(true);
    }
  }, [formData, selectedProducts, createDiscountRule, t]);

  const handleChange = useCallback((value, name) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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

                    <Select
                      label={t("discountRule.scope")}
                      options={[
                        { label: t("discountRule.allProducts"), value: "all" },
                        { label: t("discountRule.specificProducts"), value: "products" },
                      ]}
                      value={formData.scope}
                      onChange={value => handleChange(value, "scope")}
                    />

                    {formData.scope === "products" && (
                      <Stack vertical>
                        <Button onClick={() => setShowResourcePicker(true)}>
                          {t("discountRule.selectProducts")}
                        </Button>
                        {selectedProducts.length > 0 && (
                          <Banner status="info">
                            {t("discountRule.selectedProducts", { count: selectedProducts.length })}
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
                product_ids: selectedProducts.map(p => p.id).join(",")
              }}
            />
          </Layout.Section>
        </Layout>
      </Page>

      <ResourcePicker
        open={showResourcePicker}
        onCancel={() => setShowResourcePicker(false)}
        onSelection={(resources) => {
          setSelectedProducts(resources.selection);
          setShowResourcePicker(false);
        }}
      />
    </Frame>
  );
}
