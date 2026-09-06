const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CATEGORY_TAXONOMY = [
    // Top-Level Parents
    { categoryId: 100, parentId: null, name: 'Staples & Grains', slug: 'staples-and-grains', description: 'Primary food commodities and grains in consumer & bulk packing' },
    { categoryId: 200, parentId: null, name: 'Packaged Foods & Snacks', slug: 'packaged-foods-snacks', description: 'Branded consumer packaged snacks, biscuits, and instant foods' },
    { categoryId: 300, parentId: null, name: 'Beverages & Drinks', slug: 'beverages-drinks', description: 'Tea, coffee, packaged juices, sodas, and health drink powders' },
    { categoryId: 400, parentId: null, name: 'Personal Care & Hygiene', slug: 'personal-care-hygiene', description: 'Everyday soaps, hair care, oral care, and baby diapers' },
    { categoryId: 500, parentId: null, name: 'Home Cleaning & Pooja', slug: 'home-cleaning-pooja', description: 'Detergents, floor cleaners, mosquito repellents, and pooja items' },
    { categoryId: 600, parentId: null, name: 'Household & Kitchenware', slug: 'household-kitchenware', description: 'Plastic buckets, kitchen steel utensils, brooms, and mop tools' },
    { categoryId: 700, parentId: null, name: 'Packaging & Disposables', slug: 'packaging-disposables', description: 'Aluminum foils, paper cups, disposable plates, and packing tape' },
    { categoryId: 800, parentId: null, name: 'Electricals & Hardware', slug: 'electricals-hardware', description: 'LED bulbs, extension cords, dry cell batteries, and utility items' },

    // Under Staples & Grains (100)
    { categoryId: 101, parentId: 100, name: 'Rice & Paddy', slug: 'rice-paddy', description: 'Basmati, Sona Masoori, Kolam, Poha, and Kurmura' },
    { categoryId: 102, parentId: 100, name: 'Atta, Flours & Sooji', slug: 'flours-atta-sooji', description: 'Wheat chakki atta, Maida, Sooji, Besan, and starch flours' },
    { categoryId: 103, parentId: 100, name: 'Dals & Pulses', slug: 'dals-pulses', description: 'Toor, Chana, Moong, Urad, Masoor, Rajma, and Chole' },
    { categoryId: 104, parentId: 100, name: 'Edible Oils & Ghee', slug: 'edible-oils-ghee', description: 'Mustard oil, refined oils, and pure desi ghee' },
    { categoryId: 105, parentId: 100, name: 'Spices & Masalas', slug: 'spices-masalas', description: 'Whole spices, ground powder spices, and blended masalas' },
    { categoryId: 106, parentId: 100, name: 'Sugar, Jaggery & Salt', slug: 'sugar-jaggery-salt', description: 'White sugar, organic jaggery blocks, iodized and sendha salt' },
    { categoryId: 107, parentId: 100, name: 'Dry Fruits & Seeds', slug: 'dry-fruits-seeds', description: 'Almonds, cashews, raisins, walnuts, and edible seeds' },

    // Under Packaged Foods & Snacks (200)
    { categoryId: 201, parentId: 200, name: 'Biscuits & Bakery', slug: 'biscuits-bakery', description: 'Sweet, salted, cream biscuits, cookies, and tea rusks' },
    { categoryId: 202, parentId: 200, name: 'Namkeen & Chips', slug: 'namkeen-chips', description: 'Bhujia, mixture, potato chips, and savory snacks' },
    { categoryId: 203, parentId: 200, name: 'Instant Noodles & Pasta', slug: 'instant-noodles-pasta', description: 'Instant noodles, vermicelli, pasta, and macaroni' },
    { categoryId: 204, parentId: 200, name: 'Sauces, Jams & Pickles', slug: 'sauces-jams-pickles', description: 'Ketchup, chili sauces, mango pickles, and fruit spreads' },
    { categoryId: 205, parentId: 200, name: 'Confectionery & Sweets', slug: 'confectionery-sweets', description: 'Chocolates, hard toffees, candies, and traditional sweets' },

    // Under Beverages & Drinks (300)
    { categoryId: 301, parentId: 300, name: 'Tea & Chai Patti', slug: 'tea-chai-patti', description: 'CTC dust tea, leaf tea, and green tea bags' },
    { categoryId: 302, parentId: 300, name: 'Coffee', slug: 'coffee', description: 'Instant coffee, filter coffee blends, and premixes' },
    { categoryId: 303, parentId: 300, name: 'Soft Drinks & Juices', slug: 'soft-drinks-juices', description: 'Cold drinks, packaged juices, and cordial syrups' },
    { categoryId: 304, parentId: 300, name: 'Health & Malt Drinks', slug: 'health-malt-drinks', description: 'Malt powders, chocolate health drinks, and energy supplements' },

    // Under Personal Care & Hygiene (400)
    { categoryId: 401, parentId: 400, name: 'Soaps & Handwash', slug: 'soaps-handwash', description: 'Bath soap bars, liquid handwashes, and sanitizers' },
    { categoryId: 402, parentId: 400, name: 'Hair Care', slug: 'hair-care', description: 'Hair oils, daily shampoos, and conditioners' },
    { categoryId: 403, parentId: 400, name: 'Oral Hygiene', slug: 'oral-hygiene', description: 'Toothpastes, toothbrushes, and oral care products' },
    { categoryId: 404, parentId: 400, name: 'Shaving & Men\'s Care', slug: 'shaving-mens-care', description: 'Blades, disposable razors, and shaving creams' },
    { categoryId: 405, parentId: 400, name: 'Sanitary & Baby Care', slug: 'sanitary-baby-care', description: 'Sanitary napkins, baby diapers, and baby wipes' },

    // Under Home Cleaning & Pooja (500)
    { categoryId: 501, parentId: 500, name: 'Laundry Detergents', slug: 'laundry-detergents', description: 'Washing powders, detergent bars, and liquid wash' },
    { categoryId: 502, parentId: 500, name: 'Dishwashing Supplies', slug: 'dishwashing-supplies', description: 'Dish soap bars, liquids, and scrubbing pads' },
    { categoryId: 503, parentId: 500, name: 'Surface Cleaners', slug: 'surface-cleaners', description: 'Floor cleaners, phenyl, toilet cleaners, and glass sprays' },
    { categoryId: 504, parentId: 500, name: 'Pest Repellents', slug: 'pest-repellents', description: 'Mosquito coils, vaporizers, insect sprays, and chalks' },
    { categoryId: 505, parentId: 500, name: 'Pooja Essentials', slug: 'pooja-essentials', description: 'Agarbatti, dhoop batti, camphor tablets, and cotton wicks' },

    // Under Household & Kitchenware (600)
    { categoryId: 601, parentId: 600, name: 'Plastic Houseware', slug: 'plastic-houseware', description: 'Buckets, storage containers, dustbins, and mugs' },
    { categoryId: 602, parentId: 600, name: 'Cookware & Steel Utensils', slug: 'cookware-steel-utensils', description: 'Stainless steel dinnerware, cookers, and fry pans' },
    { categoryId: 603, parentId: 600, name: 'Cleaning Implements', slug: 'cleaning-implements', description: 'Brooms, mops, floor wipers, and dusting cloths' },

    // Under Packaging & Disposables (700)
    { categoryId: 701, parentId: 700, name: 'Foils & Paper Wraps', slug: 'foils-paper-wraps', description: 'Aluminum foils, cling films, and baking papers' },
    { categoryId: 702, parentId: 700, name: 'Disposable Dining', slug: 'disposable-dining', description: 'Paper cups, plastic plates, bowls, and wooden forks' },
    { categoryId: 703, parentId: 700, name: 'Bags & Packaging Materials', slug: 'bags-packaging-materials', description: 'Packaging tapes, poly carry bags, and shipping cartons' },

    // Under Electricals & Hardware (800)
    { categoryId: 801, parentId: 800, name: 'Lighting & Torches', slug: 'lighting-torches', description: 'LED bulbs, night lights, emergency lights, and torches' },
    { categoryId: 802, parentId: 800, name: 'Plugs, Cables & Sockets', slug: 'plugs-cables-sockets', description: '2-pin/3-pin plugs, extension strips, and multi-plugs' },
    { categoryId: 803, parentId: 800, name: 'Dry Cell Batteries', slug: 'batteries', description: 'AA, AAA, and 9V transistor batteries' }
];

const SAMPLE_KIRANA_PRODUCTS = [
    {
        title: 'Fortune Premium Kachi Ghani Pure Mustard Oil',
        slug: 'fortune-kachi-ghani-mustard-oil',
        description: 'Naturally pungent, cold pressed pure mustard oil rich in Omega-3 and natural antioxidants. Essential for North & East Indian cooking.',
        brand: 'Fortune',
        basePrice: 145.00,
        categorySlug: 'edible-oils-ghee',
        variants: [
            { sku: 'FORT-OIL-1L', barcode: '8906007281012', price: 145.00, compareAtPrice: 170.00, stockQuantity: 250, safetyStock: 20, attributes: { size: '1 Litre Pouch' } },
            { sku: 'FORT-OIL-5L', barcode: '8906007281050', price: 720.00, compareAtPrice: 850.00, stockQuantity: 80, safetyStock: 10, attributes: { size: '5 Litre Jar' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', altText: 'Fortune Mustard Oil', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Aashirvaad Shudh Chakki Fresh Whole Wheat Atta',
        slug: 'aashirvaad-shudh-chakki-atta',
        description: '100% pure whole wheat grain flour with 0% maida. Provides soft and fluffy rotis with high dietary fiber.',
        brand: 'Aashirvaad',
        basePrice: 225.00,
        categorySlug: 'flours-atta-sooji',
        variants: [
            { sku: 'AASH-ATTA-5KG', barcode: '8901030383723', price: 225.00, compareAtPrice: 260.00, stockQuantity: 150, safetyStock: 15, attributes: { weight: '5 kg Bag' } },
            { sku: 'AASH-ATTA-10KG', barcode: '8901030383747', price: 435.00, compareAtPrice: 499.00, stockQuantity: 90, safetyStock: 10, attributes: { weight: '10 kg Bag' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', altText: 'Aashirvaad Atta', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'India Gate Feast Rozzana Basmati Rice',
        slug: 'india-gate-rozzana-basmati-rice',
        description: 'Aromatic long slender grain basmati rice ideal for daily pulao, biryani, and steamed rice.',
        brand: 'India Gate',
        basePrice: 380.00,
        categorySlug: 'rice-paddy',
        variants: [
            { sku: 'IG-RICE-5KG', barcode: '8901777102034', price: 380.00, compareAtPrice: 450.00, stockQuantity: 120, safetyStock: 15, attributes: { weight: '5 kg Pack' } },
            { sku: 'IG-RICE-25KG', barcode: '8901777102058', price: 1750.00, compareAtPrice: 2100.00, stockQuantity: 30, safetyStock: 5, attributes: { weight: '25 kg Wholesale Sack' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', altText: 'India Gate Basmati Rice', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Tata Tea Premium Desh Ki Chai',
        slug: 'tata-tea-premium',
        description: 'Carefully blended combination of gentle aroma and strong taste from fine Assam tea leaves.',
        brand: 'Tata Tea',
        basePrice: 140.00,
        categorySlug: 'tea-chai-patti',
        variants: [
            { sku: 'TATA-TEA-250G', barcode: '8901052002343', price: 140.00, compareAtPrice: 160.00, stockQuantity: 300, safetyStock: 30, attributes: { size: '250g Pack' } },
            { sku: 'TATA-TEA-1KG', barcode: '8901052002367', price: 495.00, compareAtPrice: 560.00, stockQuantity: 100, safetyStock: 15, attributes: { size: '1 kg Saver Pack' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', altText: 'Tata Tea', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Haldiram\'s Nagpur Aloo Bhujia & Namkeen',
        slug: 'haldirams-nagpur-aloo-bhujia',
        description: 'Crisp spicy potato noodles with a dash of mint and lemon. India\'s favorite teatime savory snack.',
        brand: 'Haldiram\'s',
        basePrice: 55.00,
        categorySlug: 'namkeen-chips',
        variants: [
            { sku: 'HALD-BHUJ-200G', barcode: '8904063200121', price: 55.00, compareAtPrice: 60.00, stockQuantity: 400, safetyStock: 40, attributes: { size: '200g Pouch' } },
            { sku: 'HALD-BHUJ-1KG', barcode: '8904063200152', price: 230.00, compareAtPrice: 260.00, stockQuantity: 140, safetyStock: 20, attributes: { size: '1 kg Family Pouch' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=600&q=80', altText: 'Aloo Bhujia', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Maggi 2-Minute Masala Instant Noodles',
        slug: 'maggi-2-minute-masala-noodles',
        description: 'Classic taste made with choice spices and roasted herbs. Quick ready-in-2-minutes comfort food.',
        brand: 'Nestlé',
        basePrice: 14.00,
        categorySlug: 'instant-noodles-pasta',
        variants: [
            { sku: 'MAGG-SING-70G', barcode: '8901058852386', price: 14.00, compareAtPrice: 14.00, stockQuantity: 500, safetyStock: 50, attributes: { pack: 'Single Pack (70g)' } },
            { sku: 'MAGG-PACK-12', barcode: '8901058852423', price: 155.00, compareAtPrice: 168.00, stockQuantity: 120, safetyStock: 15, attributes: { pack: '12-in-1 Value Pack' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80', altText: 'Maggi Noodles', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Surf Excel Quick Wash Detergent Powder',
        slug: 'surf-excel-quick-wash-powder',
        description: 'Removes tough stains easily with X-tra clean particles. Superior formulation suitable for hand & machine wash.',
        brand: 'Surf Excel',
        basePrice: 135.00,
        categorySlug: 'laundry-detergents',
        variants: [
            { sku: 'SURF-POW-1KG', barcode: '8901030704405', price: 135.00, compareAtPrice: 150.00, stockQuantity: 200, safetyStock: 25, attributes: { size: '1 kg Box' } },
            { sku: 'SURF-POW-4KG', barcode: '8901030704450', price: 495.00, compareAtPrice: 580.00, stockQuantity: 75, safetyStock: 10, attributes: { size: '4 kg Saver Bucket' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80', altText: 'Surf Excel Powder', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Dettol Original Germ Protection Bathing Soap',
        slug: 'dettol-original-bath-soap',
        description: 'Be 100% sure with 99.9% protection from illness-causing germs. Trusted antibacterial bar for family hygiene.',
        brand: 'Dettol',
        basePrice: 145.00,
        categorySlug: 'soaps-handwash',
        variants: [
            { sku: 'DETT-SOAP-4X', barcode: '8901396388421', price: 145.00, compareAtPrice: 170.00, stockQuantity: 180, safetyStock: 20, attributes: { pack: 'Pack of 4 (125g each)' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1607006314180-302324908076?auto=format&fit=crop&w=600&q=80', altText: 'Dettol Soap', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Cycle Pure Agarbatti Lia Incense Sticks & Pure Camphor',
        slug: 'cycle-pure-agarbatti-lia',
        description: 'Natural soothing fragrance crafted with pure natural extracts for daily pooja, prayers, and meditation.',
        brand: 'Cycle Pure',
        basePrice: 65.00,
        categorySlug: 'pooja-essentials',
        variants: [
            { sku: 'CYCL-AGAR-120', barcode: '8901298012015', price: 65.00, compareAtPrice: 75.00, stockQuantity: 240, safetyStock: 25, attributes: { pack: '120 Sticks Pack' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80', altText: 'Cycle Pure Agarbatti', displayOrder: 0, isPrimary: true }]
    },
    {
        title: 'Philips 9W Crystal White Cool Day Light LED Bulb',
        slug: 'philips-9w-crystal-white-led-bulb',
        description: 'B22 base energy-saving LED lamp with up to 15 years lifespan. Glare-free illumination for homes and shops.',
        brand: 'Philips',
        basePrice: 95.00,
        categorySlug: 'lighting-torches',
        variants: [
            { sku: 'PHIL-LED-9W-1', barcode: '8718696821213', price: 95.00, compareAtPrice: 140.00, stockQuantity: 350, safetyStock: 30, attributes: { pack: 'Single Pack' } },
            { sku: 'PHIL-LED-9W-4', barcode: '8718696821244', price: 340.00, compareAtPrice: 480.00, stockQuantity: 90, safetyStock: 15, attributes: { pack: 'Pack of 4 Saver' } }
        ],
        images: [{ imageUrl: 'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80', altText: 'Philips LED Bulb', displayOrder: 0, isPrimary: true }]
    }
];

async function seedTaxonomy() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';
        console.log(`Connecting to MongoDB at: ${uri}`);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
        console.log('MongoDB Connected.');

        // 1. Seed Categories
        console.log('Seeding Indian Wholesale General Market Taxonomy...');
        const categoryMap = new Map();

        // Pass 1: Upsert top-level parents
        for (const cat of CATEGORY_TAXONOMY.filter(c => c.parentId === null)) {
            const savedCat = await Category.findOneAndUpdate(
                { slug: cat.slug },
                {
                    categoryId: cat.categoryId,
                    parentId: null,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    parent: null,
                    isActive: true
                },
                { upsert: true, new: true }
            );
            categoryMap.set(cat.categoryId, savedCat);
            console.log(`✓ Parent: [${cat.categoryId}] ${cat.name} (${cat.slug})`);
        }

        // Pass 2: Upsert subcategories with parent reference
        for (const cat of CATEGORY_TAXONOMY.filter(c => c.parentId !== null)) {
            const parentDoc = categoryMap.get(cat.parentId);
            const savedCat = await Category.findOneAndUpdate(
                { slug: cat.slug },
                {
                    categoryId: cat.categoryId,
                    parentId: cat.parentId,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    parent: parentDoc ? parentDoc._id : null,
                    isActive: true
                },
                { upsert: true, new: true }
            );
            categoryMap.set(cat.categoryId, savedCat);
            console.log(`  ✓ Sub: [${cat.categoryId}] ${cat.name} -> Parent [${cat.parentId}]`);
        }

        // 2. Seed Realistic Products
        console.log('\nSeeding authentic Indian Kirana & Wholesale Catalog items...');
        for (const prodData of SAMPLE_KIRANA_PRODUCTS) {
            const cat = await Category.findOne({ slug: prodData.categorySlug });
            const catId = cat ? cat._id : null;
            const catName = cat ? cat.name : 'General';

            await Product.findOneAndUpdate(
                { slug: prodData.slug },
                {
                    title: prodData.title,
                    slug: prodData.slug,
                    description: prodData.description,
                    brand: prodData.brand,
                    basePrice: prodData.basePrice,
                    category: catId,
                    categoryName: catName,
                    isPublished: true,
                    variants: prodData.variants.map(v => ({
                        sku: v.sku,
                        barcode: v.barcode,
                        price: v.price,
                        compareAtPrice: v.compareAtPrice,
                        stockQuantity: v.stockQuantity,
                        safetyStock: v.safetyStock,
                        attributes: v.attributes,
                        isActive: true
                    })),
                    images: prodData.images
                },
                { upsert: true, new: true }
            );
            console.log(`✓ Product: ${prodData.title} (${prodData.variants.length} variants)`);
        }

        const totalCats = await Category.countDocuments();
        const totalProds = await Product.countDocuments();
        console.log(`\nTaxonomy & Catalog successfully updated! Total Categories: ${totalCats}, Total Products: ${totalProds}`);
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedTaxonomy();
