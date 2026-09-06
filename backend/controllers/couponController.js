const Coupon = require('../models/Coupon');

/**
 * Apply coupon code and calculate discount
 * POST /api/coupons/apply
 */
const applyCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Please enter a coupon code' });
        }

        const cleanCode = code.trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: cleanCode });

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid coupon code. Please verify and try again.' });
        }

        const cartAmount = Number(subtotal) || 0;
        const validity = coupon.isValid(cartAmount);
        if (!validity.valid) {
            return res.status(400).json({ error: validity.message });
        }

        const discountAmount = coupon.calculateDiscount(cartAmount);
        const finalAmount = Math.max(0, cartAmount - discountAmount);

        res.json({
            success: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: Number(discountAmount.toFixed(2)),
            finalAmount: Number(finalAmount.toFixed(2)),
            message: `Coupon ${coupon.code} applied successfully! You saved ₹${discountAmount.toFixed(2)}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get active promotional coupons for store banners
 * GET /api/coupons/active
 */
const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gt: now }
        }).select('code description discountType discountValue minOrderAmount maxDiscountAmount expiryDate').limit(5);

        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: List all coupons
 * GET /api/coupons/admin/all
 */
const getAdminCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Create new coupon
 * POST /api/coupons/admin
 */
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimit
        } = req.body;

        if (!code || !discountValue || !expiryDate) {
            return res.status(400).json({ error: 'Code, discount value, and expiration date are required' });
        }

        const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
        if (existing) {
            return res.status(409).json({ error: 'A coupon with this code already exists' });
        }

        const coupon = await Coupon.create({
            code: code.trim().toUpperCase(),
            description: description || '',
            discountType: discountType || 'percentage',
            discountValue: Number(discountValue),
            minOrderAmount: Number(minOrderAmount) || 0,
            maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
            expiryDate: new Date(expiryDate),
            usageLimit: Number(usageLimit) || 1000
        });

        res.status(201).json({
            message: 'Coupon created successfully',
            coupon
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Super Admin: Toggle coupon status
 * PATCH /api/coupons/admin/:id/toggle
 */
const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({ message: `Coupon is now ${coupon.isActive ? 'Active' : 'Inactive'}`, coupon });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Delete coupon
 * DELETE /api/coupons/admin/:id
 */
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await Coupon.findByIdAndDelete(id);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    applyCoupon,
    getActiveCoupons,
    getAdminCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon
};
