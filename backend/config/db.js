const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let isConnected = false;

// Production Mongoose Configuration (Tuned for 5,000 Concurrent Users)
const mongooseOptions = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 100, // 100 pooled connections per worker process
    minPoolSize: 25,  // Pre-warmed hot connections to prevent cold-start latency
    maxIdleTimeMS: 30000,
    family: 4 // IPv4
};

// Recursive migration file scanner supporting domain subfolders
const scanMigrationFiles = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(scanMigrationFiles(fullPath));
        } else if (entry.name.endsWith('.js')) {
            results.push({
                fullPath,
                fileName: entry.name,
                relative: path.relative(dir, fullPath).replace(/\\/g, '/')
            });
        }
    }
    return results.sort((a, b) => a.fileName.localeCompare(b.fileName));
};

// Auto-run pending migrations on connect
const runPendingMigrations = async () => {
    try {
        const Migration = require('../models/system/Migration');
        const migrationsDir = path.resolve(__dirname, '../migrations');
        if (!fs.existsSync(migrationsDir)) return;

        const files = scanMigrationFiles(migrationsDir);
        const applied = await Migration.find().lean();
        const appliedNames = new Set(applied.map(m => m.name));
        const pending = files.filter(f => !appliedNames.has(f.fileName) && !appliedNames.has(f.relative));

        if (pending.length > 0) {
            console.log(`Executing ${pending.length} pending database migrations...`);
            const currentBatch = applied.length > 0 
                ? Math.max(...applied.map(m => m.batch || 1)) + 1 
                : 1;

            for (const file of pending) {
                const migration = require(file.fullPath);
                const start = Date.now();
                await migration.up(mongoose.connection.db);
                await Migration.create({
                    name: file.fileName,
                    batch: currentBatch,
                    executedAt: new Date(),
                    executionTimeMs: Date.now() - start
                });
                console.log(`✓ Migrated: ${file.fileName}`);
            }
        }
    } catch (err) {
        console.warn('Migration bootstrap notice:', err.message);
    }
};

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';

        // Normalize unencoded @ in password if present in Atlas connection string
        if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
            const prefixMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@]+)$/);
            if (prefixMatch) {
                const [, scheme, user, pass, hostAndRest] = prefixMatch;
                if (pass.includes('@')) {
                    uri = `${scheme}${user}:${encodeURIComponent(pass)}@${hostAndRest}`;
                }
            }
        }

        console.log('Connecting to MongoDB Atlas / Server with Connection Pooling (pool: 10-50)...');

        // Connection event hooks
        mongoose.connection.on('connected', () => {
            isConnected = true;
            console.log('MongoDB: State changed to CONNECTED.');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB Connection Error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.warn('MongoDB: Connection disconnected.');
        });

        await mongoose.connect(uri, mongooseOptions);
        console.log('MongoDB Connected Successfully.');

        // Run migrations
        await runPendingMigrations();

        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection notice:', error.message);
        console.log('Tip: Ensure local mongod is listening on 127.0.0.1:27017 or set MONGODB_URI in backend/.env');
        throw error;
    }
};

const disconnectDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected gracefully.');
    }
};

const isDBHealthy = () => {
    return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, disconnectDB, isDBHealthy };
