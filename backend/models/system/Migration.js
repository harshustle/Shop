const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    batch: {
        type: Number,
        required: true
    },
    executedAt: {
        type: Date,
        default: Date.now
    },
    executionTimeMs: {
        type: Number,
        default: 0
    }
}, { collection: '_migrations', timestamps: false });

module.exports = mongoose.model('Migration', migrationSchema);
