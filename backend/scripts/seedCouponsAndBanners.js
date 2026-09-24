require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Coupon = require('../models/marketing/Coupon');
const Banner = require('../models/marketing/Banner');
const Product = require('../models/catalog/Product');
const Review = require('../models/review/Review');
const User = require('../models/auth/User');

const seed = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/shop');
        console.log('MongoDB connected for seeding coupons & banners.');

        // 1. Seed Coupons
        const sampleCoupons = [
            {
                code: 'FRESH20',
                description: 'Flat 20% off on fresh groceries and pantry essentials',
                discountType: 'percentage',
                discountValue: 20,
                minOrderAmount: 299,
                maxDiscountAmount: 150,
                expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                usageLimit: 5000,
                isActive: true
            },
            {
                code: 'WELCOME50',
                description: 'Flat ₹50 off on your first grocery delivery',
                discountType: 'fixed',
                discountValue: 50,
                minOrderAmount: 199,
                expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                usageLimit: 10000,
                isActive: true
            },
            {
                code: 'MEGA100',
                description: 'Save ₹100 on wholesale bulk orders above ₹999',
                discountType: 'fixed',
                discountValue: 100,
                minOrderAmount: 999,
                expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                usageLimit: 2000,
                isActive: true
            }
        ];

        for (const c of sampleCoupons) {
            await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true });
            console.log(`✓ Coupon: ${c.code}`);
        }

        // 2. Seed Banners
        const sampleBanners = [
            {
                title: 'Farm-Fresh Grocery Delivered to Your Door in 15 Mins',
                subtitle: 'Daily organic fruits, vegetables, pure dairy & staples at genuine wholesale prices',
                badge: '⚡ Instant 15-Minute Delivery',
                imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
                targetUrl: '/shop',
                bgColor: '#E8F8F0',
                textColor: '#064E3B',
                btnText: 'Shop All Products',
                displayOrder: 1,
                isActive: true
            },
            {
                title: 'Pure Pantry Staples: Oils, Atta, Ghee & Pulses',
                subtitle: 'India Gate, Fortune, Aashirvaad & Tata Tea with 100% quality guarantee',
                badge: 'Use Coupon: FRESH20 for 20% Off',
                imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=1200&q=80',
                targetUrl: '/shop',
                bgColor: '#FEF3C7',
                textColor: '#78350F',
                btnText: 'Explore Staples',
                displayOrder: 2,
                isActive: true
            }
        ];

        for (const b of sampleBanners) {
            await Banner.findOneAndUpdate({ title: b.title }, b, { upsert: true });
            console.log(`✓ Banner: ${b.title.slice(0, 30)}...`);
        }

        // 3. Seed Sample Reviews for existing products
        const products = await Product.find().limit(3);
        const adminUser = await User.findOne({ role: 'admin' });
        if (products.length > 0 && adminUser) {
            for (const prod of products) {
                await Review.findOneAndUpdate(
                    { productId: prod._id, userId: adminUser._id },
                    {
                        productId: prod._id,
                        userId: adminUser._id,
                        userName: 'Priya Sharma',
                        rating: 5,
                        title: 'Superb quality and on-time delivery!',
                        comment: 'The packaging was immaculate and vegetables were extremely fresh and crisp. Highly recommended!',
                        verifiedPurchase: true,
                        isApproved: true
                    },
                    { upsert: true }
                );
                console.log(`✓ Review seeded for: ${prod.title.slice(0, 25)}...`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
