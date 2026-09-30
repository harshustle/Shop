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
        default: 'Tamkuhi Raj, Kushinagar, UP'
    },
    center: {
        lat: { type: Number, required: true, default: 26.6924 },
        lng: { type: Number, required: true, default: 84.2868 }
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeliveryZone', DeliveryZoneSchema);
