import React from 'react';
import { NavigationMenu } from '@shopify/app-bridge-react';
import { AppProvider } from '@shopify/polaris';
import { QueryProvider } from './providers/QueryProvider';
import { BrowserRouter } from 'react-router-dom';
import Routes from './Routes';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <QueryProvider>
          <NavigationMenu
            navigationLinks={[
              {
                label: 'Discount Rules',
                destination: '/',
              },
            ]}
          />
          <Routes />
        </QueryProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
