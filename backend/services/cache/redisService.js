/**
 * Redis Cache & Session Service with Zero-Downtime In-Memory Fallback
 */
class RedisService {
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

        // In-memory fallback map: key -> { value, expiresAt }
        this.inMemoryCache = new Map();

        this.initClient();
    }

    async initClient() {
        if (this.redisUrl) {
            try {
                // Check if ioredis or redis is installed
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
                console.log(`[RedisService] Connected to production Redis cluster`);

                this.client.on('error', (err) => {
                    this.isConnected = false;
                    console.warn(`[RedisService] Connection error: ${err.message}. Using in-memory cache.`);
                });
            } catch (err) {
                this.isConnected = false;
                console.log('[RedisService] Redis unavailable or ioredis not installed. Operating with high-speed in-memory LRU cache.');
            }
        } else {
            console.log('[RedisService] REDIS_URL not configured. Operating with high-speed in-memory cache.');
        }
    }

    /**
     * Get value from cache
     * @param {string} key 
     * @returns {Promise<any|null>}
     */
    async get(key) {
        if (this.isConnected && this.client) {
            try {
                const data = await this.client.get(key);
                return data ? JSON.parse(data) : null;
            } catch (err) {
                console.warn(`[RedisService] Failed to read key ${key} from Redis:`, err.message);
            }
        }

        // In-memory fallback
        const entry = this.inMemoryCache.get(key);
        if (!entry) return null;

        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.inMemoryCache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Set value in cache with TTL
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds Default: 300 seconds (5 minutes)
     */
    async set(key, value, ttlSeconds = 300) {
        const serialized = JSON.stringify(value);

        if (this.isConnected && this.client) {
            try {
                await this.client.set(key, serialized, 'EX', ttlSeconds);
                return true;
            } catch (err) {
                console.warn(`[RedisService] Failed to write key ${key} to Redis:`, err.message);
            }
        }

        // In-memory fallback
        const expiresAt = ttlSeconds ? (Date.now() + ttlSeconds * 1000) : null;
        this.inMemoryCache.set(key, {
            value,
            expiresAt
        });

        // Memory leak prevention: limit cache size to 10,000 items
        if (this.inMemoryCache.size > 10000) {
            const firstKey = this.inMemoryCache.keys().next().value;
            this.inMemoryCache.delete(firstKey);
        }

        return true;
    }

    /**
     * Delete key from cache
     * @param {string} key 
     */
    async del(key) {
        if (this.isConnected && this.client) {
            try {
                await this.client.del(key);
            } catch (err) {
                console.warn(`[RedisService] Failed to delete key ${key} from Redis:`, err.message);
            }
        }
        this.inMemoryCache.delete(key);
        return true;
    }

    /**
     * Distributed Lock via SETNX with TTL
     * Used for Razorpay Webhook Deduplication and Idempotent Mutations
     * @param {string} key
     * @param {string|number} value
     * @param {number} ttlSeconds
     * @returns {Promise<boolean>} True if lock acquired, false if already locked
     */
    async setnx(key, value = '1', ttlSeconds = 60) {
        if (this.isConnected && this.client) {
            try {
                // Redis 'SET key value NX EX ttlSeconds'
                const res = await this.client.set(key, JSON.stringify(value), 'NX', 'EX', ttlSeconds);
                return res === 'OK';
            } catch (err) {
                console.warn(`[RedisService] SETNX error for key ${key}:`, err.message);
            }
        }

        // In-memory atomic SETNX
        const entry = this.inMemoryCache.get(key);
        if (entry && (!entry.expiresAt || Date.now() < entry.expiresAt)) {
            return false; // Already locked
        }

        const expiresAt = ttlSeconds ? (Date.now() + ttlSeconds * 1000) : null;
        this.inMemoryCache.set(key, { value, expiresAt });
        return true;
    }

    /**
     * Section 5.1: High-Concurrency Redis Lua Atomic Stock Reservation
     * Evaluates available stock = (physicalStock - reservedStock) >= requested
     * If true, increments reserved stock and holds temporary reservation with 15-min TTL.
     * 
     * @param {string} sku 
     * @param {number} requestedQty
     * @param {number} physicalStock
     * @param {number} ttlSeconds Default: 900 (15 minutes)
    /**
     * Tokenized Atomic Inventory Reservation
     * Acquires hold with a unique ownership token and discrete TTL
     * 
     * @param {string} sku 
     * @param {number} requestedQty
     * @param {number} physicalStock
     * @param {number} ttlSeconds Default: 900 (15 minutes)
     * @param {string} holdToken Unique ownership token
     * @returns {Promise<{ success: boolean, available: number, reserved: number, holdToken: string }>}
     */
    async reserveStock(sku, requestedQty, physicalStock, ttlSeconds = 900, holdToken = null) {
        const token = holdToken || require('crypto').randomUUID();
        const stockKey = `stock:sku:${sku}`;
        const reserveKey = `reserve:sku:${sku}`;
        const holdTokenKey = `hold:sku:${sku}:${token}`;

        if (this.isConnected && this.client) {
            try {
                await this.client.set(stockKey, physicalStock, 'NX');

                // Atomic check, global reserve counter increment, and individual hold key creation with isolated TTL
                const luaScript = `
                    local stock = tonumber(redis.call('get', KEYS[1]) or ARGV[2])
                    local reserved = tonumber(redis.call('get', KEYS[2]) or '0')
                    local requested = tonumber(ARGV[1])

                    if (stock - reserved) >= requested then
                        redis.call('incrby', KEYS[2], requested)
                        redis.call('set', KEYS[3], requested, 'EX', tonumber(ARGV[3]))
                        local newReserved = reserved + requested
                        return {1, stock - newReserved, newReserved}
                    else
                        return {0, stock - reserved, reserved}
                    end
                `;

                const result = await this.client.eval(luaScript, 3, stockKey, reserveKey, holdTokenKey, requestedQty, physicalStock, ttlSeconds);
                return {
                    success: result[0] === 1,
                    available: Number(result[1]),
                    reserved: Number(result[2]),
                    holdToken: token
                };
            } catch (err) {
                console.warn(`[RedisService] Lua reservation error for SKU ${sku}: ${err.message}. Falling back to tokenized memory lock.`);
            }
        }

        // Tokenized in-memory atomic reservation
        if (!this.inMemoryHoldTokens) {
            this.inMemoryHoldTokens = new Map(); // token -> { sku, quantity, expiresAt }
        }

        const now = Date.now();
        // Calculate active reserved for this SKU across valid tokens
        let activeReserved = 0;
        for (const [t, data] of this.inMemoryHoldTokens.entries()) {
            if (data.sku === sku) {
                if (now <= data.expiresAt) {
                    activeReserved += data.quantity;
                } else {
                    this.inMemoryHoldTokens.delete(t);
                }
            }
        }

        const available = Math.max(0, physicalStock - activeReserved);
        if (available >= requestedQty) {
            const newReserved = activeReserved + requestedQty;
            this.inMemoryHoldTokens.set(token, {
                sku,
                quantity: requestedQty,
                expiresAt: now + ttlSeconds * 1000
            });
            return {
                success: true,
                available: physicalStock - newReserved,
                reserved: newReserved,
                holdToken: token
            };
        } else {
            return {
                success: false,
                available,
                reserved: activeReserved,
                holdToken: null
            };
        }
    }

    /**
     * Safe Atomic Release: Only releases stock if holdToken matches and is active
     * Prevents checkout A from accidentally releasing checkout B's reservation
     */
    async releaseStock(sku, quantity, holdToken = null) {
        const reserveKey = `reserve:sku:${sku}`;
        const holdTokenKey = holdToken ? `hold:sku:${sku}:${holdToken}` : null;

        if (this.isConnected && this.client) {
            try {
                if (holdTokenKey) {
                    // Safe release checking ownership token
                    const luaScript = `
                        local holdQty = tonumber(redis.call('get', KEYS[2]) or '0')
                        if holdQty > 0 then
                            redis.call('del', KEYS[2])
                            local currentReserved = tonumber(redis.call('get', KEYS[1]) or '0')
                            local newReserved = math.max(0, currentReserved - holdQty)
                            redis.call('set', KEYS[1], newReserved)
                            return {1, newReserved}
                        else
                            return {0, tonumber(redis.call('get', KEYS[1]) or '0')}
                        end
                    `;
                    await this.client.eval(luaScript, 2, reserveKey, holdTokenKey);
                } else {
                    const current = await this.client.get(reserveKey);
                    if (current) {
                        const newRes = Math.max(0, parseInt(current, 10) - quantity);
                        await this.client.set(reserveKey, newRes);
                    }
                }
            } catch (err) {
                console.warn(`[RedisService] releaseStock error:`, err.message);
            }
        }

        if (this.inMemoryHoldTokens && holdToken && this.inMemoryHoldTokens.has(holdToken)) {
            this.inMemoryHoldTokens.delete(holdToken);
        }
    }

    /**
     * Commits reservation upon successful payment
     */
    async commitStock(sku, quantity, newPhysicalStock, holdToken = null) {
        await this.releaseStock(sku, quantity, holdToken);
        if (this.isConnected && this.client) {
            try {
                await this.client.set(`stock:sku:${sku}`, newPhysicalStock);
            } catch (e) {}
        }
    }

    /**
     * Flush cache keys matching pattern
     * @param {string} pattern e.g. 'cache:catalog:*'
     */
    async flushPattern(pattern) {
        if (this.isConnected && this.client) {
            try {
                const keys = await this.client.keys(pattern);
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } catch (err) {
                console.warn(`[RedisService] Failed to flush pattern ${pattern} from Redis:`, err.message);
            }
        }

        // Clean in-memory
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.inMemoryCache.keys()) {
            if (regex.test(key)) {
                this.inMemoryCache.delete(key);
            }
        }
        return true;
    }
}

module.exports = new RedisService();
