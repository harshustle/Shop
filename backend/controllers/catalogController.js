const Product = require('../models/Product');
const Category = require('../models/Category');
const SearchService = require('../services/searchService');
const InventoryService = require('../services/inventoryService');
const CsvIngestionService = require('../services/csvIngestionService');
const redisService = require('../services/redisService');

/**
 * UC-1: Search & Filter Catalog with Facets in MongoDB (Cached in Redis)
 */
const searchCatalog = async (req, res) => {
    try {
        const cacheKey = `cache:catalog:search:${JSON.stringify(req.query || {})}`;
        const cached = await redisService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const results = await SearchService.searchProducts(req.query);
        await redisService.set(cacheKey, results, 60); // 60-second hot cache
        res.json(results);
    } catch (error) {
        console.error('MongoDB Catalog search error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get category list (Cached in Redis for 5 minutes)
 */
const getCategories = async (req, res) => {
    try {
        const cacheKey = 'cache:categories:active';
        const cached = await redisService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const categories = await Category.find({ isActive: true })
            .populate('parent', 'name slug categoryId')
            .sort({ categoryId: 1, name: 1 })
            .lean();

        await redisService.set(cacheKey, categories, 300); // 5-minute TTL
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * UC-2: Select Variants & View Real-time Stock
 */
const getProductDetails = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        let product = null;

        if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(idOrSlug).lean();
        }
        if (!product) {
            product = await Product.findOne({ slug: idOrSlug }).lean();
        }

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const variantsWithStock = await Promise.all(product.variants.map(async (v) => {
            const availableStock = await InventoryService.getAvailableStock(v._id.toString());
            return {
                ...v,
                variant_id: v._id,
                available_stock: availableStock
            };
        }));

        res.json({
            ...product,
            product_id: product._id,
            variants: variantsWithStock
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Real-time stock for a specific variant
 */
const getVariantStock = async (req, res) => {
    try {
        const { variantId } = req.params;
        const found = await InventoryService.findVariant(variantId);
        if (!found || !found.variant) {
            return res.status(404).json({ error: 'Variant not found' });
        }

        const available = await InventoryService.getAvailableStock(found.variant._id.toString());
        res.json({
            variant_id: found.variant._id,
            sku: found.variant.sku,
            physical_stock: found.variant.stockQuantity,
            available_stock: available,
            is_in_stock: available > 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * UC-9: Single Product & Variant CRUD (Admin)
 */
const createProduct = async (req, res) => {
    try {
        const { title, slug, description, brand, base_price, category_id, category_name, variants = [], images = [] } = req.body;

        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const normalizedVariants = variants.map(v => ({
            sku: v.sku.toUpperCase(),
            barcode: v.barcode,
            price: Number(v.price || base_price || 0),
            compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : undefined,
            costPrice: v.cost_price ? Number(v.cost_price) : undefined,
            stockQuantity: Number(v.stock_quantity || 0),
            safetyStock: Number(v.safety_stock || 5),
            attributes: v.attributes || {},
            weightGrams: Number(v.weight_grams || 0),
            isActive: true
        }));

        const normalizedImages = images.map((img, idx) => ({
            imageUrl: typeof img === 'string' ? img : img.url || img.imageUrl,
            altText: title,
            displayOrder: idx,
            isPrimary: idx === 0
        }));

        const product = await Product.create({
            title,
            slug: finalSlug,
            description: description || '',
            brand: brand || '',
            basePrice: Number(base_price || 0),
            category: category_id && category_id.match(/^[0-9a-fA-F]{24}$/) ? category_id : null,
            categoryName: category_name || 'General',
            isPublished: true,
            variants: normalizedVariants,
            images: normalizedImages
        });

        // Invalidate catalog search cache
        await redisService.flushPattern('cache:catalog:*').catch(() => {});

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(400).json({ error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        await redisService.flushPattern('cache:catalog:*').catch(() => {});
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Add variant to existing product
 */
const addVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { sku, barcode, price, compare_at_price, stock_quantity, safety_stock, attributes, weight_grams } = req.body;

        product.variants.push({
            sku: sku.toUpperCase(),
            barcode,
            price: Number(price),
            compareAtPrice: compare_at_price ? Number(compare_at_price) : undefined,
            stockQuantity: Number(stock_quantity || 0),
            safetyStock: Number(safety_stock || 5),
            attributes: attributes || {},
            weightGrams: Number(weight_grams || 0),
            isActive: true
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * UC-10: Upload Product Media Assets
 */
const addProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { image_url, alt_text, is_primary } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (is_primary) {
            product.images.forEach(img => img.isPrimary = false);
        }

        product.images.push({
            imageUrl: image_url,
            altText: alt_text || product.title,
            isPrimary: !!is_primary,
            displayOrder: product.images.length
        });

        await product.save();
        res.status(201).json(product.images);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * UC-8: Asynchronous Chunked CSV Bulk Upload
 */
const bulkUploadCsv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a valid .csv file' });
        }

        const jobTicket = CsvIngestionService.createJobTicket();
        CsvIngestionService.processCsvFile(req.file.path, jobTicket.jobId);

        res.status(202).json({
            message: 'Bulk ingestion job accepted and queued for processing',
            jobId: jobTicket.jobId,
            status: jobTicket.status
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getBulkJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = CsvIngestionService.getJobStatus(jobId);
        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Category Management (SuperAdmin)
 */
const createCategory = async (req, res) => {
    try {
        const { name, slug, description, parentId, parent } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        let parentDoc = null;
        if (parent && parent.match(/^[0-9a-fA-F]{24}$/)) {
            parentDoc = await Category.findById(parent);
        } else if (parentId) {
            parentDoc = await Category.findOne({ categoryId: Number(parentId) });
        }

        const newCat = await Category.create({
            name,
            slug: finalSlug,
            description: description || '',
            parentId: parentDoc ? (parentDoc.categoryId || null) : (parentId ? Number(parentId) : null),
            parent: parentDoc ? parentDoc._id : null,
            isActive: true
        });

        res.status(201).json(newCat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const updated = await Category.findByIdAndUpdate(
            id,
            { ...(name && { name }), ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }) },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Category not found' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const quickRestockVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { stockQuantity } = req.body;
        if (stockQuantity === undefined || stockQuantity < 0) {
            return res.status(400).json({ error: 'Valid stock quantity required' });
        }
        const updatedProduct = await InventoryService.updateStock(variantId, stockQuantity);
        if (!updatedProduct) return res.status(404).json({ error: 'Variant not found' });
        res.json({ message: 'Stock updated successfully', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    searchCatalog,
    getCategories,
    getProductDetails,
    getVariantStock,
    createProduct,
    updateProduct,
    deleteProduct,
    addVariant,
    addProductImage,
    bulkUploadCsv,
    getBulkJobStatus,
    createCategory,
    updateCategory,
    deleteCategory,
    quickRestockVariant
};
