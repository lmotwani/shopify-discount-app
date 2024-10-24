import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import { useMemo } from "react";

export const useApi = () => {
  const fetch = useAuthenticatedFetch();

  return useMemo(
    () => ({
      // Fetch all discount rules
      getDiscountRules: async () => {
        const response = await fetch("/api/discounts");
        return response.json();
      },

      // Create a new discount rule
      createDiscountRule: async (data) => {
        const response = await fetch("/api/discounts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        return response.json();
      },

      // Delete a discount rule
      deleteDiscountRule: async (id) => {
        const response = await fetch(`/api/discounts/${id}`, {
          method: "DELETE",
        });
        return response.ok;
      },

      // Calculate discount for a product
      calculateDiscount: async (productId, quantity) => {
        const response = await fetch(
          `/api/discounts/calculate?productId=${productId}&quantity=${quantity}`
        );
        return response.json();
      },
    }),
    [fetch]
  );
};
