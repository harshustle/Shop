const s3Service = require('../../services/media/s3Service');
const path = require('path');

const uploadMediaAsset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No media file provided for upload' });
        }

        const folder = req.body.folder || req.query.folder || 'uploads';
        const subfolder = req.body.subfolder || req.query.subfolder || '';
        const originalName = req.file.originalname || `asset_${Date.now()}`;
        const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

        const uploadResult = await s3Service.uploadFile({
            fileBuffer: req.file.buffer,
            folder,
            subfolder,
            filename: sanitizedFilename,
            mimeType: req.file.mimetype
        });

        res.status(201).json({
            message: 'Media asset uploaded successfully',
            ...uploadResult
        });
    } catch (error) {
        console.error('Upload asset error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPresignedUploadUrl = async (req, res) => {
    try {
        const { folder = 'products', filename, mimeType = 'image/webp', expiresInSeconds = 60 } = req.body;
        if (!filename) {
            return res.status(400).json({ error: 'filename is required for presigned URL generation' });
        }

        const presignedResult = await s3Service.generatePresignedPutUrl({
            folder,
            filename,
            mimeType,
            expiresInSeconds
        });

        res.json(presignedResult);
    } catch (error) {
        console.error('Presigned URL error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadMediaAsset,
    getPresignedUploadUrl
};

