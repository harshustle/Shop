const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    variantId: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    productTitle: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    attributes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    sessionToken: {
        type: String,
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '30d' } // Automatic TTL cleanup
    }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
