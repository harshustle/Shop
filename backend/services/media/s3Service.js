const path = require('path');
const fs = require('fs');

/**
 * S3 Service supporting AWS S3 bucket storage with automatic local filesystem fallback.
 * 
 * Target S3 Hierarchy:
 * - products/{productId}/{filename}
 * - categories/{categorySlug}/{filename}
 * - banners/{filename}
 * - uploads/{filename}
 */
class S3Service {
    constructor() {
        this.bucket = process.env.AWS_S3_BUCKET;
        this.region = process.env.AWS_REGION || 'ap-south-1';
        this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        this.isCloudEnabled = !!(this.bucket && this.accessKeyId && this.secretAccessKey);

        // Local storage directory initialization
        this.localUploadDir = path.resolve(__dirname, '../uploads');
        if (!fs.existsSync(this.localUploadDir)) {
            fs.mkdirSync(this.localUploadDir, { recursive: true });
        }

        // Initialize AWS S3 client if credentials exist
        this.s3Client = null;
        if (this.isCloudEnabled) {
            try {
                const { S3Client } = require('@aws-sdk/client-s3');
                this.s3Client = new S3Client({
                    region: this.region,
                    credentials: {
                        accessKeyId: this.accessKeyId,
                        secretAccessKey: this.secretAccessKey
                    }
                });
                console.log(`[S3Service] Initialized with AWS S3 Bucket: ${this.bucket} (${this.region})`);
            } catch (err) {
                console.warn('[S3Service] @aws-sdk/client-s3 not installed or failed to initialize, falling back to local storage.');
                this.isCloudEnabled = false;
            }
        } else {
            console.log('[S3Service] Running in local storage mode (uploads stored in backend/uploads/)');
        }
    }

    /**
     * Uploads file buffer or stream to S3 or local fallback
     * @param {Object} options
     * @param {Buffer|ReadableStream} options.fileBuffer File content buffer
     * @param {string} options.folder Target folder: 'products' | 'categories' | 'banners' | 'uploads'
     * @param {string} [options.subfolder] e.g. productId or categorySlug
     * @param {string} options.filename e.g. 'main.webp'
     * @param {string} [options.mimeType] MIME type (default 'image/webp')
     */
    async uploadFile({ fileBuffer, folder = 'uploads', subfolder = '', filename, mimeType = 'image/webp' }) {
        const cleanFolder = folder.replace(/\/+$/, '');
        const cleanSub = subfolder ? subfolder.replace(/^\/+|\/+$/g, '') : '';
        const key = cleanSub 
            ? `${cleanFolder}/${cleanSub}/${filename}` 
            : `${cleanFolder}/${filename}`;

        if (this.isCloudEnabled && this.s3Client) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                await this.s3Client.send(new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: fileBuffer,
                    ContentType: mimeType
                }));

                const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
                return {
                    success: true,
                    key,
                    url: publicUrl,
                    storage: 's3',
                    bucket: this.bucket
                };
            } catch (cloudErr) {
                console.error('[S3Service] AWS upload failed, falling back to local disk:', cloudErr.message);
            }
        }

        // Local fallback storage
        const destinationDir = path.resolve(this.localUploadDir, cleanFolder, cleanSub);
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }

        const localFilePath = path.join(destinationDir, filename);
        await fs.promises.writeFile(localFilePath, fileBuffer);

        const localUrl = `/uploads/${key}`;
        return {
            success: true,
            key,
            url: localUrl,
            storage: 'local',
            filePath: localFilePath
        };
    }

    /**
     * Section 8: S3 Direct Presigned PUT URL Generator
     * Generates a 60-second presigned URL for direct browser-to-S3 uploads,
     * completely bypassing Node.js server memory and CPU buffers.
     * 
     * @param {Object} options
     * @param {string} options.folder 'products' | 'categories' | 'banners' | 'uploads'
     * @param {string} options.filename e.g. 'hero-image.webp'
     * @param {string} options.mimeType e.g. 'image/webp'
     * @param {number} [options.expiresInSeconds] Default: 60
     * @returns {Promise<Object>}
     */
    async generatePresignedPutUrl({ folder = 'uploads', filename, mimeType = 'image/webp', expiresInSeconds = 60 }) {
        const cleanFolder = folder.replace(/\/+$/, '');
        const cleanFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const key = `${cleanFolder}/${cleanFilename}`;

        if (this.isCloudEnabled && this.s3Client) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

                const command = new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    ContentType: mimeType
                });

                const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
                const cdnUrl = process.env.CLOUDFRONT_URL 
                    ? `${process.env.CLOUDFRONT_URL.replace(/\/+$/, '')}/${key}`
                    : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

                return {
                    success: true,
                    mode: 's3',
                    key,
                    uploadUrl,
                    fileUrl: cdnUrl,
                    expiresIn: expiresInSeconds,
                    contentType: mimeType
                };
            } catch (err) {
                console.error('[S3Service] Presigned URL generation failed:', err.message);
            }
        }

        // Seamless Local Fallback
        return {
            success: true,
            mode: 'local',
            key,
            uploadUrl: '/api/v1/uploads',
            fileUrl: `/uploads/${key}`,
            expiresIn: 3600,
            contentType: mimeType
        };
    }

    /**
     * Delete file by key
     */
    async deleteFile(key) {
        if (this.isCloudEnabled && this.s3Client) {
            try {
                const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
                await this.s3Client.send(new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key
                }));
                return { success: true, storage: 's3' };
            } catch (err) {
                console.error('[S3Service] AWS S3 Delete failed:', err.message);
            }
        }

        // Local deletion
        const localFilePath = path.resolve(this.localUploadDir, key);
        if (fs.existsSync(localFilePath)) {
            await fs.promises.unlink(localFilePath);
            return { success: true, storage: 'local' };
        }

        return { success: true, message: 'File did not exist locally' };
    }
}

module.exports = new S3Service();
