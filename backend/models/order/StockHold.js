const mongoose = require('mongoose');

const stockHoldSchema = new mongoose.Schema({
    variantId: {
        type: String,
        required: true,
        index: true
    },
    sessionOrUserId: {
        type: String,
        required: true,
        index: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // MongoDB native TTL index: automatically deletes expired holds!
    }
}, { timestamps: true });

module.exports = mongoose.model('StockHold', stockHoldSchema);
