const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadMediaAsset } = require('../controllers/uploadController');

// Multer memory storage for in-memory streaming directly to S3
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Admin media upload endpoint
router.post('/', auth, upload.single('file'), uploadMediaAsset);

module.exports = router;
