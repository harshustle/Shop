require('dotenv').config();
const mongoose = require('mongoose');

async function restock() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';
  await mongoose.connect(uri);
  const Product = require('../../models/catalog/Product');
  const res = await Product.updateMany(
    {},
    { 
      $set: { 
        "variants.$[].stockQuantity": 100,
        "variants.$[].stockOnHand": 100,
        "variants.$[].stockAllocated": 0
      } 
    }
  );
  const outOfStockSkus = String(process.env.TEST_OUT_OF_STOCK_SKUS || '')
    .split(',')
    .map(sku => sku.trim().toUpperCase())
    .filter(Boolean);

  if (outOfStockSkus.length > 0) {
    await Product.updateMany(
      { "variants.sku": { $in: outOfStockSkus } },
      {
        $set: {
          "variants.$[variant].stockQuantity": 0,
          "variants.$[variant].stockOnHand": 0,
          "variants.$[variant].stockAllocated": 0
        }
      },
      { arrayFilters: [{ "variant.sku": { $in: outOfStockSkus } }] }
    );
  }

  const redisService = require('../../services/cache/redisService');
  await redisService.flushPattern('cache:catalog:*');
  await redisService.flushPattern('stock:sku:*');
  await redisService.flushPattern('reserve:sku:*');
  if (redisService.client) {
    try { await redisService.client.quit(); } catch (e) {}
  }
  console.log('Restocked variants in shop db:', res);
  console.log('Kept out of stock for UI testing:', outOfStockSkus);
  await mongoose.disconnect();
}

restock().catch(err => {
  console.error(err);
  process.exit(1);
});
