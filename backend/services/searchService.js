const Product = require('../models/Product');
const Category = require('../models/Category');

class SearchService {
    /**
     * UC-1: Faceted catalog search and filtering in pure MongoDB
     */
    static async searchProducts(params = {}) {
        const {
            q = '',
            category = '',
            color = '',
            size = '',
            minPrice,
            maxPrice,
            inStock,
            brand = '',
            sort = 'newest',
            page = 1,
            limit = 20
        } = params;

        const query = { isPublished: true };

        // 1. Text Search
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            query.$or = [
                { title: regex },
                { description: regex },
                { brand: regex },
                { "variants.sku": regex }
            ];
        }

        // 2. Category Filter (Parent + Subcategories)
        if (category) {
            const catDoc = await Category.findOne({
                $or: [{ slug: category }, { name: new RegExp(`^${category}$`, 'i') }]
            });
            if (catDoc) {
                const childCats = await Category.find({ parent: catDoc._id }).select('_id');
                if (childCats && childCats.length > 0) {
                    query.category = { $in: [catDoc._id, ...childCats.map(c => c._id)] };
                } else {
                    query.category = catDoc._id;
                }
            } else {
                query.categoryName = new RegExp(category, 'i');
            }
        }

        // 3. Brand Filter
        if (brand) {
            query.brand = new RegExp(brand, 'i');
        }

        // 4. Variant Filters (price, attributes, inStock)
        const variantConditions = {};
        if (minPrice !== undefined && minPrice !== '') {
            variantConditions.price = { ...(variantConditions.price || {}), $gte: Number(minPrice) };
        }
        if (maxPrice !== undefined && maxPrice !== '') {
            variantConditions.price = { ...(variantConditions.price || {}), $lte: Number(maxPrice) };
        }
        if (inStock === 'true' || inStock === true) {
            variantConditions.stockQuantity = { $gt: 0 };
        }
        if (color) {
            variantConditions["attributes.color"] = new RegExp(`^${color}$`, 'i');
        }
        if (size) {
            variantConditions["attributes.size"] = new RegExp(`^${size}$`, 'i');
        }

        if (Object.keys(variantConditions).length > 0) {
            query.variants = { $elemMatch: variantConditions };
        }

        // 5. Sorting
        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { basePrice: 1 };
        if (sort === 'price_desc') sortOption = { basePrice: -1 };
        if (sort === 'title') sortOption = { title: 1 };

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const [total, products] = await Promise.all([
            Product.countDocuments(query),
            Product.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .lean()
        ]);

        // Format items
        const formattedItems = products.map(p => {
            const primaryImg = p.images?.find(img => img.isPrimary) || p.images?.[0] || null;
            return {
                ...p,
                product_id: p._id,
                primary_image: primaryImg
            };
        });

        // 6. Facets Aggregation
        const facets = await this.calculateFacets();

        return {
            items: formattedItems,
            facets,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        };
    }

    /**
     * Computes facet metadata across active MongoDB products
     */
    static async calculateFacets() {
        const categories = await Category.find({ isActive: true }).lean();
        const brands = await Product.distinct('brand', { isPublished: true, brand: { $ne: '' } });

        const products = await Product.find({ isPublished: true }).lean();
        const colorsSet = new Set();
        const sizesSet = new Set();
        let minPrice = Infinity;
        let maxPrice = 0;

        for (const p of products) {
            if (p.variants) {
                for (const v of p.variants) {
                    if (v.price < minPrice) minPrice = v.price;
                    if (v.price > maxPrice) maxPrice = v.price;
                    if (v.attributes?.color) colorsSet.add(v.attributes.color);
                    if (v.attributes?.size) sizesSet.add(v.attributes.size);
                }
            }
        }

        return {
            categories: categories.map(c => ({
                category_id: c._id,
                name: c.name,
                slug: c.slug
            })),
            brands,
            priceRange: {
                min: minPrice === Infinity ? 0 : minPrice,
                max: maxPrice
            },
            colors: Array.from(colorsSet),
            sizes: Array.from(sizesSet)
        };
    }
}

module.exports = SearchService;
