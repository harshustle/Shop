const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    products: [{
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'packed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
