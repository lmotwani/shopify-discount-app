import { useAuthenticatedFetch } from "./useAuthenticatedFetch";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export function useApi() {
  const fetch = useAuthenticatedFetch();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const makeRequest = async (endpoint, options = {}) => {
    try {
      setIsLoading(true);
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (variantId, quantity) => {
    return makeRequest('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, quantity })
    });
  };

  const discountRules = useQuery({
    queryKey: ["discountRules"],
    queryFn: async () => {
      const response = await fetch("/api/discounts");
      return response.json();
    },
  });

  const createDiscountRule = useMutation({
    mutationFn: async (data) => {
      return makeRequest("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  });

  const updateDiscountRule = useMutation({
    mutationFn: async ({ id, data }) => {
      return makeRequest(`/api/discounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
  });

  const deleteDiscountRule = useMutation({
    mutationFn: async (id) => {
      return makeRequest(`/api/discounts/${id}`, {
        method: "DELETE",
      });
    },
  });

  return {
    makeRequest,
    addToCart,
    isLoading,
    error,
    discountRules,
    createDiscountRule,
    updateDiscountRule,
    deleteDiscountRule,
  };
}
