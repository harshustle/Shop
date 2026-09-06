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

// Auto-run pending migrations on connect
const runPendingMigrations = async () => {
    try {
        const Migration = require('../models/Migration');
        const migrationsDir = path.resolve(__dirname, '../migrations');
        if (!fs.existsSync(migrationsDir)) return;

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.js'))
            .sort();

        const applied = await Migration.find().lean();
        const appliedNames = new Set(applied.map(m => m.name));
        const pending = files.filter(f => !appliedNames.has(f));

        if (pending.length > 0) {
            console.log(`Executing ${pending.length} pending database migrations...`);
            const currentBatch = applied.length > 0 
                ? Math.max(...applied.map(m => m.batch || 1)) + 1 
                : 1;

            for (const file of pending) {
                const migration = require(path.join(migrationsDir, file));
                const start = Date.now();
                await migration.up(mongoose.connection.db);
                await Migration.create({
                    name: file,
                    batch: currentBatch,
                    executedAt: new Date(),
                    executionTimeMs: Date.now() - start
                });
                console.log(`✓ Migrated: ${file}`);
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
