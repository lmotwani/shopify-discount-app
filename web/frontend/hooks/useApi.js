import { useAuthenticatedFetch } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";

export function useApi() {
  const fetch = useAuthenticatedFetch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (endpoint, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  const addToCart = useCallback(async (variantId, quantity) => {
    try {
      setIsLoading(true);
      setError(null);

      // First check if item exists in cart
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();
      
      // Add items to cart
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: quantity
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }

      // Get updated cart
      const updatedCartResponse = await fetch('/cart.js');
      const updatedCart = await updatedCartResponse.json();

      return updatedCart;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  return {
    makeRequest,
    addToCart,
    isLoading,
    error,
  };
}
