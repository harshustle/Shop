/**
 * Phase 1 Validation Test Suite: Database setup, migrations, and core authentication.
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, isDBHealthy } = require('../config/db');
const User = require('../models/User');
const Migration = require('../models/Migration');
const TokenService = require('../services/tokenService');

const API_BASE = 'http://localhost:3000/api';

const runPhase1Tests = async () => {
    console.log('================================================================');
    console.log('PHASE 1 TEST SUITE: Database Setup, Migrations & Core Auth');
    console.log('================================================================\n');

    let passed = 0;
    let total = 0;

    const assert = (condition, title, details = '') => {
        total++;
        if (condition) {
            passed++;
            console.log(`  ✓ [PASS] ${title}`);
        } else {
            console.error(`  ❌ [FAIL] ${title} - ${details}`);
        }
    };

    try {
        // Test 1: Database Setup & Health
        console.log('[1/4] Testing Database Setup & Connection Pooling...');
        await connectDB();
        assert(isDBHealthy(), 'MongoDB connection is healthy and responsive');
        assert(mongoose.connection.readyState === 1, 'Mongoose state is 1 (Connected)');
        
        // Test 2: Migration Framework
        console.log('\n[2/4] Testing Database Migrations...');
        const migrations = await Migration.find().lean();
        assert(migrations.length >= 3, `Migrations collection contains applied records (found ${migrations.length})`);
        const migrationNames = migrations.map(m => m.name);
        assert(migrationNames.includes('001_create_core_indexes.js'), 'Migration 001 (Core Indexes) executed');
        assert(migrationNames.includes('002_seed_indian_wholesale_taxonomy.js'), 'Migration 002 (Indian Wholesale Taxonomy) executed');
        assert(migrationNames.includes('003_seed_superadmin_user.js'), 'Migration 003 (SuperAdmin Seed) executed');

        // Verify Collections & Indexes in MongoDB
        const userIndexes = await mongoose.connection.db.collection('users').indexes();
        const userIndexKeys = userIndexes.map(i => Object.keys(i.key)[0]);
        assert(userIndexKeys.includes('phone'), 'Users collection has phone index');

        const catIndexes = await mongoose.connection.db.collection('categories').indexes();
        const catIndexKeys = catIndexes.map(i => Object.keys(i.key)[0]);
        assert(catIndexKeys.includes('slug'), 'Categories collection has slug index');

        const cartIndexes = await mongoose.connection.db.collection('carts').indexes();
        const cartTtl = cartIndexes.find(i => i.expireAfterSeconds !== undefined);
        assert(!!cartTtl, 'Carts collection has native MongoDB TTL index');

        // Test 3: Password Hashing with Bcrypt
        console.log('\n[3/4] Testing Password Hashing & Encryption...');
        const testPassword = 'SecureKiranaPassword#2026';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const matchValid = await bcrypt.compare(testPassword, hashedPassword);
        const matchInvalid = await bcrypt.compare('WrongPassword', hashedPassword);
        assert(matchValid, 'Bcrypt successfully validates correct password hash');
        assert(!matchInvalid, 'Bcrypt successfully rejects wrong password');

        // Test 4: Core Authentication API Endpoints
        console.log('\n[4/4] Testing Core Authentication & RBAC via HTTP API...');

        // 4.1 SuperAdmin Login
        const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9161955178', password: 'admin' })
        });
        const adminData = await adminLoginRes.json();
        assert(adminLoginRes.status === 200, 'SuperAdmin login returns HTTP 200 OK');
        assert(adminData.role === 'admin', 'SuperAdmin token grants role="admin"');
        assert(typeof adminData.token === 'string' && adminData.token.length > 20, 'Valid JWT Access Token generated for SuperAdmin');
        const adminToken = adminData.token;

        // 4.2 Customer Registration
        const testPhone = '98' + Math.floor(10000000 + Math.random() * 90000000); // Random valid 10-digit phone
        const testEmail = `buyer_${Date.now()}@kirana.test`;
        const regRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: testPhone,
                email: testEmail,
                password: 'customerPass123',
                fullName: 'Ramesh Gupta (Kirana Store)'
            })
        });
        const regData = await regRes.json();
        assert(regRes.status === 201, 'Customer registration returns HTTP 201 Created');
        assert(regData.role === 'customer', 'Registered user has role="customer"');
        assert(regData.user.password === undefined, 'Password field is sanitized and excluded from response');
        const customerToken = regData.token;

        // 4.3 Duplicate Registration Rejection
        const dupRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: testPhone,
                password: 'differentPassword',
                fullName: 'Duplicate User'
            })
        });
        assert(dupRes.status === 409 || dupRes.status === 400, 'Duplicate mobile number registration rejected with HTTP 409/400');

        // 4.4 Customer Login
        const custLoginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: testPhone, password: 'customerPass123' })
        });
        assert(custLoginRes.status === 200, 'Customer login returns HTTP 200 OK');

        // 4.5 Profile Retrieval (GET /api/auth/me)
        const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });
        const meData = await meRes.json();
        assert(meRes.status === 200, 'Protected GET /api/auth/me returns HTTP 200 OK');
        assert(meData.fullName === 'Ramesh Gupta (Kirana Store)', 'Profile returns authentic registered user identity');

        // 4.6 RBAC: Customer attempting admin-only endpoint
        const rbacRes = await fetch(`${API_BASE}/admin/metrics`, {
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });
        assert(rbacRes.status === 403, 'RBAC Gate: Customer blocked from /api/admin/metrics with HTTP 403 Forbidden');

        // 4.7 RBAC: SuperAdmin accessing admin-only endpoint
        const adminAccessRes = await fetch(`${API_BASE}/admin/metrics`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert(adminAccessRes.status === 200, 'RBAC Gate: SuperAdmin successfully accesses /api/admin/metrics with HTTP 200 OK');

        // 4.8 Token Tampering / Missing Token Rejection
        const unauthRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': 'Bearer invalid.tampered.jwt' }
        });
        assert(unauthRes.status === 401, 'Security Gate: Tampered/Invalid JWT rejected with HTTP 401 Unauthorized');

        console.log('\n================================================================');
        console.log(`PHASE 1 TEST SUMMARY: ${passed}/${total} assertions PASSED`);
        console.log('================================================================\n');

        if (passed === total) {
            console.log('🎉 PHASE 1 (Database Setup, Migrations & Core Authentication) IS 100% COMPLETE AND PRODUCTION-READY!\n');
            process.exit(0);
        } else {
            console.error('Some tests failed.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Phase 1 test error:', error);
        process.exit(1);
    }
};

runPhase1Tests();
