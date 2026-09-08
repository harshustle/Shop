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
    stockOnHand: {
        type: Number,
        default: 0,
        min: 0
    },
    stockAllocated: {
        type: Number,
        default: 0,
        min: 0
    },
    hsnCode: {
        type: String,
        default: '1905',
        trim: true
    },
    taxRatePercent: {
        type: Number,
        default: 5,
        min: 0,
        max: 28
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
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Available To Sell virtual = max(0, stockOnHand - stockAllocated)
variantSchema.virtual('availableToSell').get(function() {
    const onHand = this.stockOnHand ?? this.stockQuantity ?? 0;
    const allocated = this.stockAllocated ?? 0;
    return Math.max(0, onHand - allocated);
});

// Sync stockQuantity and stockOnHand
variantSchema.pre('validate', function(next) {
    if (this.stockOnHand === undefined || this.stockOnHand === 0) {
        this.stockOnHand = this.stockQuantity || 0;
    } else if (this.stockQuantity === undefined || this.stockQuantity === 0) {
        this.stockQuantity = this.stockOnHand || 0;
    }
    next();
});

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
