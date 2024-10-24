import React from 'react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Badge,
  Stack,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { deleteDiscountRule, fetchDiscountRules } from '../api/discount';

export const DiscountRules: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery('discountRules', fetchDiscountRules);

  const deleteMutation = useMutation(deleteDiscountRule, {
    onSuccess: () => {
      queryClient.invalidateQueries('discountRules');
    },
  });

  const formatTiers = (tiers: any[]) => {
    return tiers
      .map(
        (tier) =>
          `${tier.quantity}+ items: ${tier.discount}${
            tier.type === 'percentage' ? '%' : '$'
          } off`
      )
      .join(', ');
  };

  const rows = rules.map((rule: any) => [
    rule.type === 'percentage' ? 'Percentage' : 'Fixed Amount',
    formatTiers(rule.tiers),
    rule.productId ? 'Product' : rule.collectionId ? 'Collection' : 'Store-wide',
    <Badge status={rule.active ? 'success' : 'warning'}>
      {rule.active ? 'Active' : 'Inactive'}
    </Badge>,
    <Stack spacing="tight">
      <Button onClick={() => navigate(`/rules/edit/${rule.id}`)}>Edit</Button>
      <Button
        destructive
        onClick={() => deleteMutation.mutate(rule.id)}
        loading={deleteMutation.isLoading}
      >
        Delete
      </Button>
    </Stack>,
  ]);

  return (
    <Page
      title="Discount Rules"
      primaryAction={{
        content: 'Create New Rule',
        onAction: () => navigate('/rules/new'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['Type', 'Tiers', 'Scope', 'Status', 'Actions']}
              rows={rows}
              loading={isLoading}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
