const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        default: '',
        trim: true
    },
    badge: {
        type: String,
        default: 'Limited Offer'
    },
    imageUrl: {
        type: String,
        required: true
    },
    targetUrl: {
        type: String,
        default: '/shop'
    },
    bgColor: {
        type: String,
        default: '#E8F8F0' // Light emerald
    },
    textColor: {
        type: String,
        default: '#0F172A'
    },
    btnText: {
        type: String,
        default: 'Shop Now'
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
