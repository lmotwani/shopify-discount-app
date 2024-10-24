import mongoose, { Schema, Document } from 'mongoose';

export interface DiscountRule extends Document {
  shopId: string;
  productId?: string;
  collectionId?: string;
  type: 'percentage' | 'fixed';
  tiers: {
    quantity: number;
    discount: number;
  }[];
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountRuleSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  productId: { type: String, sparse: true },
  collectionId: { type: String, sparse: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  tiers: [{
    quantity: { type: Number, required: true },
    discount: { type: Number, required: true }
  }],
  active: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
DiscountRuleSchema.index({ shopId: 1, productId: 1 });
DiscountRuleSchema.index({ shopId: 1, collectionId: 1 });
DiscountRuleSchema.index({ active: 1, startDate: 1, endDate: 1 });

export default mongoose.model<DiscountRule>('DiscountRule', DiscountRuleSchema);
