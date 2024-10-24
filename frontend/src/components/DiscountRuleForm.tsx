import React, { useState } from 'react';
import {
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Stack,
  Banner,
} from '@shopify/polaris';

interface Tier {
  quantity: number;
  discount: number;
}

interface DiscountRuleFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export const DiscountRuleForm: React.FC<DiscountRuleFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [type, setType] = useState(initialData?.type || 'percentage');
  const [tiers, setTiers] = useState<Tier[]>(initialData?.tiers || [{ quantity: 3, discount: 10 }]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate tiers
    if (tiers.length === 0) {
      setError('At least one discount tier is required');
      return;
    }

    // Validate tier values
    for (const tier of tiers) {
      if (tier.quantity <= 0 || tier.discount <= 0) {
        setError('Quantity and discount values must be greater than 0');
        return;
      }
      if (type === 'percentage' && tier.discount > 100) {
        setError('Percentage discount cannot exceed 100%');
        return;
      }
    }

    onSubmit({
      type,
      tiers: tiers.sort((a, b) => a.quantity - b.quantity),
    });
  };

  const addTier = () => {
    setTiers([...tiers, { quantity: 0, discount: 0 }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof Tier, value: number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  return (
    <Card sectioned>
      <form onSubmit={handleSubmit}>
        <FormLayout>
          {error && (
            <Banner status="critical">
              <p>{error}</p>
            </Banner>
          )}

          <Select
            label="Discount Type"
            options={[
              { label: 'Percentage', value: 'percentage' },
              { label: 'Fixed Amount', value: 'fixed' },
            ]}
            value={type}
            onChange={(value) => setType(value)}
          />

          <Card sectioned title="Discount Tiers">
            {tiers.map((tier, index) => (
              <Stack key={index} distribution="fillEvenly" alignment="center">
                <TextField
                  label="Quantity"
                  type="number"
                  value={tier.quantity.toString()}
                  onChange={(value) => updateTier(index, 'quantity', Number(value))}
                  min={1}
                />
                <TextField
                  label={type === 'percentage' ? 'Discount (%)' : 'Discount ($)'}
                  type="number"
                  value={tier.discount.toString()}
                  onChange={(value) => updateTier(index, 'discount', Number(value))}
                  min={0}
                  max={type === 'percentage' ? 100 : undefined}
                />
                <Button destructive onClick={() => removeTier(index)}>
                  Remove
                </Button>
              </Stack>
            ))}
            <Button onClick={addTier}>Add Tier</Button>
          </Card>

          <Button primary submit loading={isLoading}>
            Save Discount Rule
          </Button>
        </FormLayout>
      </form>
    </Card>
  );
};
