const mongoose = require('mongoose');

const DeliveryZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: 'Primary Delivery Zone'
    },
    hubName: {
        type: String,
        default: 'FreshCart Central Hub'
    },
    hubAddress: {
        type: String,
        default: 'Gandhi Nagar, Company Bagh, Basti, Uttar Pradesh, 272001'
    },
    center: {
        lat: { type: Number, required: true, default: 26.8028 },
        lng: { type: Number, required: true, default: 82.7634 }
    },
    polygon: {
        type: {
            type: String,
            enum: ['Polygon'],
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]], // GeoJSON Polygon: Array of linear ring coordinate arrays [lng, lat]
            required: true
        }
    },
    areaSqKm: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    estimatedDeliveryMinutes: {
        type: Number,
        default: 15
    },
    quickPlaces: [{
        name: { type: String, required: true, trim: true },
        address: { type: String, default: '', trim: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        radiusKm: { type: Number, default: 5, min: 0.5, max: 50 },
        isEnabled: { type: Boolean, default: true }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('DeliveryZone', DeliveryZoneSchema);
