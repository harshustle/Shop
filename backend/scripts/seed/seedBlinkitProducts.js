const mongoose = require('mongoose');
const Category = require('../../models/catalog/Category');
const Product = require('../../models/catalog/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BLINKIT_PRODUCTS = [
  {
    title: 'Amul Taaza Toned Fresh Milk',
    slug: 'amul-taaza-toned-fresh-milk',
    description: 'Fresh pasteurized homogenized toned milk with 3.0% fat and 8.5% SNF. Wholesome nutrition for everyday chai, coffee, and family health.',
    brand: 'Amul',
    basePrice: 28.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'AMUL-TZ-500ML', barcode: '8901262010052', price: 28.00, compareAtPrice: 30.00, stockQuantity: 150, safetyStock: 10, attributes: { size: '500 ml' } },
      { sku: 'AMUL-TZ-1L', barcode: '8901262010106', price: 56.00, compareAtPrice: 60.00, stockQuantity: 100, safetyStock: 10, attributes: { size: '1 Litre' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', altText: 'Amul Taaza Milk', isPrimary: true }]
  },
  {
    title: 'Amul Pasteurized Table Butter',
    slug: 'amul-pasteurized-table-butter',
    description: 'Utterly butterly delicious Amul Butter made from pure fresh cream. Perfect accompaniment for hot parathas, toast, and baking.',
    brand: 'Amul',
    basePrice: 58.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'AMUL-BTR-100G', barcode: '8901262020013', price: 58.00, compareAtPrice: 60.00, stockQuantity: 120, safetyStock: 10, attributes: { weight: '100 g' } },
      { sku: 'AMUL-BTR-500G', barcode: '8901262020051', price: 275.00, compareAtPrice: 285.00, stockQuantity: 60, safetyStock: 5, attributes: { weight: '500 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80', altText: 'Amul Butter', isPrimary: true }]
  },
  {
    title: 'Mother Dairy Classic Dahi / Curd',
    slug: 'mother-dairy-classic-dahi',
    description: 'Thick, creamy, and naturally set curd packed with probiotics for optimal digestion and wholesome nutrition.',
    brand: 'Mother Dairy',
    basePrice: 35.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'MD-DAHI-400G', barcode: '8901648001042', price: 35.00, compareAtPrice: 38.00, stockQuantity: 90, safetyStock: 10, attributes: { weight: '400 g Cup' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', altText: 'Mother Dairy Dahi', isPrimary: true }]
  },
  {
    title: 'Britannia Daily Fresh White Bread',
    slug: 'britannia-daily-fresh-white-bread',
    description: 'Soft, fluffy, freshly baked sandwich bread infused with essential vitamins for the perfect breakfast toast.',
    brand: 'Britannia',
    basePrice: 40.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'BRIT-BRD-400G', barcode: '8901063142205', price: 40.00, compareAtPrice: 45.00, stockQuantity: 80, safetyStock: 8, attributes: { weight: '400 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', altText: 'Britannia Bread', isPrimary: true }]
  },
  {
    title: 'Aashirvaad Shudh Chakki Whole Wheat Atta',
    slug: 'aashirvaad-shudh-chakki-whole-wheat-atta',
    description: '100% whole wheat grain ground slowly to lock in dietary fiber and essential nutrients. Rotis stay soft and fluffy for hours.',
    brand: 'Aashirvaad',
    basePrice: 235.00,
    categoryName: 'Atta, Rice & Dal',
    categorySlug: 'atta-rice-dal',
    variants: [
      { sku: 'AASH-ATTA-5KG', barcode: '8901030383723', price: 235.00, compareAtPrice: 265.00, stockQuantity: 140, safetyStock: 15, attributes: { weight: '5 kg' } },
      { sku: 'AASH-ATTA-10KG', barcode: '8901030383747', price: 445.00, compareAtPrice: 510.00, stockQuantity: 80, safetyStock: 10, attributes: { weight: '10 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', altText: 'Aashirvaad Atta', isPrimary: true }]
  },
  {
    title: 'Fortune Sunlite Refined Sunflower Oil',
    slug: 'fortune-sunlite-refined-sunflower-oil',
    description: 'Light, clear, and fortified with Vitamin A and Vitamin D. Easy to digest and suitable for all everyday deep frying and sautéing.',
    brand: 'Fortune',
    basePrice: 138.00,
    categoryName: 'Oil & Ghee',
    categorySlug: 'oil-ghee',
    variants: [
      { sku: 'FORT-SUN-1L', barcode: '8906007281081', price: 138.00, compareAtPrice: 165.00, stockQuantity: 200, safetyStock: 20, attributes: { size: '1 Litre Pouch' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', altText: 'Fortune Sunflower Oil', isPrimary: true }]
  },
  {
    title: 'Fortune Kachi Ghani Pure Mustard Oil',
    slug: 'fortune-kachi-ghani-pure-mustard-oil-bottle',
    description: 'Cold pressed traditionally extracted pure mustard oil with strong authentic aroma and natural pungent zing.',
    brand: 'Fortune',
    basePrice: 146.00,
    categoryName: 'Oil & Ghee',
    categorySlug: 'oil-ghee',
    variants: [
      { sku: 'FORT-MST-1L', barcode: '8906007281012', price: 146.00, compareAtPrice: 175.00, stockQuantity: 180, safetyStock: 15, attributes: { size: '1 Litre' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', altText: 'Fortune Mustard Oil', isPrimary: true }]
  },
  {
    title: 'Tata Salt Vacuum Evaporated Iodised Salt',
    slug: 'tata-salt-vacuum-evaporated-iodised',
    description: 'Desh Ka Namak. Pure vacuum evaporated iodised salt with guaranteed purity and accurate iodine content.',
    brand: 'Tata',
    basePrice: 28.00,
    categoryName: 'Masalas & Spices',
    categorySlug: 'masalas-spices',
    variants: [
      { sku: 'TATA-SALT-1KG', barcode: '8901052000011', price: 28.00, compareAtPrice: 30.00, stockQuantity: 300, safetyStock: 30, attributes: { weight: '1 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80', altText: 'Tata Salt', isPrimary: true }]
  },
  {
    title: 'Daawat Rozana Super Basmati Rice',
    slug: 'daawat-rozana-super-basmati-rice',
    description: 'Aromatic long grain basmati rice aged to perfection. Non-sticky fluffy grains ideal for everyday biryani, pulao, and jeera rice.',
    brand: 'Daawat',
    basePrice: 395.00,
    categoryName: 'Atta, Rice & Dal',
    categorySlug: 'atta-rice-dal',
    variants: [
      { sku: 'DAAW-ROZ-5KG', barcode: '8901537001015', price: 395.00, compareAtPrice: 475.00, stockQuantity: 95, safetyStock: 10, attributes: { weight: '5 kg Bag' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', altText: 'Daawat Basmati Rice', isPrimary: true }]
  },
  {
    title: 'Tata Sampann Unpolished Toor Dal',
    slug: 'tata-sampann-unpolished-toor-dal',
    description: '100% unpolished yellow arhar / toor dal rich in natural dietary protein without artificial coloring or polish.',
    brand: 'Tata Sampann',
    basePrice: 168.00,
    categoryName: 'Atta, Rice & Dal',
    categorySlug: 'atta-rice-dal',
    variants: [
      { sku: 'TATA-TOOR-1KG', barcode: '8901052021023', price: 168.00, compareAtPrice: 195.00, stockQuantity: 110, safetyStock: 10, attributes: { weight: '1 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', altText: 'Tata Toor Dal', isPrimary: true }]
  },
  {
    title: 'Maggi 2-Minute Masala Instant Noodles',
    slug: 'maggi-2-minute-masala-instant-noodles',
    description: 'Indias most beloved instant noodles with the signature aromatic Tastemaker spice blend and goodness of iron.',
    brand: 'Nestle Maggi',
    basePrice: 56.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'MAGGI-4PK-280G', barcode: '8901058852379', price: 56.00, compareAtPrice: 60.00, stockQuantity: 250, safetyStock: 25, attributes: { pack: '4-Pack (280 g)' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80', altText: 'Maggi Noodles', isPrimary: true }]
  },
  {
    title: "Lay's India's Magic Masala Potato Chips",
    slug: 'lays-indias-magic-masala-potato-chips',
    description: 'Crispy wafer-thin potato chips generously dusted with spicy tangy North Indian magic masala spices.',
    brand: "Lay's",
    basePrice: 20.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'LAYS-MASALA-50G', barcode: '8901491101838', price: 20.00, compareAtPrice: 20.00, stockQuantity: 300, safetyStock: 30, attributes: { weight: '50 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80', altText: 'Lays Chips', isPrimary: true }]
  },
  {
    title: "Haldiram's Nagpur Aloo Bhujia Namkeen",
    slug: 'haldirams-nagpur-aloo-bhujia-namkeen',
    description: 'Crisp golden potato and chickpea flour strands tossed in traditional minty red chilli seasoning.',
    brand: "Haldiram's",
    basePrice: 110.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'HALD-BHUJ-400G', barcode: '8904063200109', price: 110.00, compareAtPrice: 125.00, stockQuantity: 150, safetyStock: 15, attributes: { weight: '400 g Pouch' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80', altText: 'Haldirams Bhujia', isPrimary: true }]
  },
  {
    title: 'Coca-Cola Original Taste Can',
    slug: 'coca-cola-original-taste-can',
    description: 'Crisp, sparkling, and refreshing fizzy soft drink served ice cold to uplift any party or lunch.',
    brand: 'Coca-Cola',
    basePrice: 40.00,
    categoryName: 'Cold Drinks & Juices',
    categorySlug: 'cold-drinks-juices',
    variants: [
      { sku: 'COKE-CAN-300ML', barcode: '8901764012217', price: 40.00, compareAtPrice: 40.00, stockQuantity: 200, safetyStock: 20, attributes: { size: '300 ml Can' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80', altText: 'Coca Cola Can', isPrimary: true }]
  },
  {
    title: 'Thums Up Charged Soft Drink Can',
    slug: 'thums-up-charged-soft-drink-can',
    description: 'Taste the Thunder. Strong carbonated cola beverage with an intense spicy kick and high fizz.',
    brand: 'Thums Up',
    basePrice: 40.00,
    categoryName: 'Cold Drinks & Juices',
    categorySlug: 'cold-drinks-juices',
    variants: [
      { sku: 'THUMS-CAN-300ML', barcode: '8901764022216', price: 40.00, compareAtPrice: 40.00, stockQuantity: 180, safetyStock: 20, attributes: { size: '300 ml Can' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80', altText: 'Thums Up Can', isPrimary: true }]
  },
  {
    title: 'Real Fruit Power Mixed Fruit Juice',
    slug: 'real-fruit-power-mixed-fruit-juice',
    description: 'Rich blend of 9 handpicked fruits packed with natural Vitamin C. Zero added preservatives.',
    brand: 'Real',
    basePrice: 125.00,
    categoryName: 'Cold Drinks & Juices',
    categorySlug: 'cold-drinks-juices',
    variants: [
      { sku: 'REAL-MIX-1L', barcode: '8901207010017', price: 125.00, compareAtPrice: 140.00, stockQuantity: 120, safetyStock: 12, attributes: { size: '1 Litre Tetra' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', altText: 'Real Mixed Fruit Juice', isPrimary: true }]
  },
  {
    title: 'Fresh Farm Red Onion (Pyaaz)',
    slug: 'fresh-farm-red-onion-1kg',
    description: 'Freshly harvested dry pinkish-red onions. Crisp and punchy, essential base for every Indian curry and gravy.',
    brand: 'fresh',
    basePrice: 38.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'VEG-ONION-1KG', barcode: '9901001001010', price: 38.00, compareAtPrice: 45.00, stockQuantity: 200, safetyStock: 25, attributes: { weight: '1 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80', altText: 'Fresh Red Onion', isPrimary: true }]
  },
  {
    title: 'Fresh Farm Hybrid Potato (Aloo)',
    slug: 'fresh-farm-hybrid-potato-1kg',
    description: 'Firm, uniform size golden skin potatoes. Zero sproutings, excellent for curries, boiling, and deep frying.',
    brand: 'fresh',
    basePrice: 32.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'VEG-POTATO-1KG', barcode: '9901001001027', price: 32.00, compareAtPrice: 38.00, stockQuantity: 250, safetyStock: 30, attributes: { weight: '1 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80', altText: 'Fresh Farm Potatoes', isPrimary: true }]
  },
  {
    title: 'Fresh Hybrid Tomato (Tamatar)',
    slug: 'fresh-hybrid-tomato-1kg',
    description: 'Plump, firm, and tangy red tomatoes bursting with juicy freshness and Vitamin C.',
    brand: 'fresh',
    basePrice: 42.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'VEG-TOMATO-1KG', barcode: '9901001001034', price: 42.00, compareAtPrice: 50.00, stockQuantity: 180, safetyStock: 20, attributes: { weight: '1 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80', altText: 'Fresh Tomato', isPrimary: true }]
  },
  {
    title: 'Cadbury Dairy Milk Silk Chocolate',
    slug: 'cadbury-dairy-milk-silk-chocolate',
    description: 'Impossibly smooth, velvety milk chocolate that melts seamlessly on your tongue. The ultimate sweet treat.',
    brand: 'Cadbury',
    basePrice: 175.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'CAD-SILK-150G', barcode: '8901233020015', price: 175.00, compareAtPrice: 190.00, stockQuantity: 140, safetyStock: 15, attributes: { weight: '150 g Bar' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=600&q=80', altText: 'Dairy Milk Silk', isPrimary: true }]
  },
  {
    title: 'Nescafe Classic Instant Coffee Jar',
    slug: 'nescafe-classic-instant-coffee-jar',
    description: '100% pure roasted coffee beans delivering an unmistakable bold aroma and rich morning energy kick.',
    brand: 'Nescafe',
    basePrice: 315.00,
    categoryName: 'Tea, Coffee & More',
    categorySlug: 'tea-coffee-more',
    variants: [
      { sku: 'NES-COF-100G', barcode: '8901058863016', price: 315.00, compareAtPrice: 350.00, stockQuantity: 80, safetyStock: 10, attributes: { weight: '100 g Glass Jar' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', altText: 'Nescafe Coffee', isPrimary: true }]
  },
  {
    title: 'Brooke Bond Red Label Tea Pouch',
    slug: 'brooke-bond-red-label-tea-pouch',
    description: 'Infused with swad apnepan ka. High quality CTC black tea leaves with rich red color and inviting aroma.',
    brand: 'Brooke Bond',
    basePrice: 260.00,
    categoryName: 'Tea, Coffee & More',
    categorySlug: 'tea-coffee-more',
    variants: [
      { sku: 'BB-RED-500G', barcode: '8901030381019', price: 260.00, compareAtPrice: 290.00, stockQuantity: 120, safetyStock: 15, attributes: { weight: '500 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', altText: 'Red Label Tea', isPrimary: true }]
  },
  {
    title: 'Surf Excel Matic Front & Top Liquid Detergent',
    slug: 'surf-excel-matic-liquid-detergent',
    description: 'Advanced liquid formula with powerful stain removal technology that leaves clothes fragrant and bright.',
    brand: 'Surf Excel',
    basePrice: 228.00,
    categoryName: 'Cleaning & Household',
    categorySlug: 'cleaning-household',
    variants: [
      { sku: 'SURF-LIQ-1L', barcode: '8901030821010', price: 228.00, compareAtPrice: 260.00, stockQuantity: 90, safetyStock: 10, attributes: { size: '1 Litre Pouch' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', altText: 'Surf Excel Matic', isPrimary: true }]
  },
  {
    title: 'Dettol Original Liquid Handwash Refill',
    slug: 'dettol-original-liquid-handwash-refill',
    description: '100% better germ protection with trusted Dettol pine fragrance and moisturizing skincare formula.',
    brand: 'Dettol',
    basePrice: 99.00,
    categoryName: 'Cleaning & Household',
    categorySlug: 'cleaning-household',
    variants: [
      { sku: 'DET-HW-675ML', barcode: '8901396388019', price: 99.00, compareAtPrice: 119.00, stockQuantity: 160, safetyStock: 20, attributes: { size: '675 ml Pouch' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80', altText: 'Dettol Handwash', isPrimary: true }]
  },
  {
    title: 'Vim Lemon Dishwash Liquid Gel',
    slug: 'vim-lemon-dishwash-liquid-gel',
    description: 'Power of 100 lemons. 1 spoon of Vim gel removes tough grease from an entire sink full of dishes.',
    brand: 'Vim',
    basePrice: 155.00,
    categoryName: 'Cleaning & Household',
    categorySlug: 'cleaning-household',
    variants: [
      { sku: 'VIM-GEL-750ML', barcode: '8901030882103', price: 155.00, compareAtPrice: 180.00, stockQuantity: 130, safetyStock: 15, attributes: { size: '750 ml Bottle' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', altText: 'Vim Gel', isPrimary: true }]
  }
];

async function seedBlinkitCatalog() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Seeding real Blinkit catalog items...');

    for (const item of BLINKIT_PRODUCTS) {
      await Product.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: {
            title: item.title,
            slug: item.slug,
            description: item.description,
            brand: item.brand,
            basePrice: item.basePrice,
            categoryName: item.categoryName,
            categorySlug: item.categorySlug,
            isPublished: true,
            variants: item.variants,
            images: item.images
          }
        },
        { upsert: true, new: true }
      );
      console.log(`✓ Seeded Blinkit item: ${item.title} (₹${item.basePrice})`);
    }

    const total = await Product.countDocuments();
    console.log(`\n🎉 Successfully populated real Blinkit products! Total in DB: ${total}`);
  } catch (err) {
    console.error('Blinkit seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedBlinkitCatalog();
