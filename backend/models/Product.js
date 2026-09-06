const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },
    costPrice: {
        type: Number,
        min: 0
    },
    stockQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    safetyStock: {
        type: Number,
        default: 5
    },
    attributes: {
        type: mongoose.Schema.Types.Mixed,
        default: {} // e.g. { color: "Midnight Blue", size: "XXL", material: "Cotton" }
    },
    weightGrams: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const imageSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    altText: {
        type: String,
        default: ''
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    isPrimary: {
        type: Boolean,
        default: false
    }
});

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    brand: {
        type: String,
        trim: true,
        default: ''
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    categoryName: {
        type: String,
        default: 'General'
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    variants: [variantSchema],
    images: [imageSchema]
}, { timestamps: true });

// Indexes for rapid catalog search and SKU lookup
productSchema.index({ slug: 1 });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ title: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
