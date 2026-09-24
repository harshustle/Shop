/**
 * Verification test for JWT Dual-Token (Access + Refresh Token) System
 */
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB } = require('../../config/db');
const TokenService = require('../../services/auth/tokenService');
const app = require('../index');

const runTests = async () => {
    console.log('================================================================');
    console.log('REFRESH TOKEN VERIFICATION SUITE');
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
        await connectDB();

        // 1. Unit tests for TokenService
        console.log('[1/3] Testing TokenService Unit Logic...');
        const mockUser = {
            _id: '64f8a1b2c3d4e5f6a7b8c9d0',
            role: 'customer',
            phone: '9876543210',
            email: 'mock@kirana.test',
            fullName: 'Mock Kirana Owner'
        };

        const pair = TokenService.generateTokenPair(mockUser);
        assert(typeof pair.token === 'string' && pair.token.length > 20, 'TokenService returns backward-compatible token');
        assert(typeof pair.accessToken === 'string' && pair.accessToken.length > 20, 'TokenService returns accessToken');
        assert(typeof pair.refreshToken === 'string' && pair.refreshToken.length > 20, 'TokenService returns refreshToken');
        assert(pair.token === pair.accessToken, 'token alias matches accessToken');
        assert(pair.accessToken !== pair.refreshToken, 'Access token and Refresh token are distinct');

        const accessVerify = TokenService.verifyAccessToken(pair.accessToken);
        assert(accessVerify.valid === true && accessVerify.payload.tokenType === 'access', 'verifyAccessToken accepts valid access token');

        const refreshVerify = TokenService.verifyRefreshToken(pair.refreshToken);
        assert(refreshVerify.valid === true && refreshVerify.payload.tokenType === 'refresh', 'verifyRefreshToken accepts valid refresh token');

        // Cross-verification security check (Access token cannot be used as refresh token, and vice versa)
        const crossAccess = TokenService.verifyAccessToken(pair.refreshToken);
        assert(crossAccess.valid === false, 'Security: Refresh token is rejected by verifyAccessToken');

        const crossRefresh = TokenService.verifyRefreshToken(pair.accessToken);
        assert(crossRefresh.valid === false, 'Security: Access token is rejected by verifyRefreshToken');

        // 2. HTTP Endpoints Testing
        console.log('\n[2/3] Testing HTTP Auth & Refresh Endpoints...');
        const serverPort = 3099;
        const testServer = http.createServer(app);
        await new Promise((resolve) => testServer.listen(serverPort, resolve));
        const BASE_URL = `http://localhost:${serverPort}/api`;

        // 2.1 Login and get refresh token
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9161955178', password: 'admin' })
        });
        const loginData = await loginRes.json();
        assert(loginRes.status === 200, 'SuperAdmin login returns HTTP 200');
        assert(typeof loginData.token === 'string', 'Login response includes token');
        assert(typeof loginData.refreshToken === 'string', 'Login response includes refreshToken');
        
        const firstAccessToken = loginData.token;
        const firstRefreshToken = loginData.refreshToken;

        // 2.2 Verify access token works with protected /me endpoint
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${firstAccessToken}` }
        });
        assert(meRes.status === 200, 'Authenticated GET /api/auth/me works with access token');

        // 2.3 Exchange refresh token for fresh token pair
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: firstRefreshToken })
        });
        const refreshData = await refreshRes.json();
        assert(refreshRes.status === 200, 'POST /api/auth/refresh returns HTTP 200');
        assert(typeof refreshData.token === 'string', 'Refresh response returns renewed token');
        assert(typeof refreshData.refreshToken === 'string', 'Refresh response returns renewed refreshToken');
        assert(refreshData.refreshToken !== firstRefreshToken, 'Refresh token was rotated with a fresh token');

        const secondAccessToken = refreshData.token;
        const secondRefreshToken = refreshData.refreshToken;

        // 2.4 Verify renewed access token works
        const meRenewedRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${secondAccessToken}` }
        });
        assert(meRenewedRes.status === 200, 'GET /api/auth/me works with renewed access token');

        // 2.5 Security: Refresh Token Rotation replay check (firstRefreshToken should now be blacklisted)
        const replayRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: firstRefreshToken })
        });
        assert(replayRes.status === 401, 'Security: Reusing rotated refresh token is rejected with HTTP 401');

        // 2.6 Security: Tampered refresh token check
        const tamperedRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: 'invalid.tampered.token' })
        });
        assert(tamperedRes.status === 401, 'Security: Tampered refresh token is rejected with HTTP 401');

        // 3. Logout and Revocation Testing
        console.log('\n[3/3] Testing Logout & Revocation...');
        const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secondAccessToken}`
            },
            body: JSON.stringify({ refreshToken: secondRefreshToken })
        });
        assert(logoutRes.status === 200, 'POST /api/auth/logout returns HTTP 200');

        // Post-logout Access Token check
        const postLogoutMe = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${secondAccessToken}` }
        });
        assert(postLogoutMe.status === 401, 'Security: Access token is blacklisted and rejected after logout');

        // Post-logout Refresh Token check
        const postLogoutRefresh = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: secondRefreshToken })
        });
        assert(postLogoutRefresh.status === 401, 'Security: Refresh token is blacklisted and rejected after logout');

        testServer.close();

        console.log('\n================================================================');
        console.log(`REFRESH TOKEN TEST SUMMARY: ${passed}/${total} assertions PASSED`);
        console.log('================================================================\n');

        if (passed === total) {
            console.log('🎉 REFRESH TOKEN IMPLEMENTATION FULLY VERIFIED AND SECURE!\n');
            process.exit(0);
        } else {
            console.error('Some assertions failed.');
            process.exit(1);
        }
    } catch (err) {
        console.error('Test execution error:', err);
        process.exit(1);
    }
};

runTests();
