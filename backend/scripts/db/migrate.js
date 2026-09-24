const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Migration = require('../../models/system/Migration');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

const connectMigrationDB = async () => {
    let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';
    if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
        const prefixMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@]+)$/);
        if (prefixMatch) {
            const [, scheme, user, pass, hostAndRest] = prefixMatch;
            if (pass.includes('@')) {
                uri = `${scheme}${user}:${encodeURIComponent(pass)}@${hostAndRest}`;
            }
        }
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
};

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
                relative: path.relative(MIGRATIONS_DIR, fullPath).replace(/\\/g, '/')
            });
        }
    }
    return results.sort((a, b) => a.fileName.localeCompare(b.fileName));
};

const runUp = async () => {
    await connectMigrationDB();
    console.log('==================================================');
    console.log('Phase 1: Database Migrations Runner (Up)');
    console.log('==================================================');

    const files = scanMigrationFiles(MIGRATIONS_DIR);
    if (files.length === 0) {
        console.log('No migration files found in migrations directory.');
        process.exit(0);
    }

    const appliedMigrations = await Migration.find().lean();
    const appliedNames = new Set(appliedMigrations.map(m => m.name));

    const pending = files.filter(f => !appliedNames.has(f.fileName) && !appliedNames.has(f.relative));
    if (pending.length === 0) {
        console.log('✓ All migrations are already up to date.');
        process.exit(0);
    }

    const currentBatch = appliedMigrations.length > 0 
        ? Math.max(...appliedMigrations.map(m => m.batch || 1)) + 1 
        : 1;

    for (const file of pending) {
        const migration = require(file.fullPath);

        console.log(`\nExecuting: ${file.fileName} (${file.relative})...`);
        const startTime = Date.now();

        try {
            await migration.up(mongoose.connection.db);
            const duration = Date.now() - startTime;

            await Migration.create({
                name: file.fileName,
                batch: currentBatch,
                executedAt: new Date(),
                executionTimeMs: duration
            });

            console.log(`✓ Migrated:  ${file.fileName} (${duration}ms)`);
        } catch (error) {
            console.error(`❌ Migration failed at ${file.fileName}:`, error.message);
            process.exit(1);
        }
    }

    console.log('\n✓ Migration batch completed successfully!');
    process.exit(0);
};

const runStatus = async () => {
    await connectMigrationDB();
    console.log('==================================================');
    console.log('Phase 1: Database Migration Status');
    console.log('==================================================');

    const files = scanMigrationFiles(MIGRATIONS_DIR);
    const applied = await Migration.find().sort({ executedAt: 1 }).lean();
    const appliedMap = new Map();
    for (const m of applied) {
        appliedMap.set(m.name, m);
    }

    console.log(`\nFound ${files.length} total migration files:\n`);
    for (const file of files) {
        if (appliedMap.has(file.fileName) || appliedMap.has(file.relative)) {
            const record = appliedMap.get(file.fileName) || appliedMap.get(file.relative);
            console.log(`  [APPLIED]  ${file.relative.padEnd(45)} (Batch ${record.batch}, ${record.executedAt.toISOString().slice(0, 19)})`);
        } else {
            console.log(`  [PENDING]  ${file.relative}`);
        }
    }
    console.log('');
    process.exit(0);
};

const command = process.argv[2] || 'up';
if (command === 'up') {
    runUp();
} else if (command === 'status') {
    runStatus();
} else {
    console.log(`Unknown command: ${command}. Use 'up' or 'status'.`);
    process.exit(1);
}
