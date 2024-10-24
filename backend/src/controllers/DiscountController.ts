import { Request, Response } from 'express';
import DiscountService from '../services/DiscountService';
import { validateDiscountRule } from '../middleware/validation';

export class DiscountController {
    // Create a new discount rule
    async createRule(req: Request, res: Response) {
        try {
            const validation = validateDiscountRule(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: validation.errors });
            }

            const rule = await DiscountService.createRule({
                ...req.body,
                shopId: req.body.shopId
            });
            res.status(201).json(rule);
        } catch (error) {
            console.error('Error creating discount rule:', error);
            res.status(500).json({ error: 'Failed to create discount rule' });
        }
    }

    // Get all rules for a shop
    async getRules(req: Request, res: Response) {
        try {
            const { shopId } = req.params;
            const filters = req.query;
            const rules = await DiscountService.getRules(shopId, filters);
            res.json(rules);
        } catch (error) {
            console.error('Error fetching discount rules:', error);
            res.status(500).json({ error: 'Failed to fetch discount rules' });
        }
    }

    // Update a rule
    async updateRule(req: Request, res: Response) {
        try {
            const { ruleId } = req.params;
            const validation = validateDiscountRule(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: validation.errors });
            }

            const rule = await DiscountService.updateRule(ruleId, req.body);
            if (!rule) {
                return res.status(404).json({ error: 'Rule not found' });
            }
            res.json(rule);
        } catch (error) {
            console.error('Error updating discount rule:', error);
            res.status(500).json({ error: 'Failed to update discount rule' });
        }
    }

    // Delete a rule
    async deleteRule(req: Request, res: Response) {
        try {
            const { ruleId } = req.params;
            const success = await DiscountService.deleteRule(ruleId);
            if (!success) {
                return res.status(404).json({ error: 'Rule not found' });
            }
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting discount rule:', error);
            res.status(500).json({ error: 'Failed to delete discount rule' });
        }
    }

    // Calculate discount for a product
    async calculateDiscount(req: Request, res: Response) {
        try {
            const { productId, quantity } = req.params;
            const { shopId } = req.body;
            const discount = await DiscountService.calculateDiscount(
                productId,
                parseInt(quantity, 10),
                shopId
            );
            res.json({ discount });
        } catch (error) {
            console.error('Error calculating discount:', error);
            res.status(500).json({ error: 'Failed to calculate discount' });
        }
    }
}

export default new DiscountController();
