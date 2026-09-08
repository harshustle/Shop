require('dotenv').config();
const mongoose = require('mongoose');

async function audit() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB at:', uri);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n=== REAL DATABASE AUDIT (shop) ===');
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count} document(s)`);
  }

  // Inspect Coupons
  const Coupon = require('../models/Coupon');
  const coupons = await Coupon.find();
  console.log('\n=== COUPONS IN DB ===');
  coupons.forEach(c => console.log(`  [${c.code}] ${c.discountType}: ${c.discountValue}, minOrder: ₹${c.minOrderAmount}, active: ${c.isActive}`));

  // Inspect Banners
  const Banner = require('../models/Banner');
  const banners = await Banner.find();
  console.log('\n=== BANNERS IN DB ===');
  banners.forEach(b => console.log(`  [${b.title}] active: ${b.isActive}, link: ${b.targetUrl || b.ctaLink}`));

  // Inspect Products
  const Product = require('../models/Product');
  const productsCount = await Product.countDocuments();
  console.log(`\n=== PRODUCTS IN DB: ${productsCount} ===`);

  // Inspect Categories
  const Category = require('../models/Category');
  const categoriesCount = await Category.countDocuments();
  console.log(`=== CATEGORIES IN DB: ${categoriesCount} ===`);

  // Inspect Orders
  const Order = require('../models/Order');
  const ordersCount = await Order.countDocuments();
  console.log(`=== ORDERS IN DB: ${ordersCount} ===`);

  // Inspect Users and Admins
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin' }).select('fullName phone email role');
  console.log('\n=== ADMINS IN DB ===');
  admins.forEach(a => console.log(`  [${a.fullName}] ${a.phone} (${a.email}) - role: ${a.role}`));

  const customers = await User.find({ role: { $ne: 'admin' } }).select('fullName phone email role');
  console.log('\n=== CUSTOMERS IN DB ===');
  customers.forEach(u => console.log(`  [${u.fullName}] ${u.phone} (${u.email}) - role: ${u.role}`));

  await mongoose.disconnect();
}

audit().catch(err => {
  console.error(err);
  process.exit(1);
});
