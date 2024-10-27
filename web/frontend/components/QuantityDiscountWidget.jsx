import React, { useState, useEffect } from 'react';
import {
  VerticalStack,
  HorizontalStack,
  Text,
  Button,
  Select,
  Box,
  Banner,
  Loading,
  Toast,
  EmptyState,
} from '@shopify/polaris';
import { useApi } from '../hooks/useApi';
import './styles/QuantityDiscountWidget.css';
import { useTranslation } from 'react-i18next';

export function QuantityDiscountWidget({ product, shop }) {
  const { t } = useTranslation();
  const { addToCart, makeRequest, isLoading } = useApi();

  const [quantity, setQuantity] = useState(1);
  const [discountTiers, setDiscountTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const basePrice = product?.variants?.[0]?.price || 0;
  const productId = product?.id;
  const variantId = product?.variants?.[0]?.id;

  useEffect(() => {
    const fetchDiscounts = async () => {
      if (!shop || !productId) {
        setLoading(false);
        return;
      }

      try {
        const data = await makeRequest(`/api/discounts/calculate?shop=${shop}&productId=${productId}`);
        setDiscountTiers(data.tiers.filter((tier) => tier.rule));
      } catch (err) {
        console.error('Error fetching discounts:', err);
        setError(t('quantityDiscountWidget.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, [productId, shop, makeRequest, t]);

  const handleAddToCart = async (qty) => {
    if (!variantId) {
      return;
    }

    try {
      await addToCart(variantId, qty);
      setToastMessage(t('quantityDiscountWidget.addToCartSuccess', { quantity: qty }));
      setShowToast(true);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setToastMessage(err.message || t('quantityDiscountWidget.addToCartError'));
      setShowToast(true);
    }
  };

  const calculatePrice = (qty) => {
    const tier = discountTiers.find((t) => t.quantity <= qty);
    if (!tier || !tier.rule) return basePrice * qty;

    const { type, value } = tier.rule;
    const discount = type === 'percentage' ? (basePrice * qty * value) / 100 : value * qty;
    return basePrice * qty - discount;
  };

  const calculateSavings = (qty) => {
    const originalPrice = basePrice * qty;
    return originalPrice - calculatePrice(qty);
  };

  if (loading || isLoading) return <Loading />;

  if (error) {
    return <Banner status="critical" onDismiss={() => setError(null)}><p>{error}</p></Banner>;
  }

  if (!product || !variantId) {
    return (
      <EmptyState
        heading={t('quantityDiscountWidget.noProduct')}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>{t('quantityDiscountWidget.selectProduct')}</p>
      </EmptyState>
    );
  }

  if (discountTiers.length === 0) {
    return null;
  }

  const toastMarkup = showToast ? (
    <Toast content={toastMessage} onDismiss={() => setShowToast(false)} duration={3000} />
  ) : null;

  const quantityOptions = [
    { label: '1', value: '1' },
    ...discountTiers.map((tier) => ({
      label: tier.quantity.toString(),
      value: tier.quantity.toString(),
    })),
  ];

  return (
    <Box padding="4" background="bg-surface">
      {loading && <Loading />}
      {toastMarkup}

      <VerticalStack gap="4">
        <Box>
          <Text variant="headingLg">${basePrice.toFixed(2)}</Text>
          <Text variant="bodySm" color="subdued">per item</Text>
        </Box>

        <HorizontalStack gap="3">
          <Box minWidth="100px">
            <Select
              label="Quantity"
              labelHidden
              value={quantity.toString()}
              onChange={(value) => setQuantity(parseInt(value, 10))}
              options={quantityOptions}
              disabled={isLoading}
            />
          </Box>
          <Button primary fullWidth loading={isLoading} disabled={isLoading} onClick={() => handleAddToCart(quantity)}>
            Add {quantity} to Cart - ${calculatePrice(quantity).toFixed(2)}
          </Button>
        </HorizontalStack>

        <VerticalStack gap="3">
          {discountTiers.map((tier) => {
            const savings = calculateSavings(tier.quantity);
            const pricePerItem = (calculatePrice(tier.quantity) / tier.quantity).toFixed(2);
            return (
              <Box
                key={tier.quantity}
                padding="3"
                background="bg-surface-secondary"
                borderRadius="2"
                borderWidth="1"
                borderColor="border"
                onClick={() => !isLoading && handleAddToCart(tier.quantity)}
                cursor={isLoading ? 'wait' : 'pointer'}
              >
                <VerticalStack gap="1">
                  <Text variant="headingSm">Add {tier.quantity} items</Text>
                  <Text variant="bodyMd">${pricePerItem} per item</Text>
                  {savings > 0 && (
                    <Text variant="bodySm" color="success">Save ${savings.toFixed(2)}</Text>
                  )}
                </VerticalStack>
              </Box>
            );
          })}
        </VerticalStack>

        {quantity > 1 && calculateSavings(quantity) > 0 && (
          <Banner status="success" title={`Save ${calculateSavings(quantity).toFixed(2)}`}>
            {discountTiers.find((t) => t.quantity <= quantity)?.rule?.type === 'percentage' ? (
              <Text variant="bodySm">{discountTiers.find((t) => t.quantity <= quantity)?.rule?.value}% off</Text>
            ) : (
              <Text variant="bodySm">
                ${discountTiers.find((t) => t.quantity <= quantity)?.rule?.value} off per item
              </Text>
            )}
          </Banner>
        )}
      </VerticalStack>
    </Box>
  );
}
