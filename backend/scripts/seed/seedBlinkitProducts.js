const mongoose = require('mongoose');
const Category = require('../../models/catalog/Category');
const Product = require('../../models/catalog/Product');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BLINKIT_PRODUCTS = [
  // =========================================================================
  // 1. DAIRY, BREAD & EGGS
  // =========================================================================
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
    title: 'Amul Gold Full Cream Fresh Milk',
    slug: 'amul-gold-full-cream-milk',
    description: 'Standardized full cream milk with 6.0% fat and 9.0% SNF. Rich, creamy and ideal for desserts, thick curd, and kheer.',
    brand: 'Amul',
    basePrice: 34.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'AMUL-GOLD-500ML', barcode: '8901262011059', price: 34.00, compareAtPrice: 36.00, stockQuantity: 130, safetyStock: 10, attributes: { size: '500 ml' } },
      { sku: 'AMUL-GOLD-1L', barcode: '8901262011103', price: 68.00, compareAtPrice: 72.00, stockQuantity: 80, safetyStock: 10, attributes: { size: '1 Litre' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80', altText: 'Amul Gold Milk', isPrimary: true }]
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
    title: 'Amul Fresh Malai Paneer',
    slug: 'amul-fresh-malai-paneer-200g',
    description: 'Soft, succulent cottage cheese made from pasteurized milk. Absorbs rich gravies for mouth-watering Shahi Paneer and Matar Paneer.',
    brand: 'Amul',
    basePrice: 92.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'AMUL-PAN-200G', barcode: '8901262030012', price: 92.00, compareAtPrice: 99.00, stockQuantity: 90, safetyStock: 10, attributes: { weight: '200 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', altText: 'Amul Paneer', isPrimary: true }]
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
    title: 'Britannia 100% Whole Wheat Brown Bread',
    slug: 'britannia-whole-wheat-brown-bread',
    description: 'Healthy and wholesome brown bread baked with whole wheat flour. Rich in dietary fiber, low in fat.',
    brand: 'Britannia',
    basePrice: 50.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'BRIT-BRWN-400G', barcode: '8901063142250', price: 50.00, compareAtPrice: 55.00, stockQuantity: 70, safetyStock: 5, attributes: { weight: '400 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80', altText: 'Brown Bread', isPrimary: true }]
  },
  {
    title: 'Amul Processed Cheese Slices',
    slug: 'amul-processed-cheese-slices-200g',
    description: 'Wholesome natural cheese slices. Melts deliciously over burgers, sandwiches, dosas, and parathas.',
    brand: 'Amul',
    basePrice: 145.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'AMUL-CHS-10SL', barcode: '8901262040011', price: 145.00, compareAtPrice: 155.00, stockQuantity: 65, safetyStock: 5, attributes: { pack: '10 Slices (200 g)' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80', altText: 'Amul Cheese Slices', isPrimary: true }]
  },
  {
    title: 'Eggoz Farm Fresh White Eggs (Pack of 6)',
    slug: 'eggoz-farm-fresh-white-eggs-6-pcs',
    description: 'Hygienically cleaned, UV sanitized and certified fresh farm eggs. Loaded with high-quality protein and essential amino acids.',
    brand: 'Eggoz',
    basePrice: 59.00,
    categoryName: 'Dairy & Bread',
    categorySlug: 'dairy-bread',
    variants: [
      { sku: 'EGGOZ-WHITE-6', barcode: '8908012345012', price: 59.00, compareAtPrice: 66.00, stockQuantity: 120, safetyStock: 15, attributes: { count: '6 Eggs Pack' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80', altText: 'Farm Eggs', isPrimary: true }]
  },

  // =========================================================================
  // 2. FRESH VEGETABLES & FRUITS
  // =========================================================================
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
    title: 'Fresh Green Chillies (Hari Mirch)',
    slug: 'fresh-green-chillies-100g',
    description: 'Spicy, crisp, and fresh dark green chillies to add that perfect fiery kick to every tadka.',
    brand: 'fresh',
    basePrice: 15.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'VEG-CHILLI-100G', barcode: '9901001001041', price: 15.00, compareAtPrice: 20.00, stockQuantity: 150, safetyStock: 15, attributes: { weight: '100 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=600&q=80', altText: 'Green Chillies', isPrimary: true }]
  },
  {
    title: 'Fresh Lemon / Nimbu (Pack of 4)',
    slug: 'fresh-lemon-nimbu-4-pcs',
    description: 'Juicy, aromatic yellow lemons rich in natural citrus acid and Vitamin C. Essential for refreshing shikanji and garnishes.',
    brand: 'fresh',
    basePrice: 25.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'VEG-LEMON-4PCS', barcode: '9901001001058', price: 25.00, compareAtPrice: 30.00, stockQuantity: 140, safetyStock: 15, attributes: { pack: '4 Lemons' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80', altText: 'Fresh Lemon', isPrimary: true }]
  },
  {
    title: 'Fresh Coriander Leaves (Dhaniya Patta)',
    slug: 'fresh-coriander-leaves-100g',
    description: 'Freshly plucked vibrant green coriander leaves with authentic refreshing aroma. Ideal for chutneys and curries.',
    brand: 'fresh',
    basePrice: 18.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'VEG-DHANIYA-100G', barcode: '9901001001065', price: 18.00, compareAtPrice: 24.00, stockQuantity: 110, safetyStock: 10, attributes: { weight: '100 g Bunch' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1589135233689-d56d78709117?auto=format&fit=crop&w=600&q=80', altText: 'Fresh Coriander', isPrimary: true }]
  },
  {
    title: 'Fresh Shimla Royal Apple (Pack of 4)',
    slug: 'fresh-shimla-royal-apple-4-pcs',
    description: 'Crisp, sweet, and juicy red apples sourced directly from Himachal orchards. Rich in dietary fiber and antioxidants.',
    brand: 'fresh',
    basePrice: 120.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'FRT-APPLE-4PCS', barcode: '9902001001011', price: 120.00, compareAtPrice: 140.00, stockQuantity: 80, safetyStock: 10, attributes: { pack: '4 Apples (~500g)' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80', altText: 'Shimla Apples', isPrimary: true }]
  },
  {
    title: 'Fresh Robusta Yellow Banana (Pack of 6)',
    slug: 'fresh-robusta-yellow-banana-6-pcs',
    description: 'Naturally ripened, sweet, and potassium-rich golden bananas. The ideal pre-workout and breakfast fruit.',
    brand: 'fresh',
    basePrice: 45.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'FRT-BANANA-6PCS', barcode: '9902001001028', price: 45.00, compareAtPrice: 55.00, stockQuantity: 110, safetyStock: 15, attributes: { pack: '6 Bananas' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80', altText: 'Yellow Bananas', isPrimary: true }]
  },
  {
    title: 'Fresh Nagpur Orange / Santra',
    slug: 'fresh-nagpur-orange-santra-1kg',
    description: 'Sweet and tangy seasonal Nagpur oranges bursting with refreshing juice and Vitamin C.',
    brand: 'fresh',
    basePrice: 85.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'FRT-ORANGE-1KG', barcode: '9902001001035', price: 85.00, compareAtPrice: 100.00, stockQuantity: 75, safetyStock: 10, attributes: { weight: '1 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80', altText: 'Nagpur Orange', isPrimary: true }]
  },
  {
    title: 'Fresh Pomegranate / Anar (Pack of 3)',
    slug: 'fresh-pomegranate-anar-3-pcs',
    description: 'Ruby-red, juicy arils with a sweet-tart burst. Packed with iron, potassium, and heart-healthy nutrients.',
    brand: 'fresh',
    basePrice: 149.00,
    categoryName: 'Vegetables & Fruits',
    categorySlug: 'vegetables-fruits',
    variants: [
      { sku: 'FRT-ANAR-3PCS', barcode: '9902001001042', price: 149.00, compareAtPrice: 175.00, stockQuantity: 60, safetyStock: 8, attributes: { pack: '3 Pcs (~600g)' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?auto=format&fit=crop&w=600&q=80', altText: 'Fresh Pomegranate', isPrimary: true }]
  },

  // =========================================================================
  // 3. ATTA, RICE, DALS & GRAINS
  // =========================================================================
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
    title: 'Fortune Chakki Fresh Whole Wheat Atta',
    slug: 'fortune-chakki-fresh-whole-wheat-atta-5kg',
    description: 'Natural stone ground traditional chakki atta. Rich in dietary fiber for light, soft, and puffy phulkas.',
    brand: 'Fortune',
    basePrice: 220.00,
    categoryName: 'Atta, Rice & Dal',
    categorySlug: 'atta-rice-dal',
    variants: [
      { sku: 'FORT-ATTA-5KG', barcode: '8906007281517', price: 220.00, compareAtPrice: 250.00, stockQuantity: 100, safetyStock: 10, attributes: { weight: '5 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', altText: 'Fortune Atta', isPrimary: true }]
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
    title: 'India Gate Basmati Rice Feast Rozzana',
    slug: 'india-gate-basmati-rice-feast-rozzana-5kg',
    description: 'Slender, aged basmati rice grains that elongate upon cooking with appetizing aroma. Perfect for daily family meals.',
    brand: 'India Gate',
    basePrice: 380.00,
    categoryName: 'Atta, Rice & Dal',
    categorySlug: 'atta-rice-dal',
    variants: [
      { sku: 'ING-ROZ-5KG', barcode: '8901537002012', price: 380.00, compareAtPrice: 440.00, stockQuantity: 85, safetyStock: 10, attributes: { weight: '5 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80', altText: 'India Gate Rice', isPrimary: true }]
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
    title: 'Tata Sampann Unpolished Moong Dal Dhuli',
    slug: 'tata-sampann-unpolished-moong-dal-1kg',
    description: 'Unpolished split yellow moong dal. Easily digestible, quick cooking, and rich in natural plant protein for everyday comfort meals.',
    brand: 'Tata Sampann',
    basePrice: 145.00,
    categoryName: 'Atta, Rice & Dal',
    categorySlug: 'atta-rice-dal',
    variants: [
      { sku: 'TATA-MOONG-1KG', barcode: '8901052021047', price: 145.00, compareAtPrice: 165.00, stockQuantity: 90, safetyStock: 10, attributes: { weight: '1 kg' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80', altText: 'Moong Dal', isPrimary: true }]
  },
  {
    title: 'Fortune Special Rajma Chitra (Red Kidney Beans)',
    slug: 'fortune-special-rajma-chitra-500g',
    description: 'Creamy, succulent Kashmiri Chitra Rajma beans that soften to perfection in thick tomato-onion gravy.',
    brand: 'Fortune',
    basePrice: 88.00,
    categoryName: 'Atta, Rice & Dal',
    categorySlug: 'atta-rice-dal',
    variants: [
      { sku: 'FORT-RAJM-500G', barcode: '8906007281609', price: 88.00, compareAtPrice: 105.00, stockQuantity: 110, safetyStock: 10, attributes: { weight: '500 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80', altText: 'Rajma Chitra', isPrimary: true }]
  },

  // =========================================================================
  // 4. EDIBLE OILS, GHEE & SPICES
  // =========================================================================
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
    title: 'Amul Pure Cow Ghee (Ceka Pack)',
    slug: 'amul-pure-cow-ghee-1l',
    description: 'Granular, aromatic pure cow ghee made from fresh cream. Enhances the flavor of dal tadka, rotis, and traditional Indian sweets.',
    brand: 'Amul',
    basePrice: 595.00,
    categoryName: 'Oil & Ghee',
    categorySlug: 'oil-ghee',
    variants: [
      { sku: 'AMUL-GHEE-1L', barcode: '8901262050010', price: 595.00, compareAtPrice: 650.00, stockQuantity: 75, safetyStock: 10, attributes: { size: '1 Litre Pack' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80', altText: 'Amul Cow Ghee', isPrimary: true }]
  },
  {
    title: 'Saffola Gold Pro Healthy Lifestyle Edible Oil',
    slug: 'saffola-gold-pro-healthy-lifestyle-oil-1l',
    description: 'Dual-seed blend of Rice Bran and Sunflower oil with antioxidant power and Pro Nutri Lock for a healthier active heart.',
    brand: 'Saffola',
    basePrice: 179.00,
    categoryName: 'Oil & Ghee',
    categorySlug: 'oil-ghee',
    variants: [
      { sku: 'SAF-GOLD-1L', barcode: '8901088011210', price: 179.00, compareAtPrice: 205.00, stockQuantity: 130, safetyStock: 12, attributes: { size: '1 Litre Pouch' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', altText: 'Saffola Gold', isPrimary: true }]
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
    title: 'Everest Turmeric Powder / Haldi',
    slug: 'everest-turmeric-powder-haldi-100g',
    description: 'Pure Salem turmeric powder ground to a fine texture with high natural curcumin content and vibrant yellow color.',
    brand: 'Everest',
    basePrice: 36.00,
    categoryName: 'Masalas & Spices',
    categorySlug: 'masalas-spices',
    variants: [
      { sku: 'EVE-HALDI-100G', barcode: '8901786101012', price: 36.00, compareAtPrice: 40.00, stockQuantity: 190, safetyStock: 15, attributes: { weight: '100 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', altText: 'Everest Haldi', isPrimary: true }]
  },
  {
    title: 'Catch Red Chilli Powder (Lal Mirch)',
    slug: 'catch-red-chilli-powder-100g',
    description: 'Low-temperature ground stemless Guntur chillies delivering intense color and fiery authentic heat.',
    brand: 'Catch',
    basePrice: 42.00,
    categoryName: 'Masalas & Spices',
    categorySlug: 'masalas-spices',
    variants: [
      { sku: 'CAT-MIRCH-100G', barcode: '8901199101014', price: 42.00, compareAtPrice: 48.00, stockQuantity: 170, safetyStock: 15, attributes: { weight: '100 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80', altText: 'Catch Red Chilli', isPrimary: true }]
  },

  // =========================================================================
  // 5. SNACKS, BISCUITS & MUNCHIES
  // =========================================================================
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
    title: "Lay's Classic Salted Potato Chips",
    slug: 'lays-classic-salted-chips-50g',
    description: 'Light, crunchy sliced potatoes sprinkled with pure salt. The timeless party snack favorite.',
    brand: "Lay's",
    basePrice: 20.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'LAYS-SALT-50G', barcode: '8901491101814', price: 20.00, compareAtPrice: 20.00, stockQuantity: 250, safetyStock: 20, attributes: { weight: '50 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80', altText: 'Lays Salted', isPrimary: true }]
  },
  {
    title: 'Kurkure Masala Munch Crispy Namkeen',
    slug: 'kurkure-masala-munch-90g',
    description: 'Tedha hai par mera hai! Crunchy collets made with rice, corn and dal tossed in chatpata Indian spices.',
    brand: 'Kurkure',
    basePrice: 20.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'KURK-MCH-90G', barcode: '8901491001015', price: 20.00, compareAtPrice: 20.00, stockQuantity: 240, safetyStock: 25, attributes: { weight: '90 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80', altText: 'Kurkure Munch', isPrimary: true }]
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
    title: 'Parle-G Original Glucose Biscuits',
    slug: 'parle-g-original-glucose-biscuits-250g',
    description: 'G Maane Genius. Iconic sweet golden baked glucose biscuits made with milk and wheat. The eternal chai companion.',
    brand: 'Parle',
    basePrice: 25.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'PARLE-G-250G', barcode: '8901719101011', price: 25.00, compareAtPrice: 25.00, stockQuantity: 300, safetyStock: 30, attributes: { weight: '250 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80', altText: 'Parle-G Biscuits', isPrimary: true }]
  },
  {
    title: 'Britannia Good Day Cashew Cookies',
    slug: 'britannia-good-day-cashew-cookies-200g',
    description: 'Buttery, rich and crumbly cookies packed with crunchy roasted cashew bits. Bring a smile to your everyday tea time.',
    brand: 'Britannia',
    basePrice: 45.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'BRIT-GD-200G', barcode: '8901063012010', price: 45.00, compareAtPrice: 50.00, stockQuantity: 210, safetyStock: 20, attributes: { weight: '200 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80', altText: 'Good Day Cookies', isPrimary: true }]
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
    title: 'Nestle KitKat 4 Finger Chocolate Bar',
    slug: 'nestle-kitkat-4-finger-chocolate-38g',
    description: 'Have a break, have a KitKat! Crisp wafer fingers covered in smooth milk chocolate.',
    brand: 'Nestle',
    basePrice: 30.00,
    categoryName: 'Snacks & Munchies',
    categorySlug: 'snacks-munchies',
    variants: [
      { sku: 'NES-KITKAT-38G', barcode: '8901058812014', price: 30.00, compareAtPrice: 30.00, stockQuantity: 220, safetyStock: 20, attributes: { weight: '38.5 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80', altText: 'KitKat Chocolate', isPrimary: true }]
  },

  // =========================================================================
  // 6. BEVERAGES, TEA & COFFEE
  // =========================================================================
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
    title: 'Sprite Lime Flavored Sparkling Soda Can',
    slug: 'sprite-lime-sparkling-soda-can-300ml',
    description: 'Clear, crisp lemon-lime flavored soft drink with no artificial colors. Pure refreshment to quench your thirst.',
    brand: 'Sprite',
    basePrice: 40.00,
    categoryName: 'Cold Drinks & Juices',
    categorySlug: 'cold-drinks-juices',
    variants: [
      { sku: 'SPRITE-300ML', barcode: '8901764032215', price: 40.00, compareAtPrice: 40.00, stockQuantity: 160, safetyStock: 15, attributes: { size: '300 ml Can' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80', altText: 'Sprite Can', isPrimary: true }]
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
    title: 'Red Bull Energy Drink Can',
    slug: 'red-bull-energy-drink-can-250ml',
    description: 'Vitalizes Body and Mind. High quality functional beverage with caffeine, taurine, and B-group vitamins.',
    brand: 'Red Bull',
    basePrice: 125.00,
    categoryName: 'Cold Drinks & Juices',
    categorySlug: 'cold-drinks-juices',
    variants: [
      { sku: 'RB-ENERGY-250ML', barcode: '9002490100070', price: 125.00, compareAtPrice: 125.00, stockQuantity: 100, safetyStock: 10, attributes: { size: '250 ml Can' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80', altText: 'Red Bull Can', isPrimary: true }]
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
    title: 'Tata Tea Gold Leaf & Dust Black Tea',
    slug: 'tata-tea-gold-leaf-dust-500g',
    description: 'Exquisite blend of fine valley CTC teas with 15% gently rolled long leaves for an irresistible aroma and taste.',
    brand: 'Tata Tea',
    basePrice: 275.00,
    categoryName: 'Tea, Coffee & More',
    categorySlug: 'tea-coffee-more',
    variants: [
      { sku: 'TATA-GOLD-500G', barcode: '8901052011024', price: 275.00, compareAtPrice: 310.00, stockQuantity: 110, safetyStock: 12, attributes: { weight: '500 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=600&q=80', altText: 'Tata Tea Gold', isPrimary: true }]
  },

  // =========================================================================
  // 7. CLEANING & HOUSEHOLD ESSENTIALS
  // =========================================================================
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
    title: 'Ariel Matic Liquid Detergent Front & Top Load',
    slug: 'ariel-matic-liquid-detergent-1l',
    description: 'Tough stain removal in 1 wash with freshness fragrance. Specially designed for high-performance washing machines.',
    brand: 'Ariel',
    basePrice: 235.00,
    categoryName: 'Cleaning & Household',
    categorySlug: 'cleaning-household',
    variants: [
      { sku: 'ARIEL-LIQ-1L', barcode: '8901030822017', price: 235.00, compareAtPrice: 270.00, stockQuantity: 80, safetyStock: 10, attributes: { size: '1 Litre' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80', altText: 'Ariel Detergent', isPrimary: true }]
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
  },
  {
    title: 'Harpic Power Plus Disinfectant Toilet Cleaner',
    slug: 'harpic-power-plus-toilet-cleaner-500ml',
    description: '10x better stain removal. Kills 99.9% of germs and destroys yellowish stains in toilet bowls.',
    brand: 'Harpic',
    basePrice: 96.00,
    categoryName: 'Cleaning & Household',
    categorySlug: 'cleaning-household',
    variants: [
      { sku: 'HARP-500ML', barcode: '8901396111013', price: 96.00, compareAtPrice: 105.00, stockQuantity: 140, safetyStock: 15, attributes: { size: '500 ml Bottle' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', altText: 'Harpic Cleaner', isPrimary: true }]
  },
  {
    title: 'Colin Glass & Surface Cleaner Spray',
    slug: 'colin-glass-surface-cleaner-spray-500ml',
    description: 'Streak-free shine on glass windows, car windscreens, table tops, and mirrors with Shine Boosters.',
    brand: 'Colin',
    basePrice: 105.00,
    categoryName: 'Cleaning & Household',
    categorySlug: 'cleaning-household',
    variants: [
      { sku: 'COLIN-500ML', barcode: '8901396121012', price: 105.00, compareAtPrice: 115.00, stockQuantity: 110, safetyStock: 10, attributes: { size: '500 ml Spray' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', altText: 'Colin Glass Cleaner', isPrimary: true }]
  },
  {
    title: 'Colgate Strong Teeth Dental Cream Toothpaste',
    slug: 'colgate-strong-teeth-toothpaste-200g',
    description: 'With Amino Shakti formula. Strengthens teeth from within by adding natural calcium.',
    brand: 'Colgate',
    basePrice: 110.00,
    categoryName: 'Cleaning & Household',
    categorySlug: 'cleaning-household',
    variants: [
      { sku: 'COLG-STR-200G', barcode: '8901314010115', price: 110.00, compareAtPrice: 125.00, stockQuantity: 180, safetyStock: 20, attributes: { weight: '200 g' } }
    ],
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80', altText: 'Colgate Toothpaste', isPrimary: true }]
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
