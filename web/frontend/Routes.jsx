import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';
import { DiscountRuleForm } from './components/DiscountRuleForm';

export default function Routes() {
  return (
    <ReactRouterRoutes>
      <Route path="/" element={<DiscountRuleForm />} />
    </ReactRouterRoutes>
  );
}
