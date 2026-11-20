const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../../models/auth/User');
const Address = require('../../models/account/Address');
const Order = require('../../models/order/Order');
const Product = require('../../models/catalog/Product');

const DEMO_PASSWORD = 'Demo@123';
const DEMO_USERS = [
  { phone: '9876543210', email: 'demo@digibasti.online', fullName: 'Aarav Sharma', walletBalance: 425 },
  { phone: '9876543211', email: 'priya.demo@digibasti.online', fullName: 'Priya Verma', walletBalance: 150 },
  { phone: '9876543212', email: 'rohan.demo@digibasti.online', fullName: 'Rohan Mehta', walletBalance: 80 }
];

const PRODUCTS = [
  { title: 'Farm Fresh Milk', slug: 'demo-farm-fresh-milk', categoryName: 'Dairy', price: 68, sku: 'DEMO-MILK-1L', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80' },
  { title: 'Whole Wheat Bread', slug: 'demo-whole-wheat-bread', categoryName: 'Bakery', price: 55, sku: 'DEMO-BREAD-400G', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
  { title: 'Royal Gala Apples', slug: 'demo-royal-gala-apples', categoryName: 'Fruits', price: 189, sku: 'DEMO-APPLE-1KG', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80' },
  { title: 'Organic Broccoli', slug: 'demo-organic-broccoli', categoryName: 'Vegetables', price: 95, sku: 'DEMO-BROCCOLI-500G', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80' }
];

const ORDER_DEFINITIONS = [
  { number: 'DEMO-ORDER-1001', user: 0, status: 'pending', item: 0, quantity: 2, ageHours: 1, payment: 'cod' },
  { number: 'DEMO-ORDER-1002', user: 0, status: 'processing', item: 1, quantity: 2, ageHours: 5, payment: 'upi' },
  { number: 'DEMO-ORDER-1003', user: 0, status: 'packed', item: 2, quantity: 1, ageHours: 10, payment: 'card' },
  { number: 'DEMO-ORDER-1004', user: 0, status: 'out_for_delivery', item: 3, quantity: 2, ageHours: 16, payment: 'upi' },
  { number: 'DEMO-ORDER-1005', user: 0, status: 'delivered', item: 0, quantity: 3, ageHours: 40, payment: 'card' },
  { number: 'DEMO-ORDER-1006', user: 1, status: 'pending', item: 2, quantity: 2, ageHours: 2, payment: 'cod' },
  { number: 'DEMO-ORDER-1007', user: 2, status: 'processing', item: 3, quantity: 1, ageHours: 3, payment: 'upi' }
];

const connect = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
};

const seedUsers = async () => {
  const users = [];
  for (const definition of DEMO_USERS) {
    const occupied = await User.findOne({ phone: definition.phone });
    if (occupied && occupied.metadata?.isDemo !== true) {
      throw new Error(`Phone ${definition.phone} is already used by a non-demo account.`);
    }

    let user = occupied;
    if (!user) user = new User({ phone: definition.phone });
    user.email = definition.email;
    user.fullName = definition.fullName;
    user.password = DEMO_PASSWORD;
    user.role = 'customer';
    user.isActive = true;
    user.isPhoneVerified = true;
    user.walletBalance = definition.walletBalance;
    user.referralCode = `DEMO${definition.phone.slice(-4)}`;
    user.metadata = { ...(user.metadata || {}), isDemo: true, seededBy: 'seedDemoData' };
    await user.save();
    users.push(user);

    await Address.findOneAndUpdate(
      { userId: user._id, label: 'Home' },
      {
        userId: user._id,
        label: 'Home',
        fullName: definition.fullName,
        phoneNumber: definition.phone,
        streetAddress: '24 Demo Market Road',
        apartment: 'Near FreshCart Hub',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        postalCode: '226010',
        latitude: 26.8467,
        longitude: 80.9462,
        isDefault: true
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
  return users;
};

const seedProducts = async () => {
  for (const product of PRODUCTS) {
    await Product.findOneAndUpdate(
      { slug: product.slug },
      {
        title: product.title,
        slug: product.slug,
        description: `Demo catalog item: ${product.title}`,
        brand: 'FreshCart Demo',
        basePrice: product.price,
        categoryName: product.categoryName,
        isPublished: true,
        variants: [{ sku: product.sku, price: product.price, compareAtPrice: product.price + 20, costPrice: Math.round(product.price * 0.7), stockQuantity: 100, stockOnHand: 100, hsnCode: '1905', taxRatePercent: 5, attributes: { pack: 'Standard pack' }, isActive: true }],
        images: [{ imageUrl: product.image, altText: product.title, displayOrder: 0, isPrimary: true }]
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
};

const seedOrders = async (users) => {
  for (const definition of ORDER_DEFINITIONS) {
    const customer = users[definition.user];
    const product = PRODUCTS[definition.item];
    const subtotal = product.price * definition.quantity;
    const shippingFee = subtotal >= 499 ? 0 : 40;
    const total = subtotal + shippingFee;
    const createdAt = new Date(Date.now() - definition.ageHours * 60 * 60 * 1000);
    const isDelivered = definition.status === 'delivered';

    await Order.findOneAndUpdate(
      { orderNumber: definition.number },
      {
        orderNumber: definition.number,
        customerId: customer._id,
        customerName: customer.fullName,
        phoneNumber: customer.phone,
        email: customer.email,
        address: 'Home: 24 Demo Market Road, Near FreshCart Hub, Lucknow, Uttar Pradesh - 226010',
        products: [{ productName: product.title, quantity: definition.quantity, price: product.price }],
        items: [{ skuSnapshot: product.sku, productTitleSnapshot: product.title, variantAttributesSnapshot: { pack: 'Standard pack' }, unitPriceSnapshot: product.price, quantity: definition.quantity, totalLinePrice: subtotal }],
        subtotal,
        taxAmount: 0,
        shippingFee,
        discountAmount: 0,
        totalAmount: total,
        paymentMethod: definition.payment,
        paymentStatus: definition.payment === 'cod' && !isDelivered ? 'unpaid' : 'paid',
        status: definition.status,
        orderStatus: definition.status,
        fulfillmentStatus: isDelivered ? 'DELIVERED' : definition.status === 'out_for_delivery' ? 'OUT_FOR_DELIVERY' : definition.status === 'packed' ? 'PACKED' : 'UNFULFILLED',
        trackingCarrier: definition.status === 'pending' ? '' : 'FreshCart Express',
        trackingNumber: definition.status === 'pending' ? '' : `FCE${definition.number.slice(-4)}IN`,
        shippingLogistics: {
          courierName: 'FreshCart Express Fleet',
          riderName: definition.status === 'out_for_delivery' ? 'Vikram Singh' : '',
          riderPhone: definition.status === 'out_for_delivery' ? '9876501234' : '',
          vehicleNumber: definition.status === 'out_for_delivery' ? 'UP32 AB 2026' : '',
          estimatedDeliveryDate: new Date(createdAt.getTime() + 48 * 60 * 60 * 1000),
          trackingHistory: [{ status: definition.status, activity: `Order is ${definition.status.replaceAll('_', ' ')}`, location: 'Lucknow FreshCart Hub', timestamp: new Date() }]
        },
        createdAt,
        updatedAt: new Date()
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }
};

const run = async () => {
  try {
    await connect();
    const users = await seedUsers();
    await seedProducts();
    await seedOrders(users);
    console.log(`Demo seed complete: ${users.length} customers, ${PRODUCTS.length} products, ${ORDER_DEFINITIONS.length} orders.`);
    console.log(`Primary demo login: ${DEMO_USERS[0].phone} / ${DEMO_PASSWORD}`);
  } catch (error) {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
