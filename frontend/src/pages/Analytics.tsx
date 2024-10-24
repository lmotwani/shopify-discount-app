import React from 'react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Select,
  Stack,
  TextStyle,
  ProgressBar,
} from '@shopify/polaris';
import { useQuery } from 'react-query';
import { fetchAnalytics } from '../api/analytics';
import { Chart } from '../components/Chart';

export const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = React.useState('30');
  const { data: analytics, isLoading } = useQuery(['analytics', timeframe], () =>
    fetchAnalytics(timeframe)
  );

  const timeframeOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
  ];

  return (
    <Page
      title="Analytics"
      subtitle="Track the performance of your quantity discounts"
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack distribution="equalSpacing">
              <TextStyle variation="strong">Overview</TextStyle>
              <Select
                options={timeframeOptions}
                value={timeframe}
                onChange={setTimeframe}
              />
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section oneHalf>
          <Card title="Discount Usage" sectioned>
            <Chart
              data={analytics?.usageData || []}
              loading={isLoading}
            />
          </Card>
        </Layout.Section>

        <Layout.Section oneHalf>
          <Card title="Revenue Impact" sectioned>
            <Chart
              data={analytics?.revenueData || []}
              loading={isLoading}
            />
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Top Performing Rules">
            <DataTable
              columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
              headings={[
                'Rule',
                'Usage Count',
                'Total Savings',
                'Conversion Rate',
              ]}
              rows={
                analytics?.topRules?.map((rule: any) => [
                  rule.name,
                  rule.usageCount,
                  `$${rule.totalSavings.toFixed(2)}`,
                  `${(rule.conversionRate * 100).toFixed(1)}%`,
                ]) || []
              }
              loading={isLoading}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
