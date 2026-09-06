const safeCreateIndex = async (col, spec, options = {}) => {
    try {
        await col.createIndex(spec, options);
    } catch (err) {
        if (err.codeName === 'IndexOptionsConflict' || err.code === 85) {
            // Drop existing index and recreate with updated options if needed
            const indexName = options.name || Object.keys(spec).map(k => `${k}_${spec[k]}`).join('_');
            try {
                await col.dropIndex(indexName);
                await col.createIndex(spec, options);
            } catch (dropErr) {
                console.warn(`    Index ${indexName} preserved as-is.`);
            }
        } else {
            console.warn(`    Index notice: ${err.message}`);
        }
    }
};

module.exports = {
    name: '001_create_core_indexes',
    up: async (db) => {
        console.log('  -> Building indexes for users collection...');
        await safeCreateIndex(db.collection('users'), { phone: 1 }, { unique: true });
        await safeCreateIndex(db.collection('users'), { email: 1 }, { unique: true, sparse: true });
        await safeCreateIndex(db.collection('users'), { role: 1 });
        await safeCreateIndex(db.collection('users'), { createdAt: -1 });

        console.log('  -> Building indexes for categories collection...');
        await safeCreateIndex(db.collection('categories'), { slug: 1 }, { unique: true });
        await safeCreateIndex(db.collection('categories'), { categoryId: 1 }, { sparse: true });
        await safeCreateIndex(db.collection('categories'), { parentId: 1 });
        await safeCreateIndex(db.collection('categories'), { parent: 1 });

        console.log('  -> Building indexes for products collection...');
        await safeCreateIndex(db.collection('products'), { slug: 1 }, { unique: true });
        await safeCreateIndex(db.collection('products'), { category: 1 });
        await safeCreateIndex(db.collection('products'), { brand: 1 });
        await safeCreateIndex(db.collection('products'), { isPublished: 1 });
        await safeCreateIndex(db.collection('products'), { "variants.sku": 1 });
        await safeCreateIndex(db.collection('products'), { "variants.price": 1 });
        await safeCreateIndex(
            db.collection('products'),
            { title: 'text', description: 'text', brand: 'text' },
            { name: 'product_text_search', weights: { title: 10, brand: 5, description: 1 } }
        );

        console.log('  -> Building indexes for carts collection (30-day TTL)...');
        await safeCreateIndex(db.collection('carts'), { sessionToken: 1 }, { unique: true });
        await safeCreateIndex(db.collection('carts'), { userId: 1 });
        await safeCreateIndex(db.collection('carts'), { expiresAt: 1 }, { expireAfterSeconds: 0 });

        console.log('  -> Building indexes for stockholds collection (15-min TTL)...');
        await safeCreateIndex(db.collection('stockholds'), { variantId: 1 });
        await safeCreateIndex(db.collection('stockholds'), { sessionOrUserId: 1 });
        await safeCreateIndex(db.collection('stockholds'), { expiresAt: 1 }, { expireAfterSeconds: 0 });

        console.log('  -> Building indexes for orders collection...');
        await safeCreateIndex(db.collection('orders'), { orderNumber: 1 }, { unique: true, sparse: true });
        await safeCreateIndex(db.collection('orders'), { customerId: 1 });
        await safeCreateIndex(db.collection('orders'), { phoneNumber: 1 });
        await safeCreateIndex(db.collection('orders'), { status: 1 });
        await safeCreateIndex(db.collection('orders'), { createdAt: -1 });

        console.log('  -> Building indexes for payments collection (Idempotency ledger)...');
        await safeCreateIndex(db.collection('payments'), { idempotencyKey: 1 }, { unique: true });
        await safeCreateIndex(db.collection('payments'), { gatewayTransactionId: 1 });
        await safeCreateIndex(db.collection('payments'), { orderId: 1 });

        console.log('  ✓ All 7 core collection indexes established.');
    },

    down: async (db) => {
        console.log('Dropping custom indexes...');
        // Leave _id_ intact
    }
};
