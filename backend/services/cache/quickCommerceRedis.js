/**
 * Enterprise Quick-Commerce Redis Engine
 * Implements 50 specialized operational patterns for 10-minute delivery, flash sales,
 * warehouse fulfillment, rider logistics, and high-concurrency platform security.
 * Includes native ioredis commands with zero-downtime in-memory fallback emulation.
 */
const turf = require('@turf/turf');

const DARK_STORE_HUB = {
    id: 'hub_gomti_nagar_01',
    name: 'FreshCart Central Dark Store #1',
    address: 'Vibhuti Khand, Gomti Nagar, Lucknow, UP - 226010',
    lat: 26.8500,
    lng: 80.9490,
    deliveryRadiusKm: 5.0,
    estimatedDeliveryMinutes: 12
};

class QuickCommerceRedis {
    constructor() {
        let rawUrl = process.env.REDIS_URL ? process.env.REDIS_URL.trim() : null;
        if (rawUrl && rawUrl.includes('-u ')) {
            const hasTls = rawUrl.includes('--tls');
            rawUrl = rawUrl.split('-u ').pop().trim();
            if (hasTls && rawUrl.startsWith('redis://')) {
                rawUrl = rawUrl.replace('redis://', 'rediss://');
            }
        }
        this.redisUrl = rawUrl;
        this.client = null;
        this.isConnected = false;

        // In-memory data structures for seamless fallback/standalone dev execution
        this.memoryStore = new Map();
        this.memorySets = new Map();
        this.memorySortedSets = new Map();
        this.memoryLists = new Map();
        this.memoryHashes = new Map();
        this.memorySubscribers = new Map();
        this.timers = new Map();

        this.init();
    }

    async init() {
        if (this.redisUrl) {
            try {
                const Redis = require('ioredis');
                const isTls = this.redisUrl.startsWith('rediss://');
                this.client = new Redis(this.redisUrl, {
                    maxRetriesPerRequest: 3,
                    connectTimeout: 10000,
                    keepAlive: 30000,
                    lazyConnect: true,
                    retryStrategy: (times) => {
                        if (times > 10) return null;
                        return Math.min(times * 200, 3000);
                    },
                    ...(isTls ? { tls: { rejectUnauthorized: false } } : {})
                });
                await this.client.connect();
                this.isConnected = true;
                console.log(`[QCommerce-Redis] Connected to production Redis cluster`);

                this.client.on('error', (err) => {
                    this.isConnected = false;
                    console.warn(`[QCommerce-Redis] Connection error: ${err.message}. Using fallback engine.`);
                });
            } catch (err) {
                this.isConnected = false;
                console.log('[QCommerce-Redis] Operating with in-memory quick-commerce engine.');
            }
        } else {
            console.log('[QCommerce-Redis] Operating with in-memory quick-commerce engine.');
        }
    }

    // =========================================================================
    // DOMAIN 1: CHECKOUT & FLASH SALES (Patterns 1 - 10)
    // =========================================================================

    /**
     * 1. Atomic Stock Decrement: Prevents overselling during sudden spikes using DECRBY
     */
    async atomicDecrementStock(sku, quantity = 1, currentPhysicalStock = 100) {
        const stockKey = `stock:sku:${sku}`;
        if (this.isConnected && this.client) {
            // Seed stock key if absent
            await this.client.set(stockKey, currentPhysicalStock, 'NX');
            const remaining = await this.client.decrby(stockKey, quantity);
            if (remaining < 0) {
                // Rollback if oversold
                await this.client.incrby(stockKey, quantity);
                return { success: false, remaining: remaining + quantity, error: 'Out of stock' };
            }
            return { success: true, remaining };
        }

        // In-memory atomic DECRBY
        let stock = this.memoryStore.has(stockKey) ? Number(this.memoryStore.get(stockKey).value) : currentPhysicalStock;
        if (stock < quantity) {
            return { success: false, remaining: stock, error: 'Out of stock' };
        }
        stock -= quantity;
        this.memoryStore.set(stockKey, { value: stock });
        return { success: true, remaining: stock };
    }

    /**
     * 2. Temporary Cart Reservations: Reserves items for 7 minutes during checkout (SETEX 420)
     */
    async reserveCartStock(cartId, sku, quantity, ttlSeconds = 420) {
        const holdKey = `hold:cart:${cartId}:sku:${sku}`;
        const holdData = { cartId, sku, quantity, expiresAt: Date.now() + ttlSeconds * 1000 };

        if (this.isConnected && this.client) {
            await this.client.set(holdKey, JSON.stringify(holdData), 'EX', ttlSeconds);
            return { success: true, holdKey, ttlSeconds };
        }

        this.memoryStore.set(holdKey, {
            value: holdData,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
        return { success: true, holdKey, ttlSeconds };
    }

    /**
     * 3. Restock Rollbacks: Automatically increments inventory back (INCRBY) on abandon/failure
     */
    async rollbackRestock(sku, quantity) {
        const stockKey = `stock:sku:${sku}`;
        if (this.isConnected && this.client) {
            const newStock = await this.client.incrby(stockKey, quantity);
            return { success: true, restoredQuantity: quantity, currentStock: newStock };
        }

        let stock = this.memoryStore.has(stockKey) ? Number(this.memoryStore.get(stockKey).value) : 0;
        stock += quantity;
        this.memoryStore.set(stockKey, { value: stock });
        return { success: true, restoredQuantity: quantity, currentStock: stock };
    }

    /**
     * 4. First-N Promo Limits: Limits discount codes to the first 100 uses via atomic counters
     */
    async claimPromoCode(code, maxUses = 100) {
        const counterKey = `promo:counter:${code.toUpperCase()}`;
        if (this.isConnected && this.client) {
            const usage = await this.client.incr(counterKey);
            if (usage > maxUses) {
                return { success: false, usage, error: `Promo limit of ${maxUses} reached` };
            }
            return { success: true, currentUsage: usage, remainingUses: maxUses - usage };
        }

        let usage = this.memoryStore.has(counterKey) ? Number(this.memoryStore.get(counterKey).value) : 0;
        usage += 1;
        if (usage > maxUses) {
            return { success: false, usage, error: `Promo limit of ${maxUses} reached` };
        }
        this.memoryStore.set(counterKey, { value: usage });
        return { success: true, currentUsage: usage, remainingUses: maxUses - usage };
    }

    /**
     * 5. Single-Use User Vouchers: Tracks whether customer claimed bonus using SADD / SISMEMBER
     */
    async claimSingleUseVoucher(voucherCode, userId) {
        const setKey = `voucher:claimed:${voucherCode.toUpperCase()}`;
        if (this.isConnected && this.client) {
            const added = await this.client.sadd(setKey, userId.toString());
            if (added === 0) {
                return { success: false, error: 'Voucher already used by this customer' };
            }
            return { success: true, message: 'Voucher successfully redeemed' };
        }

        if (!this.memorySets.has(setKey)) this.memorySets.set(setKey, new Set());
        const set = this.memorySets.get(setKey);
        if (set.has(userId.toString())) {
            return { success: false, error: 'Voucher already used by this customer' };
        }
        set.add(userId.toString());
        return { success: true, message: 'Voucher successfully redeemed' };
    }

    /**
     * 6. Delivery Slot Quotas: Restricts checkout volume to 25 orders per 15-minute slot
     */
    async reserveDeliverySlot(slotId, maxQuota = 25) {
        const slotKey = `slot:quota:${slotId}`;
        if (this.isConnected && this.client) {
            const booked = await this.client.incr(slotKey);
            if (booked > maxQuota) {
                await this.client.decr(slotKey);
                return { success: false, error: `Delivery slot ${slotId} is fully booked (${maxQuota}/${maxQuota})` };
            }
            return { success: true, slotId, booked, remaining: maxQuota - booked };
        }

        let booked = this.memoryStore.has(slotKey) ? Number(this.memoryStore.get(slotKey).value) : 0;
        if (booked >= maxQuota) {
            return { success: false, error: `Delivery slot ${slotId} is fully booked (${maxQuota}/${maxQuota})` };
        }
        booked += 1;
        this.memoryStore.set(slotKey, { value: booked });
        return { success: true, slotId, booked, remaining: maxQuota - booked };
    }

    /**
     * 7. Minimum Cart Value Enforcers: Evaluates running subtotal logic in RAM before checkout
     */
    enforceMinCartValue(subtotal, minRequired = 99) {
        const isValid = Number(subtotal) >= minRequired;
        return {
            isValid,
            subtotal: Number(subtotal),
            minRequired,
            difference: isValid ? 0 : parseFloat((minRequired - subtotal).toFixed(2))
        };
    }

    /**
     * 8. Payment Webhook Idempotency: Stops duplicate charge processing (SET key val NX EX 60)
     */
    async acquireWebhookIdempotency(eventId, ttlSeconds = 60) {
        const lockKey = `webhook:idempotency:${eventId}`;
        if (this.isConnected && this.client) {
            const res = await this.client.set(lockKey, 'PROCESSED', 'NX', 'EX', ttlSeconds);
            return res === 'OK';
        }

        const existing = this.memoryStore.get(lockKey);
        if (existing && (!existing.expiresAt || Date.now() < existing.expiresAt)) {
            return false;
        }
        this.memoryStore.set(lockKey, {
            value: 'PROCESSED',
            expiresAt: Date.now() + ttlSeconds * 1000
        });
        return true;
    }

    /**
     * 9. Cart Abandonment Trackers: Sets a 30-minute delayed trigger key for reminders
     */
    async trackCartAbandonment(cartId, userId, ttlSeconds = 1800) {
        const triggerKey = `abandon:cart:${cartId}`;
        const data = { cartId, userId, timestamp: new Date() };

        if (this.isConnected && this.client) {
            await this.client.set(triggerKey, JSON.stringify(data), 'EX', ttlSeconds);
            return { scheduled: true, triggerKey, reminderInMinutes: ttlSeconds / 60 };
        }

        this.memoryStore.set(triggerKey, {
            value: data,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
        return { scheduled: true, triggerKey, reminderInMinutes: ttlSeconds / 60 };
    }

    /**
     * 10. Surge Pricing Toggles: Instantly flags high-demand zones or weather pricing platform-wide
     */
    async setSurgePricing(zoneId, multiplier = 1.25, ttlSeconds = 3600) {
        const surgeKey = `surge:zone:${zoneId}`;
        const data = { multiplier: Number(multiplier), active: multiplier > 1, updatedAt: new Date() };

        if (this.isConnected && this.client) {
            await this.client.set(surgeKey, JSON.stringify(data), 'EX', ttlSeconds);
            return data;
        }

        this.memoryStore.set(surgeKey, {
            value: data,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
        return data;
    }

    async getSurgeMultiplier(zoneId) {
        const surgeKey = `surge:zone:${zoneId}`;
        if (this.isConnected && this.client) {
            const data = await this.client.get(surgeKey);
            return data ? JSON.parse(data) : { multiplier: 1.0, active: false };
        }
        const entry = this.memoryStore.get(surgeKey);
        if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
            return entry.value;
        }
        return { multiplier: 1.0, active: false };
    }

    // =========================================================================
    // DOMAIN 2: SEARCH & STOREFRONT EXPERIENCE (Patterns 11 - 20)
    // =========================================================================

    /**
     * 11. Sub-millisecond Search Autocomplete: Uses Sorted Sets for instant prefix suggestions
     */
    async indexSearchPrefixes(keywords) {
        const zsetKey = `search:autocomplete:zset`;
        const items = Array.isArray(keywords) ? keywords : [keywords];

        if (this.isConnected && this.client) {
            const pipeline = this.client.pipeline();
            for (const kw of items) {
                pipeline.zadd(zsetKey, 0, kw.toLowerCase().trim());
            }
            await pipeline.exec();
            return true;
        }

        if (!this.memorySortedSets.has(zsetKey)) this.memorySortedSets.set(zsetKey, new Map());
        const set = this.memorySortedSets.get(zsetKey);
        for (const kw of items) {
            set.set(kw.toLowerCase().trim(), 0);
        }
        return true;
    }

    async searchAutocomplete(query, limit = 8) {
        const q = query.toLowerCase().trim();
        const zsetKey = `search:autocomplete:zset`;

        if (this.isConnected && this.client) {
            // ZRANGEBYLEX pattern
            const results = await this.client.zrangebylex(zsetKey, `[${q}`, `[${q}\xff`, 'LIMIT', 0, limit);
            return results;
        }

        const set = this.memorySortedSets.get(zsetKey);
        if (!set) return [];
        const matches = [];
        for (const key of set.keys()) {
            if (key.startsWith(q)) {
                matches.push(key);
                if (matches.length >= limit) break;
            }
        }
        return matches;
    }

    /**
     * 12. Homepage Layout Cache: Stores category grids & promotional banners in Redis
     */
    async cacheHomepageLayout(data, ttlSeconds = 1800) {
        const key = `layout:homepage`;
        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
            return true;
        }
        this.memoryStore.set(key, { value: data, expiresAt: Date.now() + ttlSeconds * 1000 });
        return true;
    }

    async getHomepageLayout() {
        const key = `layout:homepage`;
        if (this.isConnected && this.client) {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        const entry = this.memoryStore.get(key);
        if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
            return entry.value;
        }
        return null;
    }

    /**
     * 13. Dynamic Category Navigation: Keeps nested category tree in memory
     */
    async cacheCategoryTree(tree, ttlSeconds = 86400) {
        const key = `catalog:category_tree`;
        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(tree), 'EX', ttlSeconds);
            return true;
        }
        this.memoryStore.set(key, { value: tree, expiresAt: Date.now() + ttlSeconds * 1000 });
        return true;
    }

    async getCategoryTree() {
        const key = `catalog:category_tree`;
        if (this.isConnected && this.client) {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        const entry = this.memoryStore.get(key);
        if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) return entry.value;
        return null;
    }

    /**
     * 14. Recently Viewed Shelves: Maintains capped list (LPUSH + LTRIM 10) per user
     */
    async pushRecentlyViewed(userId, productId) {
        const listKey = `user:recent_views:${userId}`;
        if (this.isConnected && this.client) {
            const pipeline = this.client.pipeline();
            pipeline.lrem(listKey, 0, productId.toString());
            pipeline.lpush(listKey, productId.toString());
            pipeline.ltrim(listKey, 0, 9); // Keep top 10
            pipeline.expire(listKey, 7 * 86400);
            await pipeline.exec();
            return true;
        }

        if (!this.memoryLists.has(listKey)) this.memoryLists.set(listKey, []);
        let list = this.memoryLists.get(listKey);
        list = list.filter(id => id !== productId.toString());
        list.unshift(productId.toString());
        if (list.length > 10) list = list.slice(0, 10);
        this.memoryLists.set(listKey, list);
        return true;
    }

    async getRecentlyViewed(userId) {
        const listKey = `user:recent_views:${userId}`;
        if (this.isConnected && this.client) {
            return await this.client.lrange(listKey, 0, 9);
        }
        return this.memoryLists.get(listKey) || [];
    }

    /**
     * 15. User Search History: Stores last 5 searched keywords for instant focus recall
     */
    async pushSearchHistory(userId, query) {
        const clean = query.trim().toLowerCase();
        if (!clean) return;
        const key = `user:search_history:${userId}`;

        if (this.isConnected && this.client) {
            const pipeline = this.client.pipeline();
            pipeline.lrem(key, 0, clean);
            pipeline.lpush(key, clean);
            pipeline.ltrim(key, 0, 4); // Keep top 5
            pipeline.expire(key, 30 * 86400);
            await pipeline.exec();
            return;
        }

        if (!this.memoryLists.has(key)) this.memoryLists.set(key, []);
        let list = this.memoryLists.get(key);
        list = list.filter(item => item !== clean);
        list.unshift(clean);
        if (list.length > 5) list = list.slice(0, 5);
        this.memoryLists.set(key, list);
    }

    async getSearchHistory(userId) {
        const key = `user:search_history:${userId}`;
        if (this.isConnected && this.client) {
            return await this.client.lrange(key, 0, 4);
        }
        return this.memoryLists.get(key) || [];
    }

    /**
     * 16. Hourly Best-Sellers (Trending): Increments item purchase counters (ZINCRBY)
     */
    async recordProductSale(productId, quantity = 1) {
        const now = new Date();
        const hourKey = `trending:hourly:${now.getFullYear()}${now.getMonth()+1}${now.getDate()}_${now.getHours()}`;

        if (this.isConnected && this.client) {
            await this.client.zincrby(hourKey, quantity, productId.toString());
            await this.client.expire(hourKey, 24 * 3600); // 24-hr TTL
            return true;
        }

        if (!this.memorySortedSets.has(hourKey)) this.memorySortedSets.set(hourKey, new Map());
        const set = this.memorySortedSets.get(hourKey);
        const cur = set.get(productId.toString()) || 0;
        set.set(productId.toString(), cur + quantity);
        return true;
    }

    async getHourlyBestSellers(limit = 10) {
        const now = new Date();
        const hourKey = `trending:hourly:${now.getFullYear()}${now.getMonth()+1}${now.getDate()}_${now.getHours()}`;

        if (this.isConnected && this.client) {
            // ZREVRANGE to get top sellers
            return await this.client.zrevrange(hourKey, 0, limit - 1, 'WITHSCORES');
        }

        const set = this.memorySortedSets.get(hourKey);
        if (!set) return [];
        return Array.from(set.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id, score]) => ({ id, score }));
    }

    /**
     * 17. Substitute Item Mapping: Caches pre-computed alternatives for OOS products
     */
    async cacheSubstituteItems(productId, substituteIds, ttlSeconds = 86400) {
        const key = `substitutes:prod:${productId}`;
        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(substituteIds), 'EX', ttlSeconds);
            return true;
        }
        this.memoryStore.set(key, { value: substituteIds, expiresAt: Date.now() + ttlSeconds * 1000 });
        return true;
    }

    async getSubstituteItems(productId) {
        const key = `substitutes:prod:${productId}`;
        if (this.isConnected && this.client) {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : [];
        }
        const entry = this.memoryStore.get(key);
        return entry ? entry.value : [];
    }

    /**
     * 18. Personalized "Buy Again" Row: Caches frequent purchase IDs per customer
     */
    async recordUserPurchase(userId, productIds) {
        const key = `user:buy_again:${userId}`;
        const ids = Array.isArray(productIds) ? productIds : [productIds];

        if (this.isConnected && this.client) {
            const pipeline = this.client.pipeline();
            for (const id of ids) {
                pipeline.zincrby(key, 1, id.toString());
            }
            pipeline.expire(key, 90 * 86400); // 90-day retention
            await pipeline.exec();
            return;
        }

        if (!this.memorySortedSets.has(key)) this.memorySortedSets.set(key, new Map());
        const set = this.memorySortedSets.get(key);
        for (const id of ids) {
            const cur = set.get(id.toString()) || 0;
            set.set(id.toString(), cur + 1);
        }
    }

    async getBuyAgainItems(userId, limit = 10) {
        const key = `user:buy_again:${userId}`;
        if (this.isConnected && this.client) {
            return await this.client.zrevrange(key, 0, limit - 1);
        }
        const set = this.memorySortedSets.get(key);
        if (!set) return [];
        return Array.from(set.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(e => e[0]);
    }

    /**
     * 19. Frequently Bought Together Engine: Pre-calculated pairings
     */
    async setFrequentlyBoughtTogether(productId, bundleProductIds) {
        const key = `bundle:fbt:${productId}`;
        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(bundleProductIds), 'EX', 7 * 86400);
            return;
        }
        this.memoryStore.set(key, { value: bundleProductIds, expiresAt: Date.now() + 7 * 86400 * 1000 });
    }

    async getFrequentlyBoughtTogether(productId) {
        const key = `bundle:fbt:${productId}`;
        if (this.isConnected && this.client) {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : [];
        }
        const entry = this.memoryStore.get(key);
        return entry ? entry.value : [];
    }

    /**
     * 20. Store Opening / Closing State: Flips in-memory flag for zero-latency kill-switch
     */
    async setStoreStatus(isOpen, note = '') {
        const key = `store:system_status`;
        const data = { isOpen: Boolean(isOpen), note, updatedAt: new Date() };

        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(data));
            return data;
        }
        this.memoryStore.set(key, { value: data });
        return data;
    }

    async isStoreOpen() {
        const key = `store:system_status`;
        if (this.isConnected && this.client) {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : { isOpen: true, note: 'Default Open' };
        }
        const entry = this.memoryStore.get(key);
        return entry ? entry.value : { isOpen: true, note: 'Default Open' };
    }

    // =========================================================================
    // DOMAIN 3: DARK STORE & IN-HUB PACKING OPERATIONS (Patterns 21 - 30)
    // =========================================================================

    /**
     * 21. Real-time Order Dispatch Queue: Drops paid orders into worker queues (RPOPLPUSH)
     */
    async enqueueOrderForPacking(orderId) {
        const queueKey = `queue:packing:pending`;
        if (this.isConnected && this.client) {
            await this.client.lpush(queueKey, orderId.toString());
            return { enqueued: true, orderId };
        }
        if (!this.memoryLists.has(queueKey)) this.memoryLists.set(queueKey, []);
        this.memoryLists.get(queueKey).unshift(orderId.toString());
        return { enqueued: true, orderId };
    }

    async popNextOrderForPicker(pickerId) {
        const pendingQueue = `queue:packing:pending`;
        const processingQueue = `queue:packing:processing:${pickerId}`;

        if (this.isConnected && this.client) {
            const orderId = await this.client.rpoplpush(pendingQueue, processingQueue);
            return orderId;
        }

        const pending = this.memoryLists.get(pendingQueue);
        if (!pending || pending.length === 0) return null;
        const orderId = pending.pop();
        if (!this.memoryLists.has(processingQueue)) this.memoryLists.set(processingQueue, []);
        this.memoryLists.get(processingQueue).unshift(orderId);
        return orderId;
    }

    /**
     * 22. Bin-Level Item Picking Status: Tracks picked, replaced, or missing items in Redis Hashes
     */
    async updateBinPickingStatus(orderId, itemId, status = 'picked', notes = '') {
        const hashKey = `packing:order:${orderId}:items`;
        const payload = JSON.stringify({ status, notes, timestamp: new Date() });

        if (this.isConnected && this.client) {
            await this.client.hset(hashKey, itemId, payload);
            await this.client.expire(hashKey, 3600); // 1-hour TTL
            return true;
        }

        if (!this.memoryHashes.has(hashKey)) this.memoryHashes.set(hashKey, new Map());
        this.memoryHashes.get(hashKey).set(itemId, payload);
        return true;
    }

    async getOrderPickingStatus(orderId) {
        const hashKey = `packing:order:${orderId}:items`;
        if (this.isConnected && this.client) {
            const items = await this.client.hgetall(hashKey);
            const parsed = {};
            for (const [k, v] of Object.entries(items)) {
                parsed[k] = JSON.parse(v);
            }
            return parsed;
        }
        const hash = this.memoryHashes.get(hashKey);
        if (!hash) return {};
        const parsed = {};
        for (const [k, v] of hash.entries()) {
            parsed[k] = JSON.parse(v);
        }
        return parsed;
    }

    /**
     * 23. Picker Performance Metrics: Increments packed items per picker ID for velocity stats
     */
    async incrementPickerVelocity(pickerId, itemCount = 1) {
        const key = `picker:velocity:${pickerId}:${new Date().toISOString().slice(0, 10)}`;
        if (this.isConnected && this.client) {
            const total = await this.client.incrby(key, itemCount);
            await this.client.expire(key, 7 * 86400);
            return { pickerId, packedToday: total };
        }

        let total = this.memoryStore.has(key) ? Number(this.memoryStore.get(key).value) : 0;
        total += itemCount;
        this.memoryStore.set(key, { value: total });
        return { pickerId, packedToday: total };
    }

    /**
     * 24. Instant Out-of-Stock Broadcast: Pub/Sub when picker marks empty shelf
     */
    async broadcastOutOfStock(productId, hubId = 'central-hub') {
        const channel = `pubsub:oos_alerts`;
        const message = JSON.stringify({ productId, hubId, timestamp: new Date() });

        if (this.isConnected && this.client) {
            await this.client.publish(channel, message);
            return { broadcast: true, channel };
        }

        console.log(`[QCommerce PubSub Mock] OOS broadcast for product ${productId} at ${hubId}`);
        return { broadcast: true, channel, inMemory: true };
    }

    /**
     * 25. Batch Order Aggregation: Groups small single-item orders to same society in Redis Set
     */
    async aggregateBatchOrders(societyPincode, orderId) {
        const setKey = `batch:society:${societyPincode}`;
        if (this.isConnected && this.client) {
            await this.client.sadd(setKey, orderId.toString());
            await this.client.expire(setKey, 1800); // 30-min window
            return await this.client.smembers(setKey);
        }

        if (!this.memorySets.has(setKey)) this.memorySets.set(setKey, new Set());
        const set = this.memorySets.get(setKey);
        set.add(orderId.toString());
        return Array.from(set);
    }

    /**
     * 26. Barcode Scan Validation: Keeps lightning-fast hash of SKU barcodes in sub-1ms
     */
    async registerBarcode(barcode, skuData) {
        const hashKey = `catalog:barcodes`;
        if (this.isConnected && this.client) {
            await this.client.hset(hashKey, barcode, JSON.stringify(skuData));
            return true;
        }
        if (!this.memoryHashes.has(hashKey)) this.memoryHashes.set(hashKey, new Map());
        this.memoryHashes.get(hashKey).set(barcode, JSON.stringify(skuData));
        return true;
    }

    async validateBarcode(barcode) {
        const hashKey = `catalog:barcodes`;
        if (this.isConnected && this.client) {
            const data = await this.client.hget(hashKey, barcode);
            return data ? JSON.parse(data) : null;
        }
        const hash = this.memoryHashes.get(hashKey);
        return hash && hash.has(barcode) ? JSON.parse(hash.get(barcode)) : null;
    }

    /**
     * 27. Packaging Weight Tolerances: Stores weight ranges to verify bags on scales before dispatch
     */
    async setPackagingWeightTolerance(orderId, expectedGrams, toleranceGrams = 50) {
        const key = `bag:weight:${orderId}`;
        const data = { expectedGrams, min: expectedGrams - toleranceGrams, max: expectedGrams + toleranceGrams };

        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(data), 'EX', 7200);
            return data;
        }
        this.memoryStore.set(key, { value: data, expiresAt: Date.now() + 7200 * 1000 });
        return data;
    }

    async verifyBagWeight(orderId, measuredGrams) {
        const key = `bag:weight:${orderId}`;
        let rule = null;
        if (this.isConnected && this.client) {
            const raw = await this.client.get(key);
            rule = raw ? JSON.parse(raw) : null;
        } else {
            const entry = this.memoryStore.get(key);
            rule = entry ? entry.value : null;
        }

        if (!rule) return { verified: true, warning: 'No weight rule configured' };
        const verified = measuredGrams >= rule.min && measuredGrams <= rule.max;
        return {
            verified,
            measuredGrams,
            expected: rule.expectedGrams,
            allowedRange: [rule.min, rule.max]
        };
    }

    /**
     * 28. Order Assembly Timer: Tracks seconds elapsed from payment to seal for 3-min SLA
     */
    async startAssemblyTimer(orderId) {
        const key = `timer:assembly:${orderId}`;
        const start = Date.now();
        if (this.isConnected && this.client) {
            await this.client.set(key, start, 'EX', 3600);
            return { orderId, startTime: start };
        }
        this.memoryStore.set(key, { value: start, expiresAt: Date.now() + 3600 * 1000 });
        return { orderId, startTime: start };
    }

    async getAssemblyElapsedSeconds(orderId) {
        const key = `timer:assembly:${orderId}`;
        let start = null;
        if (this.isConnected && this.client) {
            start = await this.client.get(key);
        } else {
            const entry = this.memoryStore.get(key);
            start = entry ? entry.value : null;
        }
        if (!start) return 0;
        const elapsed = Math.floor((Date.now() - Number(start)) / 1000);
        return { orderId, elapsedSeconds: elapsed, slaBreached: elapsed > 180 };
    }

    /**
     * 29. Cold-Chain Alert Counters: Flags bags containing dairy/ice cream awaiting dispatch >8 mins
     */
    async registerColdChainBag(orderId) {
        const key = `coldchain:bag:${orderId}`;
        const created = Date.now();
        if (this.isConnected && this.client) {
            await this.client.set(key, created, 'EX', 3600);
            return { registered: true, orderId };
        }
        this.memoryStore.set(key, { value: created, expiresAt: Date.now() + 3600 * 1000 });
        return { registered: true, orderId };
    }

    async checkColdChainAlert(orderId) {
        const key = `coldchain:bag:${orderId}`;
        let start = null;
        if (this.isConnected && this.client) {
            start = await this.client.get(key);
        } else {
            const entry = this.memoryStore.get(key);
            start = entry ? entry.value : null;
        }
        if (!start) return { activeAlert: false };
        const elapsedMinutes = Math.floor((Date.now() - Number(start)) / (60 * 1000));
        return {
            orderId,
            elapsedMinutes,
            warning: elapsedMinutes >= 8,
            message: elapsedMinutes >= 8 ? 'CRITICAL: Cold chain product awaiting dispatch >8 mins!' : 'Within safe temperature threshold'
        };
    }

    /**
     * 30. Returns & Damaged SKU Binning: Logs defective items before DB reconciliation
     */
    async logDamagedSKU(sku, quantity, reason = 'Crushed during transit', pickerId = 'system') {
        const listKey = `bin:damaged_skus`;
        const entry = JSON.stringify({ sku, quantity, reason, pickerId, timestamp: new Date() });

        if (this.isConnected && this.client) {
            await this.client.lpush(listKey, entry);
            return { logged: true, sku, quantity };
        }

        if (!this.memoryLists.has(listKey)) this.memoryLists.set(listKey, []);
        this.memoryLists.get(listKey).unshift(entry);
        return { logged: true, sku, quantity };
    }

    // =========================================================================
    // DOMAIN 4: RIDER LOGISTICS & LAST-MILE DELIVERY (Patterns 31 - 40)
    // =========================================================================

    /**
     * 31. Live GPS Coordinate Ingestion: Stores driver location pings every 3s (30s TTL)
     */
    async ingestRiderGPS(riderId, latitude, longitude) {
        const key = `rider:gps:${riderId}`;
        const geoKey = `riders:geo_index`;
        const payload = JSON.stringify({ lat: latitude, lng: longitude, pingAt: Date.now() });

        if (this.isConnected && this.client) {
            const pipeline = this.client.pipeline();
            pipeline.set(key, payload, 'EX', 30); // 30-sec expiration
            pipeline.geoadd(geoKey, longitude, latitude, riderId.toString());
            await pipeline.exec();
            return { riderId, latitude, longitude, ingested: true };
        }

        this.memoryStore.set(key, { value: payload, expiresAt: Date.now() + 30000 });
        return { riderId, latitude, longitude, ingested: true };
    }

    /**
     * Store Hub Metadata & Turf GeoJSON Perimeter
     */
    getStoreHubInfo() {
        const hubPoint = turf.point([DARK_STORE_HUB.lng, DARK_STORE_HUB.lat]);
        const zonePolygon = turf.circle(hubPoint, DARK_STORE_HUB.deliveryRadiusKm, {
            steps: 64,
            units: 'kilometers',
            properties: {
                hubId: DARK_STORE_HUB.id,
                hubName: DARK_STORE_HUB.name,
                radiusKm: DARK_STORE_HUB.deliveryRadiusKm
            }
        });

        return {
            ...DARK_STORE_HUB,
            zoneGeoJSON: zonePolygon
        };
    }

    /**
     * 32. Dark Store Geofencing: Verifies address coordinates within boundary using Turf
     */
    validateAddressGeofence(customerLat, customerLng, hubLat = DARK_STORE_HUB.lat, hubLng = DARK_STORE_HUB.lng, maxRadiusKm = DARK_STORE_HUB.deliveryRadiusKm, customPolygon = null) {
        if (!customerLat || !customerLng) {
            return {
                withinBoundary: false,
                distanceKm: null,
                maxAllowedKm: maxRadiusKm,
                error: 'Valid coordinates required'
            };
        }

        try {
            const customerPoint = turf.point([Number(customerLng), Number(customerLat)]);
            const hubPoint = turf.point([Number(hubLng), Number(hubLat)]);

            // Precise geodesic distance calculation via Turf
            const distanceKm = parseFloat(turf.distance(hubPoint, customerPoint, { units: 'kilometers' }).toFixed(2));

            // Precise point-in-polygon geofence boundary test via Turf
            const deliveryPolygon = customPolygon || turf.circle(hubPoint, Number(maxRadiusKm), {
                steps: 64,
                units: 'kilometers'
            });

            const withinBoundary = turf.booleanPointInPolygon(customerPoint, deliveryPolygon);

            // Quick-commerce delivery ETA model (10-18 mins)
            let etaMinutes = 10;
            if (distanceKm > 1.5) etaMinutes = 12;
            if (distanceKm > 3.0) etaMinutes = 15;
            if (distanceKm > 4.5) etaMinutes = 18;

            return {
                withinBoundary,
                distanceKm,
                maxAllowedKm: Number(maxRadiusKm),
                etaMinutes: withinBoundary ? etaMinutes : null,
                hub: {
                    id: DARK_STORE_HUB.id,
                    name: DARK_STORE_HUB.name,
                    lat: Number(hubLat),
                    lng: Number(hubLng)
                }
            };
        } catch (err) {
            // Fallback to Haversine if turf encountered any malformed coordinate structure
            const dist = this.calculateHaversineDistance(customerLat, customerLng, hubLat, hubLng);
            return {
                withinBoundary: dist <= maxRadiusKm,
                distanceKm: parseFloat(dist.toFixed(2)),
                maxAllowedKm: Number(maxRadiusKm),
                etaMinutes: dist <= maxRadiusKm ? 15 : null
            };
        }
    }

    /**
     * 33. Nearest Driver Discovery: Uses GEORADIUS to find idle delivery partners in 2km
     */
    async findNearestRiders(hubLat, hubLng, radiusKm = 2) {
        const geoKey = `riders:geo_index`;
        if (this.isConnected && this.client) {
            try {
                const results = await this.client.georadius(geoKey, hubLng, hubLat, radiusKm, 'km', 'WITHDIST', 'ASC');
                return results.map(([riderId, dist]) => ({ riderId, distanceKm: parseFloat(dist) }));
            } catch (e) {
                return [];
            }
        }
        return [{ riderId: 'rider_101', distanceKm: 0.8 }, { riderId: 'rider_104', distanceKm: 1.4 }];
    }

    /**
     * 34. Rider Queue & Priority Engine: Tracks queued waiting riders in FIFO list
     */
    async enqueueRiderAtHub(riderId, hubId = 'hub_lucknow_1') {
        const queueKey = `queue:riders:${hubId}`;
        if (this.isConnected && this.client) {
            await this.client.rpush(queueKey, riderId.toString());
            return { riderId, enqueued: true };
        }
        if (!this.memoryLists.has(queueKey)) this.memoryLists.set(queueKey, []);
        this.memoryLists.get(queueKey).push(riderId.toString());
        return { riderId, enqueued: true };
    }

    async dispatchNextRider(hubId = 'hub_lucknow_1') {
        const queueKey = `queue:riders:${hubId}`;
        if (this.isConnected && this.client) {
            return await this.client.lpop(queueKey);
        }
        const list = this.memoryLists.get(queueKey);
        return list && list.length > 0 ? list.shift() : null;
    }

    /**
     * 35. Multi-Delivery Stacking: Groups adjacent delivery stops assigned to single bike
     */
    async stackDeliveryStops(clusterId, orderIds) {
        const key = `stack:cluster:${clusterId}`;
        const items = Array.isArray(orderIds) ? orderIds : [orderIds];
        if (this.isConnected && this.client) {
            await this.client.sadd(key, ...items.map(String));
            await this.client.expire(key, 7200);
            return await this.client.smembers(key);
        }
        if (!this.memorySets.has(key)) this.memorySets.set(key, new Set());
        const set = this.memorySets.get(key);
        for (const id of items) set.add(id.toString());
        return Array.from(set);
    }

    /**
     * 36. Live Distance-to-Customer Calculation
     */
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 37. Delivery Route Checkpoints: Records milestone timestamps in Redis Hashes
     */
    async recordRouteCheckpoint(orderId, checkpointName) {
        const key = `order:checkpoints:${orderId}`;
        const timestamp = new Date().toISOString();

        if (this.isConnected && this.client) {
            await this.client.hset(key, checkpointName, timestamp);
            await this.client.expire(key, 86400);
            return { orderId, checkpointName, timestamp };
        }

        if (!this.memoryHashes.has(key)) this.memoryHashes.set(key, new Map());
        this.memoryHashes.get(key).set(checkpointName, timestamp);
        return { orderId, checkpointName, timestamp };
    }

    async getRouteCheckpoints(orderId) {
        const key = `order:checkpoints:${orderId}`;
        if (this.isConnected && this.client) {
            return await this.client.hgetall(key);
        }
        const hash = this.memoryHashes.get(key);
        if (!hash) return {};
        const obj = {};
        for (const [k, v] of hash.entries()) obj[k] = v;
        return obj;
    }

    /**
     * 38. Rider Capacity Limits: Enforces bag volume and weight limits per bike
     */
    async checkRiderCapacity(riderId, additionalWeightKg, maxAllowedKg = 15.0) {
        const key = `rider:weight:${riderId}`;
        if (this.isConnected && this.client) {
            const current = Number(await this.client.get(key) || 0);
            if (current + additionalWeightKg > maxAllowedKg) {
                return { canAccept: false, currentKg: current, maxAllowedKg };
            }
            await this.client.incrbyfloat(key, additionalWeightKg);
            await this.client.expire(key, 7200);
            return { canAccept: true, updatedKg: current + additionalWeightKg, maxAllowedKg };
        }

        let current = this.memoryStore.has(key) ? Number(this.memoryStore.get(key).value) : 0;
        if (current + additionalWeightKg > maxAllowedKg) {
            return { canAccept: false, currentKg: current, maxAllowedKg };
        }
        current += additionalWeightKg;
        this.memoryStore.set(key, { value: current });
        return { canAccept: true, updatedKg: current, maxAllowedKg };
    }

    /**
     * 39. Delayed Delivery ETA Recalculation: Pushes dynamic traffic delay notices
     */
    async recalculateDynamicETA(orderId, additionalMinutes = 5, reason = 'High traffic on route') {
        const key = `order:eta:${orderId}`;
        const data = { additionalMinutes, reason, recalculatedAt: new Date() };

        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(data), 'EX', 7200);
            return data;
        }
        this.memoryStore.set(key, { value: data, expiresAt: Date.now() + 7200 * 1000 });
        return data;
    }

    /**
     * 40. Proof-of-Delivery OTP: Keeps 4-digit handover OTP with 15-minute TTL
     */
    async generateDeliveryOTP(orderId) {
        const key = `otp:delivery:${orderId}`;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        if (this.isConnected && this.client) {
            await this.client.set(key, otp, 'EX', 900); // 15-minute expiration
            return { orderId, otp, expiresInMinutes: 15 };
        }

        this.memoryStore.set(key, { value: otp, expiresAt: Date.now() + 900 * 1000 });
        return { orderId, otp, expiresInMinutes: 15 };
    }

    async verifyDeliveryOTP(orderId, submittedOtp) {
        const key = `otp:delivery:${orderId}`;
        let stored = null;
        if (this.isConnected && this.client) {
            stored = await this.client.get(key);
        } else {
            const entry = this.memoryStore.get(key);
            stored = entry && (!entry.expiresAt || Date.now() < entry.expiresAt) ? entry.value : null;
        }

        if (!stored) return { verified: false, error: 'Delivery OTP expired or not found' };
        const matches = stored.toString().trim() === submittedOtp.toString().trim();
        if (matches) {
            if (this.isConnected && this.client) await this.client.del(key);
            else this.memoryStore.delete(key);
        }
        return { verified: matches, error: matches ? null : 'Incorrect delivery OTP' };
    }

    // =========================================================================
    // DOMAIN 5: USER ACCOUNT, SECURITY & INFRASTRUCTURE (Patterns 41 - 50)
    // =========================================================================

    /**
     * 41. SMS & WhatsApp Login OTPs: 2-minute auto-expiry (SETEX 120)
     */
    async createLoginOTP(phone, ttlSeconds = 120) {
        const key = `otp:login:${phone}`;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (this.isConnected && this.client) {
            await this.client.set(key, otp, 'EX', ttlSeconds);
            return { phone, otp, expiresInSeconds: ttlSeconds };
        }

        this.memoryStore.set(key, { value: otp, expiresAt: Date.now() + ttlSeconds * 1000 });
        return { phone, otp, expiresInSeconds: ttlSeconds };
    }

    async verifyLoginOTP(phone, submittedOtp) {
        const key = `otp:login:${phone}`;
        let stored = null;
        if (this.isConnected && this.client) {
            stored = await this.client.get(key);
        } else {
            const entry = this.memoryStore.get(key);
            stored = entry && (!entry.expiresAt || Date.now() < entry.expiresAt) ? entry.value : null;
        }

        if (!stored) return { verified: false, error: 'OTP has expired. Please request a new code.' };
        const matches = stored.toString().trim() === submittedOtp.toString().trim();
        if (matches) {
            if (this.isConnected && this.client) await this.client.del(key);
            else this.memoryStore.delete(key);
        }
        return { verified: matches };
    }

    /**
     * 42. Distributed Rate Limiting: Max 50 requests/minute per IP/User to block scrapers
     */
    async checkRateLimit(identifier, maxLimit = 50, windowSeconds = 60) {
        const key = `ratelimit:${identifier}`;
        if (this.isConnected && this.client) {
            const current = await this.client.incr(key);
            if (current === 1) {
                await this.client.expire(key, windowSeconds);
            }
            return {
                allowed: current <= maxLimit,
                current,
                maxLimit,
                remaining: Math.max(0, maxLimit - current)
            };
        }

        const now = Date.now();
        const entry = this.memoryStore.get(key);
        let count = 1;
        if (entry && entry.expiresAt > now) {
            count = Number(entry.value) + 1;
            entry.value = count;
        } else {
            this.memoryStore.set(key, { value: 1, expiresAt: now + windowSeconds * 1000 });
        }
        return {
            allowed: count <= maxLimit,
            current: count,
            maxLimit,
            remaining: Math.max(0, maxLimit - count)
        };
    }

    /**
     * 43. Distributed Locks (Redlock): Single node / Cluster atomic locking
     */
    async acquireDistributedLock(lockKey, ttlSeconds = 10) {
        const fullKey = `lock:${lockKey}`;
        if (this.isConnected && this.client) {
            const res = await this.client.set(fullKey, 'LOCKED', 'NX', 'EX', ttlSeconds);
            return res === 'OK';
        }

        const existing = this.memoryStore.get(fullKey);
        if (existing && (!existing.expiresAt || Date.now() < existing.expiresAt)) return false;
        this.memoryStore.set(fullKey, { value: 'LOCKED', expiresAt: Date.now() + ttlSeconds * 1000 });
        return true;
    }

    async releaseDistributedLock(lockKey) {
        const fullKey = `lock:${lockKey}`;
        if (this.isConnected && this.client) await this.client.del(fullKey);
        else this.memoryStore.delete(fullKey);
        return true;
    }

    /**
     * 44. Cross-Server WebSocket Scaling: Pub/Sub backplane
     */
    async publishWebSocketEvent(channel, message) {
        const fullChannel = `ws:backplane:${channel}`;
        const payload = typeof message === 'object' ? JSON.stringify(message) : message;

        if (this.isConnected && this.client) {
            await this.client.publish(fullChannel, payload);
            return { published: true, channel: fullChannel };
        }
        return { published: true, channel: fullChannel, inMemory: true };
    }

    /**
     * 45. JWT Blacklist / Rapid Revocation: Instantly revoke token on logout
     */
    async blacklistToken(token, ttlSeconds = 86400) {
        const key = `jwt:blacklist:${token}`;
        if (this.isConnected && this.client) {
            await this.client.set(key, 'REVOKED', 'EX', ttlSeconds);
            return true;
        }
        this.memoryStore.set(key, { value: 'REVOKED', expiresAt: Date.now() + ttlSeconds * 1000 });
        return true;
    }

    async isTokenBlacklisted(token) {
        const key = `jwt:blacklist:${token}`;
        if (this.isConnected && this.client) {
            const status = await this.client.get(key);
            return status === 'REVOKED';
        }
        const entry = this.memoryStore.get(key);
        return entry && (!entry.expiresAt || Date.now() < entry.expiresAt);
    }

    /**
     * 46. Background Task Queue: Offloads non-critical async operations
     */
    async enqueueBackgroundTask(queueName, taskData) {
        const key = `queue:task:${queueName}`;
        const payload = JSON.stringify({ taskData, enqueuedAt: new Date() });

        if (this.isConnected && this.client) {
            await this.client.lpush(key, payload);
            return { enqueued: true, queueName };
        }

        if (!this.memoryLists.has(key)) this.memoryLists.set(key, []);
        this.memoryLists.get(key).unshift(payload);
        return { enqueued: true, queueName };
    }

    /**
     * 47. Customer Support Presence: Tracks online status of support agents via Sets
     */
    async setAgentPresence(agentId, isOnline = true) {
        const setKey = `support:agents:online`;
        if (this.isConnected && this.client) {
            if (isOnline) await this.client.sadd(setKey, agentId.toString());
            else await this.client.srem(setKey, agentId.toString());
            return { agentId, isOnline };
        }

        if (!this.memorySets.has(setKey)) this.memorySets.set(setKey, new Set());
        const set = this.memorySets.get(setKey);
        if (isOnline) set.add(agentId.toString());
        else set.delete(agentId.toString());
        return { agentId, isOnline };
    }

    async getOnlineAgents() {
        const setKey = `support:agents:online`;
        if (this.isConnected && this.client) {
            return await this.client.smembers(setKey);
        }
        const set = this.memorySets.get(setKey);
        return set ? Array.from(set) : [];
    }

    /**
     * 48. Database Write Buffer: Batches high-volume micro-updates, flushed every 60s
     */
    async bufferWrite(collectionName, documentData) {
        const bufferKey = `buffer:write:${collectionName}`;
        const payload = JSON.stringify(documentData);

        if (this.isConnected && this.client) {
            await this.client.rpush(bufferKey, payload);
            return { buffered: true };
        }

        if (!this.memoryLists.has(bufferKey)) this.memoryLists.set(bufferKey, []);
        this.memoryLists.get(bufferKey).push(payload);
        return { buffered: true };
    }

    async flushWriteBuffer(collectionName) {
        const bufferKey = `buffer:write:${collectionName}`;
        if (this.isConnected && this.client) {
            const items = await this.client.lrange(bufferKey, 0, -1);
            await this.client.del(bufferKey);
            return items.map(JSON.parse);
        }
        const list = this.memoryLists.get(bufferKey) || [];
        this.memoryLists.set(bufferKey, []);
        return list.map(JSON.parse);
    }

    /**
     * 49. Feature Flags & Remote Config: Zero-downtime feature switches in RAM
     */
    async setFeatureFlag(flagName, enabled, configData = {}) {
        const key = `config:flag:${flagName}`;
        const payload = { enabled: Boolean(enabled), ...configData, updatedAt: new Date() };

        if (this.isConnected && this.client) {
            await this.client.set(key, JSON.stringify(payload));
            return payload;
        }

        this.memoryStore.set(key, { value: payload });
        return payload;
    }

    async getFeatureFlag(flagName, defaultEnabled = false) {
        const key = `config:flag:${flagName}`;
        if (this.isConnected && this.client) {
            const raw = await this.client.get(key);
            return raw ? JSON.parse(raw) : { enabled: defaultEnabled };
        }
        const entry = this.memoryStore.get(key);
        return entry ? entry.value : { enabled: defaultEnabled };
    }

    /**
     * 50. Health Check & Circuit Breakers: Tracks vendor error rates; trips open on spike
     */
    async recordVendorFailure(vendorName, failureThreshold = 5, windowSeconds = 60) {
        const counterKey = `circuit:failures:${vendorName}`;
        const tripKey = `circuit:tripped:${vendorName}`;

        if (this.isConnected && this.client) {
            const failures = await this.client.incr(counterKey);
            if (failures === 1) await this.client.expire(counterKey, windowSeconds);

            if (failures >= failureThreshold) {
                await this.client.set(tripKey, 'OPEN', 'EX', 120); // 2-minute trip cooldown
                return { isTripped: true, failures, threshold: failureThreshold };
            }
            return { isTripped: false, failures, threshold: failureThreshold };
        }

        let count = 1;
        const entry = this.memoryStore.get(counterKey);
        if (entry && entry.expiresAt > Date.now()) {
            count = Number(entry.value) + 1;
            entry.value = count;
        } else {
            this.memoryStore.set(counterKey, { value: 1, expiresAt: Date.now() + windowSeconds * 1000 });
        }

        const tripped = count >= failureThreshold;
        if (tripped) {
            this.memoryStore.set(tripKey, { value: 'OPEN', expiresAt: Date.now() + 120000 });
        }
        return { isTripped: tripped, failures: count, threshold: failureThreshold };
    }

    async isCircuitOpen(vendorName) {
        const tripKey = `circuit:tripped:${vendorName}`;
        if (this.isConnected && this.client) {
            const res = await this.client.get(tripKey);
            return res === 'OPEN';
        }
        const entry = this.memoryStore.get(tripKey);
        return entry && (!entry.expiresAt || Date.now() < entry.expiresAt);
    }
}

module.exports = new QuickCommerceRedis();
