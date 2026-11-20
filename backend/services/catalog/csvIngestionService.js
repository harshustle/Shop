const fs = require('fs');
const csv = require('csv-parser');
const Product = require('../../models/catalog/Product');
const Category = require('../../models/catalog/Category');
const redisService = require('../cache/redisService');
const { v4: uuidv4 } = require('uuid');

const jobsStore = new Map();

class CsvIngestionService {
    static createJobTicket() {
        const jobId = `job_csv_${uuidv4()}`;
        const job = {
            jobId,
            status: 'pending',
            totalRows: 0,
            processedRows: 0,
            failedRows: 0,
            progressPercent: 0,
            errors: [],
            createdAt: new Date().toISOString()
        };
        jobsStore.set(jobId, job);
        return job;
    }

    static getJobStatus(jobId) {
        return jobsStore.get(jobId) || null;
    }

    static async processCsvFile(filePath, jobId) {
        const job = jobsStore.get(jobId);
        if (!job) return;

        job.status = 'processing';
        const CHUNK_SIZE = 500;
        let rowBuffer = [];

        const stream = fs.createReadStream(filePath).pipe(csv());

        try {
            for await (const row of stream) {
                job.totalRows++;
                rowBuffer.push(row);

                if (rowBuffer.length >= CHUNK_SIZE) {
                    await this.processChunk(rowBuffer, job);
                    rowBuffer = [];
                    job.progressPercent = Math.round((job.processedRows / job.totalRows) * 100);
                }
            }

            if (rowBuffer.length > 0) {
                await this.processChunk(rowBuffer, job);
            }

            job.status = 'completed';
            job.progressPercent = 100;
            job.completedAt = new Date().toISOString();
            await redisService.flushPattern('cache:catalog:*').catch(() => {});
            console.log(`[MongoDB CSV Ingestion] Job ${jobId} finished: ${job.processedRows} variants ingested.`);
        } catch (error) {
            console.error(`[MongoDB CSV Ingestion] Job ${jobId} failed:`, error);
            job.status = 'failed';
            job.errors.push({ general: error.message });
        } finally {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) {}
        }
    }

    static async processChunk(rows, job) {
        for (const row of rows) {
            try {
                const normalizedRow = Object.entries(row).reduce((result, [key, value]) => {
                    const normalizedKey = String(key)
                        .replace(/^\uFEFF/, '')
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_|_$/g, '');
                    result[normalizedKey] = typeof value === 'string' ? value.trim() : value;
                    return result;
                }, {});

                const title = normalizedRow.title || normalizedRow.product_title;
                const sku = String(normalizedRow.sku || '').toUpperCase();
                const price = parseFloat(normalizedRow.price);

                if (!title || !sku || isNaN(price) || price < 0) {
                    job.failedRows++;
                    job.errors.push({
                        row: job.processedRows + 1,
                        sku: sku || 'UNKNOWN',
                        error: 'Missing required title, SKU, or positive price'
                    });
                    continue;
                }

                const baseSlug = (normalizedRow.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                const brand = normalizedRow.brand || '';
                const description = normalizedRow.description || '';
                const stock = parseInt(normalizedRow.stock_quantity || normalizedRow.current_stock || normalizedRow.stock || 0, 10);
                const comparePrice = normalizedRow.compare_at_price ? parseFloat(normalizedRow.compare_at_price) : undefined;
                const categoryName = normalizedRow.category_name || normalizedRow.category || 'General';

                // 1. Find or create category in MongoDB
                let category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
                if (!category) {
                    const catSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    category = await Category.create({ name: categoryName, slug: catSlug });
                }

                // 2. Upsert parent product
                let product = await Product.findOne({
                    $or: [{ slug: baseSlug }, { title: new RegExp(`^${title}$`, 'i') }]
                });

                if (!product) {
                    product = await Product.create({
                        title,
                        slug: baseSlug,
                        description,
                        brand,
                        basePrice: price,
                        category: category._id,
                        categoryName: category.name,
                        isPublished: true,
                        variants: []
                    });
                }

                // 3. Upsert variant inside product
                const attributes = {
                    color: normalizedRow.color || '',
                    size: normalizedRow.size || '',
                    material: normalizedRow.material || ''
                };

                const existingVariantIndex = product.variants.findIndex(v => v.sku === sku);
                if (existingVariantIndex > -1) {
                    product.variants[existingVariantIndex].price = price;
                    product.variants[existingVariantIndex].compareAtPrice = comparePrice;
                    product.variants[existingVariantIndex].stockQuantity = stock;
                    product.variants[existingVariantIndex].attributes = attributes;
                } else {
                    product.variants.push({
                        sku,
                        price,
                        compareAtPrice: comparePrice,
                        stockQuantity: stock,
                        safetyStock: 5,
                        attributes,
                        isActive: true
                    });
                }

                await product.save();
                job.processedRows++;
            } catch (err) {
                job.failedRows++;
                job.errors.push({
                    row: job.processedRows + 1,
                    sku: row.sku || row.SKU || '',
                    error: err.message
                });
            }
        }
    }
}

module.exports = CsvIngestionService;
