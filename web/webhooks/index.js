import { Shopify } from "@shopify/shopify-api";
import { getDatabase } from "../database/index.js";

export const webhookHandlers = {
  // Handle product updates
  PRODUCTS_UPDATE: async (topic, shop, body) => {
    try {
      const db = await getDatabase();
      const data = JSON.parse(body);
      
      // Update any relevant discount rules
      await db.run(
        `UPDATE discount_rules 
         SET updated_at = CURRENT_TIMESTAMP 
         WHERE shop_domain = ? AND product_id = ?`,
        [shop, data.id]
      );
    } catch (error) {
      console.error('Error handling product update webhook:', error);
    }
  },

  // Handle collection updates
  COLLECTIONS_UPDATE: async (topic, shop, body) => {
    try {
      const db = await getDatabase();
      const data = JSON.parse(body);
      
      // Update product-collection mappings
      const products = data.products || [];
      
      // Remove old mappings
      await db.run(
        'DELETE FROM product_collections WHERE shop_domain = ? AND collection_id = ?',
        [shop, data.id]
      );

      // Add new mappings
      for (const productId of products) {
        await db.run(
          `INSERT INTO product_collections (product_id, collection_id, shop_domain)
           VALUES (?, ?, ?)`,
          [productId, data.id, shop]
        );
      }
    } catch (error) {
      console.error('Error handling collection update webhook:', error);
    }
  },

  // Handle app uninstallation
  APP_UNINSTALLED: async (topic, shop, body) => {
    try {
      const db = await getDatabase();
      
      // Clean up all data for the shop
      await db.run('DELETE FROM discount_rules WHERE shop_domain = ?', [shop]);
      await db.run('DELETE FROM product_collections WHERE shop_domain = ?', [shop]);
    } catch (error) {
      console.error('Error handling app uninstall webhook:', error);
    }
  }
};

export async function registerWebhooks(shop, accessToken) {
  const webhooks = [
    {
      topic: 'PRODUCTS_UPDATE',
      address: `${process.env.HOST}/webhooks/products-update`,
    },
    {
      topic: 'COLLECTIONS_UPDATE',
      address: `${process.env.HOST}/webhooks/collections-update`,
    },
    {
      topic: 'APP_UNINSTALLED',
      address: `${process.env.HOST}/webhooks/app-uninstalled`,
    },
  ];

  for (const webhook of webhooks) {
    try {
      await Shopify.Webhooks.Registry.register({
        shop,
        accessToken,
        path: webhook.address,
        topic: webhook.topic,
      });
      console.log(`Registered ${webhook.topic} webhook for ${shop}`);
    } catch (error) {
      console.error(`Failed to register ${webhook.topic} webhook:`, error);
    }
  }
}
