import React, { useState, useCallback } from 'react';
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
  ChoiceList,
} from '@shopify/polaris';
import { useApi } from '../hooks/useApi';
import { useTranslation } from 'react-i18next';
import { ResourcePicker } from './ResourcePicker';
import { DiscountPreview } from './DiscountPreview';

interface SelectedResource {
  id: string;
  title: string;
}

interface FormDataType {
  type: 'percentage' | 'fixed';
  quantity: string;
  value: string;
  scope: 'all' | 'products' | 'collections';
}

interface ResourceSelection {
  selection: SelectedResource[];
}

interface DiscountRule extends FormDataType {
  product_ids: string | null;
  collection_ids: string | null;
}

export function DiscountRuleForm(): JSX.Element {
  const { t } = useTranslation();
  const { createDiscountRule } = useApi();

  const [selectedProducts, setSelectedProducts] = useState<SelectedResource[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<SelectedResource[]>([]);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [resourceType, setResourceType] = useState<'products' | 'collections'>('products');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState<FormDataType>({
    type: 'percentage',
    quantity: '',
    value: '',
    scope: 'all',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((value: string, name: keyof FormDataType) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleScopeChange = useCallback((value: string[]) => {
    setFormData((prev) => ({ ...prev, scope: value[0] as FormDataType['scope'] }));
    setSelectedProducts([]);
    setSelectedCollections([]);
  }, []);

  const handleResourcePicker = useCallback((type: 'products' | 'collections') => {
    setResourceType(type);
    setShowResourcePicker(true);
  }, []);

  const handleResourceSelection = useCallback((resources: ResourceSelection) => {
    if (resourceType === 'products') {
      setSelectedProducts(resources.selection);
    } else {
      setSelectedCollections(resources.selection);
    }
    setShowResourcePicker(false);
  }, [resourceType]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (formData.scope === 'products' && selectedProducts.length === 0) {
      setToastMessage(t('discountRule.selectProductsError'));
      setShowToast(true);
      return;
    }

    if (formData.scope === 'collections' && selectedCollections.length === 0) {
      setToastMessage(t('discountRule.selectCollectionsError'));
      setShowToast(true);
      return;
    }

    setSubmitting(true);

    try {
      const data: DiscountRule = {
        ...formData,
        product_ids: formData.scope === 'products' 
          ? selectedProducts.map((p) => p.id).join(',') 
          : null,
        collection_ids: formData.scope === 'collections' 
          ? selectedCollections.map((c) => c.id).join(',') 
          : null,
      };

      await createDiscountRule.mutateAsync(data);
      setToastMessage(t('discountRule.createSuccess'));
      setShowToast(true);
      setFormData({
        type: 'percentage',
        quantity: '',
        value: '',
        scope: 'all',
      });
      setSelectedProducts([]);
      setSelectedCollections([]);
    } catch (error) {
      console.error('Error creating discount rule:', error);
      setToastMessage(t('discountRule.createError'));
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  }, [
    createDiscountRule,
    formData,
    selectedCollections,
    selectedProducts,
    submitting,
    t,
  ]);

  const toastMarkup = showToast ? (
    <Toast content={toastMessage} onDismiss={() => setShowToast(false)} duration={3000} />
  ) : null;

  return (
    <Frame>
      {createDiscountRule.isLoading && <Loading />}
      {toastMarkup}

      <Page title={t('discountRule.title')} divider>
        <Layout>
          <Layout.Section>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <Card sectioned>
                  <FormLayout>
                    <Select
                      label={t('discountRule.type')}
                      options={[
                        { label: t('discountRule.percentage'), value: 'percentage' },
                        { label: t('discountRule.fixed'), value: 'fixed' },
                      ]}
                      value={formData.type}
                      onChange={(value) => handleChange(value, 'type')}
                    />

                    <TextField
                      label={t('discountRule.quantity')}
                      type="number"
                      value={formData.quantity}
                      onChange={(value) => handleChange(value, 'quantity')}
                      min="1"
                      autoComplete="off"
                    />

                    <TextField
                      label={t('discountRule.value')}
                      type="number"
                      value={formData.value}
                      onChange={(value) => handleChange(value, 'value')}
                      min="0"
                      suffix={formData.type === 'percentage' ? '%' : ''}
                      autoComplete="off"
                    />

                    <ChoiceList
                      title={t('discountRule.scope')}
                      choices={[
                        { label: t('discountRule.allProducts'), value: 'all' },
                        { label: t('discountRule.specificProducts'), value: 'products' },
                        { label: t('discountRule.collections'), value: 'collections' },
                      ]}
                      selected={[formData.scope]}
                      onChange={handleScopeChange}
                    />

                    {formData.scope !== 'all' && (
                      <Stack vertical>
                        <Button onClick={() => handleResourcePicker(formData.scope)}>
                          {formData.scope === 'products'
                            ? t('discountRule.selectProducts')
                            : t('discountRule.selectCollections')}
                        </Button>
                        {((formData.scope === 'products' && selectedProducts.length > 0) ||
                          (formData.scope === 'collections' && selectedCollections.length > 0)) && (
                          <Banner status="info">
                            {formData.scope === 'products'
                              ? t('discountRule.selectedProducts', { count: selectedProducts.length })
                              : t('discountRule.selectedCollections', { count: selectedCollections.length })}
                          </Banner>
                        )}
                      </Stack>
                    )}
                  </FormLayout>
                </Card>

                <PageActions
                  primaryAction={{
                    content: t('discountRule.create'),
                    onAction: handleSubmit,
                    loading: createDiscountRule.isLoading || submitting,
                    disabled: createDiscountRule.isLoading || submitting || !formData.quantity || !formData.value,
                  }}
                />
              </FormLayout>
            </Form>
          </Layout.Section>

          <Layout.Section secondary>
            <DiscountPreview
              rule={{
                ...formData,
                product_ids: selectedProducts.map((p) => p.id).join(','),
                collection_ids: selectedCollections.map((c) => c.id).join(','),
              }}
            />
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
