const mongoose = require('mongoose');

const orderItemSnapshotSchema = new mongoose.Schema({
    variantId: {
        type: String
    },
    skuSnapshot: {
        type: String,
        default: 'SKU-DIRECT'
    },
    productTitleSnapshot: {
        type: String,
        required: true
    },
    variantAttributesSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    unitPriceSnapshot: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalLinePrice: {
        type: Number,
        required: true,
        min: 0
    }
});

const legacyProductSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        default: 0
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    customerName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    // Backward-compatible products list for React UI
    products: [legacyProductSchema],
    // Enterprise order items with historical price snapshots (Section 2.2 & 7.1)
    items: [orderItemSnapshotSchema],
    subtotal: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        default: 'cod'
    },
    // Both status and orderStatus supported for full compatibility
    status: {
        type: String,
        enum: ['pending', 'processing', 'packed', 'out_for_delivery', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'packed', 'out_for_delivery', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'authorized', 'paid', 'refunded'],
        default: 'unpaid'
    },
    shippingAddress: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    billingAddress: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    trackingCarrier: {
        type: String,
        default: ''
    },
    trackingNumber: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Sync status and orderStatus on save
orderSchema.pre('save', function(next) {
    if (this.status && !this.orderStatus) {
        this.orderStatus = this.status;
    } else if (this.orderStatus && !this.status) {
        this.status = this.orderStatus;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
