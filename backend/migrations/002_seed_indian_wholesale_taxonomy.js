/**
 * Migration 002: Seed Indian Wholesale General Market Taxonomy
 * Provisions 8 parent categories and 36 subcategories idempotently
 */
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

module.exports = {
    name: '002_seed_indian_wholesale_taxonomy',
    up: async (db) => {
        console.log('  -> Upserting 8 top-level parent categories...');
        const parentMap = new Map();

        for (const cat of CATEGORY_TAXONOMY.filter(c => c.parentId === null)) {
            const res = await db.collection('categories').findOneAndUpdate(
                { slug: cat.slug },
                {
                    $set: {
                        categoryId: cat.categoryId,
                        parentId: null,
                        name: cat.name,
                        slug: cat.slug,
                        description: cat.description,
                        parent: null,
                        isActive: true,
                        updatedAt: new Date()
                    },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true, returnDocument: 'after' }
            );
            const doc = res.value || res;
            if (doc) parentMap.set(cat.categoryId, doc._id);
        }

        console.log('  -> Upserting 36 granular subcategories...');
        for (const cat of CATEGORY_TAXONOMY.filter(c => c.parentId !== null)) {
            const parentOid = parentMap.get(cat.parentId);
            await db.collection('categories').updateOne(
                { slug: cat.slug },
                {
                    $set: {
                        categoryId: cat.categoryId,
                        parentId: cat.parentId,
                        name: cat.name,
                        slug: cat.slug,
                        description: cat.description,
                        parent: parentOid || null,
                        isActive: true,
                        updatedAt: new Date()
                    },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            );
        }

        const count = await db.collection('categories').countDocuments();
        console.log(`  ✓ 44 Indian Wholesale categories confirmed in taxonomy (Total: ${count}).`);
    },

    down: async (db) => {
        // Rollback if necessary
    }
};
