import React from 'react';
import { Page, Layout } from '@shopify/polaris';

export function UninstalledAppView() {
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <h1>Please install this app to continue.</h1>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
