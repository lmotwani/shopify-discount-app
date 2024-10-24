import React from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  SettingToggle,
} from '@shopify/polaris';
import { useQuery, useMutation } from 'react-query';
import { fetchSettings, updateSettings } from '../api/settings';

export const Settings: React.FC = () => {
  const { data: settings, isLoading } = useQuery('settings', fetchSettings);
  const mutation = useMutation(updateSettings);

  const [formData, setFormData] = React.useState({
    defaultDiscountType: 'percentage',
    minimumQuantity: '3',
    maximumDiscount: '100',
    displayLocation: 'product_page',
    enableAnalytics: true,
  });

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <Page
      title="Settings"
      subtitle="Configure your quantity discount app preferences"
    >
      <Layout>
        <Layout.AnnotatedSection
          title="Discount Settings"
          description="Configure default values for new discount rules"
        >
          <Card sectioned>
            <FormLayout>
              <Select
                label="Default Discount Type"
                options={[
                  { label: 'Percentage', value: 'percentage' },
                  { label: 'Fixed Amount', value: 'fixed' },
                ]}
                value={formData.defaultDiscountType}
                onChange={(value) =>
                  setFormData({ ...formData, defaultDiscountType: value })
                }
              />
              <TextField
                label="Minimum Quantity"
                type="number"
                value={formData.minimumQuantity}
                onChange={(value) =>
                  setFormData({ ...formData, minimumQuantity: value })
                }
              />
              <TextField
                label="Maximum Discount"
                type="number"
                value={formData.maximumDiscount}
                onChange={(value) =>
                  setFormData({ ...formData, maximumDiscount: value })
                }
              />
            </FormLayout>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          title="Display Settings"
          description="Configure how discounts are displayed in your store"
        >
          <Card sectioned>
            <Select
              label="Display Location"
              options={[
                { label: 'Product Page', value: 'product_page' },
                { label: 'Cart Page', value: 'cart_page' },
                { label: 'Both', value: 'both' },
              ]}
              value={formData.displayLocation}
              onChange={(value) =>
                setFormData({ ...formData, displayLocation: value })
              }
            />
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          title="Analytics"
          description="Configure analytics collection preferences"
        >
          <Card sectioned>
            <SettingToggle
              action={{
                content: formData.enableAnalytics ? 'Disable' : 'Enable',
                onAction: () =>
                  setFormData({
                    ...formData,
                    enableAnalytics: !formData.enableAnalytics,
                  }),
              }}
              enabled={formData.enableAnalytics}
            >
              Analytics collection is{' '}
              {formData.enableAnalytics ? 'enabled' : 'disabled'}
            </SettingToggle>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.Section>
          <Button
            primary
            onClick={handleSubmit}
            loading={mutation.isLoading}
          >
            Save Settings
          </Button>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
