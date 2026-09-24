const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    paymentGateway: {
        type: String,
        required: true,
        enum: ['stripe', 'razorpay', 'mock', 'cod']
    },
    gatewayTransactionId: {
        type: String,
        required: true,
        unique: true
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending'
    },
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
