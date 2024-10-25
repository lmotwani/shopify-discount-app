import { Routes as ReactRouterRoutes, Route } from "react-router-dom";
import { DiscountRuleForm } from "./components/DiscountRuleForm";
import { CartSummary } from "./components/CartSummary";

export function Routes() {
  return (
    <ReactRouterRoutes>
      <Route path="/" element={<DiscountRuleForm />} />
      <Route path="/cart" element={<CartSummary />} />
      <Route path="*" element={<NotFound />} />
    </ReactRouterRoutes>
  );
}

function NotFound() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}
