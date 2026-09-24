const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../../middleware/auth');
const { uploadMediaAsset, getPresignedUploadUrl } = require('../../controllers/media/uploadController');

// Multer memory storage for in-memory streaming directly to S3
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Admin media upload endpoint (Multipart stream)
router.post('/', auth, upload.single('file'), uploadMediaAsset);

// Section 8: S3 Direct Presigned PUT URL Generator
router.post('/presigned-url', auth, getPresignedUploadUrl);

module.exports = router;

