const Product = require('../models/Product');
const StockHold = require('../models/StockHold');

class InventoryService {
    /**
     * Cleans up expired stock holds (MongoDB TTL index does this automatically, but manual cleanup ensures immediate consistency)
     */
    static async cleanupExpiredHolds() {
        await StockHold.deleteMany({ expiresAt: { $lte: new Date() } });
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
     * Section 7.3: Distributed Cart Hold / Stock Reservation
     * 15-minute hold on inventory
     */
    static async acquireStockHold(variantIdOrSku, requestedQty, sessionOrUserId, durationMinutes = 15) {
        await this.cleanupExpiredHolds();
        const found = await this.findVariant(variantIdOrSku);
        if (!found || !found.variant) {
            return { success: false, message: 'Variant not found' };
        }

        const available = await this.getAvailableStock(found.variant._id.toString());
        if (available < requestedQty) {
            return {
                success: false,
                message: `Insufficient stock. Requested: ${requestedQty}, Available: ${available}`,
                availableStock: available
            };
        }

        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
        const hold = await StockHold.create({
            variantId: found.variant._id.toString(),
            sessionOrUserId,
            quantity: requestedQty,
            expiresAt
        });

        return {
            success: true,
            holdId: hold._id,
            expiresAt: hold.expiresAt,
            quantity: requestedQty
        };
    }

    /**
     * Releases hold by ID
     */
    static async releaseHold(holdId) {
        await StockHold.findByIdAndDelete(holdId);
    }

    /**
     * Releases all holds for a user or session
     */
    static async releaseSessionHolds(sessionOrUserId) {
        await StockHold.deleteMany({ sessionOrUserId });
    }

    /**
     * Section 7.3: Production Solution 1: Atomic Database Updates in MongoDB
     * Uses MongoDB atomic $inc and { $gte: quantity } check
     */
    static async atomicStockDecrement(variantIdOrSku, quantity) {
        const found = await this.findVariant(variantIdOrSku);
        if (!found || !found.variant) {
            throw new Error(`Variant not found: ${variantIdOrSku}`);
        }

        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: found.product._id,
                "variants._id": found.variant._id,
                "variants.stockQuantity": { $gte: quantity }
            },
            {
                $inc: { "variants.$.stockQuantity": -quantity }
            },
            { new: true }
        );

        if (!updatedProduct) {
            throw new Error(`Concurrency conflict: Insufficient stock for SKU ${found.variant.sku}`);
        }

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
