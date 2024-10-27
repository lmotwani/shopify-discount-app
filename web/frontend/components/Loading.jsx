import React from 'react';
import { Spinner, Page } from '@shopify/polaris';

export function Loading() {
  return (
    <Page>
      <Spinner size="large" />
    </Page>
  );
}
