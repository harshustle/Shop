const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../../middleware/auth');
const superAdminOnly = require('../../middleware/superAdminOnly');
const {
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
} = require('../../controllers/catalog/catalogController');

// Multer storage for temporary CSV upload
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// Public Catalog Endpoints (UC-1 & UC-2)
router.get('/search', searchCatalog);
router.get('/categories', getCategories);
router.get('/products/:idOrSlug', getProductDetails);
router.get('/variants/:variantId/stock', getVariantStock);

// Admin Category Management
router.post('/categories', auth, superAdminOnly, createCategory);
router.put('/categories/:id', auth, superAdminOnly, updateCategory);
router.delete('/categories/:id', auth, superAdminOnly, deleteCategory);

// Admin / Vendor Product & Ingestion Endpoints (UC-8, UC-9, UC-10)
router.post('/products', auth, superAdminOnly, createProduct);
router.put('/products/:id', auth, superAdminOnly, updateProduct);
router.delete('/products/:id', auth, superAdminOnly, deleteProduct);
router.post('/products/:id/variants', auth, superAdminOnly, addVariant);
router.post('/products/:id/images', auth, superAdminOnly, addProductImage);
router.patch('/variants/:variantId/stock', auth, superAdminOnly, quickRestockVariant);

// Asynchronous Chunked CSV Ingestion (UC-8)
router.post('/bulk-upload', auth, superAdminOnly, upload.single('file'), bulkUploadCsv);
router.get('/bulk-upload/:jobId', auth, superAdminOnly, getBulkJobStatus);

module.exports = router;
