const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        min: [1, 'Discount value must be at least 1']
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null // Optional cap for percentage discounts
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiration date is required']
    },
    usageLimit: {
        type: Number,
        default: 1000 // Total times this coupon can be redeemed
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, { timestamps: true });

// Check if coupon is currently valid for a given subtotal
couponSchema.methods.isValid = function(subtotal = 0) {
    const now = new Date();
    if (!this.isActive) return { valid: false, message: 'Coupon is inactive or disabled' };
    if (this.startDate && now < this.startDate) return { valid: false, message: 'Coupon offer has not started yet' };
    if (this.expiryDate && now > this.expiryDate) return { valid: false, message: 'Coupon code has expired' };
    if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit has been reached' };
    if (subtotal < this.minOrderAmount) {
        return { 
            valid: false, 
            message: `Minimum order amount of ₹${this.minOrderAmount} required to use this coupon` 
        };
    }
    return { valid: true };
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(subtotal = 0) {
    let discount = 0;
    if (this.discountType === 'percentage') {
        discount = (subtotal * this.discountValue) / 100;
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    } else {
        discount = this.discountValue;
    }
    return Math.min(discount, subtotal);
};

module.exports = mongoose.model('Coupon', couponSchema);
