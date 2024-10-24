import { useQuery } from 'react-query';
import { calculateDiscount } from '../api/discount';

export const useDiscountCalculation = (productId: string) => {
  const { data: discounts, isLoading, error } = useQuery(
    ['discounts', productId],
    () => calculateDiscount({ productId, quantity: 1 }),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );

  return {
    discounts,
    isLoading,
    error,
  };
};
