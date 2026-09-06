require('dotenv').config();
const mongoose = require('mongoose');

async function restock() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';
  await mongoose.connect(uri);
  const Product = require('../models/Product');
  const res = await Product.updateMany(
    {},
    { $set: { "variants.$[].stockQuantity": 100 } }
  );
  console.log('Restocked variants in shop db:', res);
  await mongoose.disconnect();
}

restock().catch(err => {
  console.error(err);
  process.exit(1);
});
