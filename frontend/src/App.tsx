import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';

import { DiscountRules } from './pages/DiscountRules';
import { CreateDiscountRule } from './pages/CreateDiscountRule';
import { EditDiscountRule } from './pages/EditDiscountRule';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider i18n={enTranslations}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DiscountRules />} />
            <Route path="/rules/new" element={<CreateDiscountRule />} />
            <Route path="/rules/edit/:id" element={<EditDiscountRule />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
