import React from 'react';
import { Badge, Banner, Stack } from '@shopify/polaris';
import { useDiscountCalculation } from '../../hooks/useDiscountCalculation';

interface ProductDiscountBadgeProps {
  productId: string;
  price: number;
}

export const ProductDiscountBadge: React.FC<ProductDiscountBadgeProps> = ({
  productId,
  price,
}) => {
  const { discounts, isLoading } = useDiscountCalculation(productId);

  if (isLoading || !discounts?.length) return null;

  return (
    <Banner status="info">
      <Stack vertical spacing="tight">
        {discounts.map((discount, index) => (
          <Stack key={index} distribution="equalSpacing">
            <div>Buy {discount.quantity} or more:</div>
            <Badge status="success">
              Save{' '}
              {discount.type === 'percentage'
                ? `${discount.value}%`
                : `$${discount.value}`}
            </Badge>
          </Stack>
        ))}
      </Stack>
    </Banner>
  );
};
