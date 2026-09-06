/**
 * Redis Cache & Session Service with Zero-Downtime In-Memory Fallback
 */
class RedisService {
    constructor() {
        this.redisUrl = process.env.REDIS_URL;
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
                this.client = new Redis(this.redisUrl, {
                    maxRetriesPerRequest: 1,
                    retryStrategy: (times) => {
                        if (times > 3) return null; // stop retrying after 3 attempts
                        return Math.min(times * 200, 1000);
                    },
                    enableReadyCheck: true,
                    lazyConnect: true
                });

                await this.client.connect();
                this.isConnected = true;
                console.log(`[RedisService] Connected to Redis instance at ${this.redisUrl}`);

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
