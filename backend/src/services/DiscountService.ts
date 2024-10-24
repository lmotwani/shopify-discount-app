import { DiscountRule } from '../models/DiscountRule';
import Redis from 'redis';

export class DiscountService {
    private redisClient: Redis.RedisClientType;

    constructor() {
        this.redisClient = Redis.createClient({
            url: process.env.REDIS_URL
        });
        this.redisClient.connect().catch(console.error);
    }

    // Calculate discount for a given product and quantity
    async calculateDiscount(productId: string, quantity: number, shopId: string): Promise<number> {
        const cacheKey = `discount:${shopId}:${productId}:${quantity}`;
        
        // Try to get from cache first
        const cachedResult = await this.redisClient.get(cacheKey);
        if (cachedResult) {
            return parseFloat(cachedResult);
        }

        // Get applicable rules
        const rules = await DiscountRule.find({
            shopId,
            $or: [
                { productId },
                { collectionId: { $exists: true } },
                { 
                    productId: { $exists: false },
                    collectionId: { $exists: false }
                }
            ],
            active: true,
            $or: [
                {
                    startDate: { $exists: false }
                },
                {
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() }
                }
            ]
        }).sort({ createdAt: -1 });

        let maxDiscount = 0;

        // Calculate the best discount
        rules.forEach(rule => {
            const applicableTier = rule.tiers
                .filter(tier => tier.quantity <= quantity)
                .sort((a, b) => b.quantity - a.quantity)[0];

            if (applicableTier) {
                const discount = rule.type === 'percentage' 
                    ? (applicableTier.discount / 100)
                    : applicableTier.discount;
                maxDiscount = Math.max(maxDiscount, discount);
            }
        });

        // Cache the result
        await this.redisClient.set(cacheKey, maxDiscount.toString(), {
            EX: 3600 // Cache for 1 hour
        });

        return maxDiscount;
    }

    // Create a new discount rule
    async createRule(ruleData: Partial<DiscountRule>): Promise<DiscountRule> {
        const rule = new DiscountRule(ruleData);
        await rule.save();
        await this.invalidateCache(rule.shopId);
        return rule;
    }

    // Update an existing rule
    async updateRule(ruleId: string, updates: Partial<DiscountRule>): Promise<DiscountRule | null> {
        const rule = await DiscountRule.findByIdAndUpdate(ruleId, updates, { new: true });
        if (rule) {
            await this.invalidateCache(rule.shopId);
        }
        return rule;
    }

    // Delete a rule
    async deleteRule(ruleId: string): Promise<boolean> {
        const rule = await DiscountRule.findByIdAndDelete(ruleId);
        if (rule) {
            await this.invalidateCache(rule.shopId);
            return true;
        }
        return false;
    }

    // Get rules for a shop
    async getRules(shopId: string, filters: any = {}): Promise<DiscountRule[]> {
        return DiscountRule.find({ shopId, ...filters }).sort({ createdAt: -1 });
    }

    // Invalidate cache for a shop
    private async invalidateCache(shopId: string): Promise<void> {
        const pattern = `discount:${shopId}:*`;
        for await (const key of this.redisClient.scanIterator({ MATCH: pattern })) {
            await this.redisClient.del(key);
        }
    }
}

export default new DiscountService();
