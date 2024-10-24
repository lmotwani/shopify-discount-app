interface ValidationResult {
    success: boolean;
    errors?: string[];
}

export function validateDiscountRule(data: any): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!data.shopId) errors.push('Shop ID is required');
    if (!data.type) errors.push('Discount type is required');
    if (!data.tiers || !Array.isArray(data.tiers) || data.tiers.length === 0) {
        errors.push('At least one discount tier is required');
    }

    // Validate discount type
    if (data.type && !['percentage', 'fixed'].includes(data.type)) {
        errors.push('Invalid discount type. Must be either "percentage" or "fixed"');
    }

    // Validate tiers
    if (data.tiers && Array.isArray(data.tiers)) {
        data.tiers.forEach((tier: any, index: number) => {
            if (!tier.quantity || !tier.discount) {
                errors.push(`Tier ${index + 1} must have both quantity and discount values`);
            }
            if (tier.quantity && tier.quantity <= 0) {
                errors.push(`Tier ${index + 1} quantity must be greater than 0`);
            }
            if (tier.discount && tier.discount < 0) {
                errors.push(`Tier ${index + 1} discount cannot be negative`);
            }
            if (data.type === 'percentage' && tier.discount > 100) {
                errors.push(`Tier ${index + 1} percentage discount cannot exceed 100%`);
            }
        });
    }

    // Validate dates if provided
    if (data.startDate && isNaN(Date.parse(data.startDate))) {
        errors.push('Invalid start date format');
    }
    if (data.endDate && isNaN(Date.parse(data.endDate))) {
        errors.push('Invalid end date format');
    }
    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
        errors.push('End date must be after start date');
    }

    return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
    };
}
