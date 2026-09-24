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
    // Razorpay Financial Core
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    // Indian GST Breakdown
    taxBreakdown: {
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 }
    },
    // Enterprise Fulfillment State Machine
    fulfillmentStatus: {
        type: String,
        enum: ['UNFULFILLED', 'PACKED', 'MANIFESTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO_INITIATED', 'RETURNED', 'CANCELLED'],
        default: 'UNFULFILLED'
    },
    // In-House & Carrier Logistics
    shippingLogistics: {
        courierName: { type: String, default: 'FreshCart Express Fleet' },
        awbCode: { type: String, default: '' },
        labelUrl: { type: String, default: '' },
        manifestId: { type: String, default: '' },
        riderName: { type: String, default: '' },
        riderPhone: { type: String, default: '' },
        vehicleNumber: { type: String, default: '' },
        pickupScheduledDate: { type: Date, default: null },
        estimatedDeliveryDate: { type: Date, default: null },
        trackingHistory: [
            {
                status: { type: String },
                activity: { type: String },
                location: { type: String, default: 'Local Hub' },
                timestamp: { type: Date, default: Date.now }
            }
        ]
    },
    // RMA & Post-Purchase Reverse Logistics
    rma: {
        returnRequested: { type: Boolean, default: false },
        returnReason: { type: String, default: '' },
        rmaStatus: {
            type: String,
            enum: ['NONE', 'PENDING_APPROVAL', 'APPROVED', 'PICKUP_SCHEDULED', 'IN_INSPECTION', 'REFUNDED', 'REJECTED'],
            default: 'NONE'
        },
        reverseAwb: { type: String, default: '' },
        refundId: { type: String, default: '' }
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
