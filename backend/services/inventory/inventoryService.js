const Product = require('../../models/catalog/Product');
const StockHold = require('../../models/order/StockHold');
const redisService = require('../cache/redisService');

const { v4: uuidv4 } = require('uuid');

class InventoryService {
    /**
     * Cleans up expired stock holds and safely reverses allocated stock
     */
    static async cleanupExpiredHolds() {
        try {
            const expired = await StockHold.find({ expiresAt: { $lte: new Date() } });
            for (const h of expired) {
                const found = await this.findVariant(h.variantId);
                if (found && found.variant) {
                    await Product.updateOne(
                        { _id: found.product._id, "variants._id": found.variant._id },
                        { $inc: { "variants.$.stockAllocated": -h.quantity } }
                    );
                    await redisService.releaseStock(found.variant.sku, h.quantity, h.holdToken);
                }
            }
            if (expired.length > 0) {
                await StockHold.deleteMany({ expiresAt: { $lte: new Date() } });
            }
        } catch (err) {
            console.warn('[InventoryService] Error cleaning up expired holds:', err.message);
        }
    }

    /**
     * Finds variant across product catalog by variant._id or SKU
     */
    static async findVariant(variantIdOrSku) {
        let product = null;
        try {
            product = await Product.findOne({ "variants._id": variantIdOrSku });
        } catch (e) {}

        if (!product) {
            product = await Product.findOne({ "variants.sku": variantIdOrSku });
        }

        if (!product) return null;
        const variant = product.variants.find(v => 
            v._id.toString() === variantIdOrSku.toString() || v.sku === variantIdOrSku
        );

        return { product, variant };
    }

    /**
     * Computes available stock = physical stock minus currently active holds
     */
    static async getAvailableStock(variantIdOrSku) {
        await this.cleanupExpiredHolds();
        const found = await this.findVariant(variantIdOrSku);
        if (!found || !found.variant) return 0;

        const holds = await StockHold.find({
            variantId: found.variant._id.toString(),
            expiresAt: { $gt: new Date() }
        });

        const totalHeld = holds.reduce((sum, h) => sum + h.quantity, 0);
        return Math.max(0, found.variant.stockQuantity - totalHeld);
    }

    /**
     * Section 5.1 & 7.3: High-Concurrency Distributed Inventory Hold
     * 15-minute hold on inventory via Tokenized Redis Lua atomic lock + MongoDB StockHold
     */
    static async acquireStockHold(variantIdOrSku, requestedQty, sessionOrUserId, durationMinutes = 15, customToken = null) {
        await this.cleanupExpiredHolds();
        const found = await this.findVariant(variantIdOrSku);
        if (!found || !found.variant) {
            return { success: false, message: 'Variant not found' };
        }

        const physical = found.variant.stockOnHand ?? found.variant.stockQuantity ?? 0;
        const sku = found.variant.sku;
        const holdToken = customToken || `hold_${uuidv4()}`;

        // 1. High-concurrency Redis Lua atomic check & reserve with unique holdToken
        const redisLock = await redisService.reserveStock(sku, requestedQty, physical, durationMinutes * 60, holdToken);
        if (!redisLock.success) {
            return {
                success: false,
                message: `Insufficient stock for ${sku}. Available: ${redisLock.available}`,
                availableStock: redisLock.available
            };
        }

        // 2. Persist MongoDB StockHold record with ownership token for durability across restarts
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
        const hold = await StockHold.create({
            holdToken,
            variantId: found.variant._id.toString(),
            sessionOrUserId,
            quantity: requestedQty,
            expiresAt
        });

        // 3. Increment stockAllocated on variant
        await Product.updateOne(
            { _id: found.product._id, "variants._id": found.variant._id },
            { $inc: { "variants.$.stockAllocated": requestedQty } }
        );

        return {
            success: true,
            holdId: hold._id,
            holdToken,
            expiresAt: hold.expiresAt,
            quantity: requestedQty,
            sku,
            availableStock: redisLock.available
        };
    }

    /**
     * Releases hold by ID or holdToken with ownership validation
     */
    static async releaseHold(holdIdOrToken) {
        let hold = null;
        try {
            hold = await StockHold.findOne({
                $or: [
                    { holdToken: holdIdOrToken },
                    { _id: holdIdOrToken }
                ]
            });
        } catch (e) {
            hold = await StockHold.findOne({ holdToken: holdIdOrToken });
        }

        if (hold) {
            const found = await this.findVariant(hold.variantId);
            if (found && found.variant) {
                await redisService.releaseStock(found.variant.sku, hold.quantity, hold.holdToken);
                await Product.updateOne(
                    { _id: found.product._id, "variants._id": found.variant._id },
                    { $inc: { "variants.$.stockAllocated": -hold.quantity } }
                );
            }
            await StockHold.deleteOne({ _id: hold._id });
        }
    }

    /**
     * Releases all holds for a user or session
     */
    static async releaseSessionHolds(sessionOrUserId) {
        const holds = await StockHold.find({ sessionOrUserId });
        for (const hold of holds) {
            await this.releaseHold(hold.holdToken || hold._id);
        }
    }

    /**
     * Section 5.1 & 7.3: Production Atomic Stock Decrement
     * Decrements physical stock in MongoDB (with transaction support) and commits Redis reservation
     */
    static async atomicStockDecrement(variantIdOrSku, quantity, session = null, holdToken = null) {
        const found = await this.findVariant(variantIdOrSku);
        if (!found || !found.variant) {
            throw new Error(`Variant not found: ${variantIdOrSku}`);
        }

        const queryOptions = { new: true };
        if (session) {
            queryOptions.session = session;
        }

        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: found.product._id,
                "variants._id": found.variant._id,
                "variants.stockQuantity": { $gte: quantity }
            },
            {
                $inc: { 
                    "variants.$.stockQuantity": -quantity,
                    "variants.$.stockOnHand": -quantity,
                    "variants.$.stockAllocated": -quantity
                }
            },
            queryOptions
        );

        if (!updatedProduct) {
            throw new Error(`Concurrency conflict: Insufficient stock for SKU ${found.variant.sku}`);
        }

        const updatedVariant = updatedProduct.variants.find(v => v._id.toString() === found.variant._id.toString());
        const remainingPhysical = updatedVariant ? updatedVariant.stockQuantity : 0;

        // Commit in Redis
        await redisService.commitStock(found.variant.sku, quantity, remainingPhysical, holdToken);

        return true;
    }

    /**
     * UC-11: Monitor Stock Levels & Threshold Alerts
     */
    static async getLowStockAlerts() {
        const products = await Product.find({ "variants.isActive": true });
        const alerts = [];

        for (const p of products) {
            for (const v of p.variants) {
                if (v.isActive && v.stockQuantity <= v.safetyStock) {
                    alerts.push({
                        productId: p._id,
                        productTitle: p.title,
                        brand: p.brand,
                        category: p.categoryName,
                        variantId: v._id,
                        sku: v.sku,
                        stockQuantity: v.stockQuantity,
                        safetyStock: v.safetyStock,
                        attributes: v.attributes
                    });
                }
            }
        }

        return alerts;
    }

    /**
     * Quick restock / update physical stock of a variant
     */
    static async updateStock(variantId, newQuantity) {
        const product = await Product.findOneAndUpdate(
            { "variants._id": variantId },
            { $set: { "variants.$.stockQuantity": Number(newQuantity) } },
            { new: true }
        );
        return product;
    }
}

module.exports = InventoryService;
