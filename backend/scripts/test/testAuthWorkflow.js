/**
 * Comprehensive Integration Test:
 * 1. Signup with Phone (OTP to phone via SMS) + Password setup
 * 2. Signup with Email (OTP to email) + Password setup
 * 3. Routine Login with Password (for phone and for email)
 * 4. Forgot Password with OTP (Phone SMS OTP & Email OTP) -> Reset Password -> Login with new password
 * 5. SuperAdmin hardcoded login (9161955178 / admin)
 */

const axios = require('axios');
const API = 'http://localhost:3000/api/auth';

const rand = Math.floor(1000 + Math.random() * 9000);
const testPhone = `98${rand}1234`;
const testEmail = `user_${rand}@freshcart.test`;
const testPassword = 'SecretPassword123';
const newPassword = 'NewSecretPassword456';

async function runTests() {
    console.log('================================================================');
    console.log('TEST SUITE: Signup OTP + Password Login + Forgot Password OTP');
    console.log('================================================================\n');

    let passed = 0;
    let total = 0;

    function assert(desc, condition) {
        total++;
        if (condition) {
            console.log(`  ✓ [PASS] ${desc}`);
            passed++;
        } else {
            console.error(`  ✗ [FAIL] ${desc}`);
            process.exitCode = 1;
        }
    }

    try {
        // --- 1. SIGNUP WITH PHONE ---
        console.log('[1/5] Testing Signup via Phone (OTP to Mobile SMS)...');
        const phoneOtpRes = await axios.post(`${API}/signup/send-otp`, {
            phone: testPhone,
            fullName: 'Phone User'
        });
        assert('Phone signup OTP dispatched successfully', phoneOtpRes.status === 200 && phoneOtpRes.data.success);
        assert('Phone signup channel is sms', phoneOtpRes.data.channel === 'sms');
        const phoneDevOtp = phoneOtpRes.data.devOtp;
        assert('Phone signup generated devOtp code', Boolean(phoneDevOtp));

        // Register with Phone + Password + OTP
        const phoneRegRes = await axios.post(`${API}/register`, {
            phone: testPhone,
            fullName: 'Phone User',
            password: testPassword,
            otp: phoneDevOtp
        });
        assert('Phone user registered with password & OTP (201 Created)', phoneRegRes.status === 201);
        assert('Phone registration returned JWT token', Boolean(phoneRegRes.data.token));
        assert('Phone user phone matches', phoneRegRes.data.user.phone === testPhone);

        // --- 2. SIGNUP WITH EMAIL ---
        console.log('\n[2/5] Testing Signup via Email (OTP to Email)...');
        const emailOtpRes = await axios.post(`${API}/signup/send-otp`, {
            email: testEmail,
            fullName: 'Email User'
        });
        assert('Email signup OTP dispatched successfully', emailOtpRes.status === 200 && emailOtpRes.data.success);
        assert('Email signup channel is email', emailOtpRes.data.channel === 'email');
        const emailDevOtp = emailOtpRes.data.devOtp;
        assert('Email signup generated devOtp code', Boolean(emailDevOtp));

        // Register with Email + Password + OTP
        const emailRegRes = await axios.post(`${API}/register`, {
            email: testEmail,
            fullName: 'Email User',
            password: testPassword,
            otp: emailDevOtp
        });
        assert('Email user registered with password & OTP (201 Created)', emailRegRes.status === 201);
        assert('Email registration returned JWT token', Boolean(emailRegRes.data.token));
        assert('Email user email matches', emailRegRes.data.user.email === testEmail);

        // --- 3. LOGIN WITH PASSWORD ---
        console.log('\n[3/5] Testing Routine Login with Password (No OTP required)...');
        // Login with Phone + Password
        const phoneLoginRes = await axios.post(`${API}/login`, {
            phone: testPhone,
            password: testPassword
        });
        assert('Phone user logs in with password', phoneLoginRes.status === 200 && Boolean(phoneLoginRes.data.token));

        // Login with Email + Password
        const emailLoginRes = await axios.post(`${API}/login`, {
            email: testEmail,
            password: testPassword
        });
        assert('Email user logs in with password', emailLoginRes.status === 200 && Boolean(emailLoginRes.data.token));

        // Reject wrong password
        try {
            await axios.post(`${API}/login`, {
                phone: testPhone,
                password: 'WrongPassword'
            });
            assert('Rejects wrong password', false);
        } catch (err) {
            assert('Rejects wrong password with 401 Unauthorized', err.response?.status === 401);
        }

        // --- 4. FORGOT PASSWORD WITH OTP ---
        console.log('\n[4/5] Testing Forgot Password (OTP via SMS & Email)...');
        // 4A: Phone Forgot Password
        const phoneResetOtpRes = await axios.post(`${API}/send-otp`, {
            phone: testPhone
        });
        assert('Password reset OTP sent to phone', phoneResetOtpRes.status === 200 && phoneResetOtpRes.data.channel === 'sms');
        const phoneResetOtp = phoneResetOtpRes.data.devOtp;

        const phoneResetConfirm = await axios.post(`${API}/reset-password-with-otp`, {
            phone: testPhone,
            otp: phoneResetOtp,
            newPassword: newPassword
        });
        assert('Password reset successfully with phone OTP', phoneResetConfirm.status === 200);

        // Login with new password for phone user
        const newPhoneLogin = await axios.post(`${API}/login`, {
            phone: testPhone,
            password: newPassword
        });
        assert('Phone user logs in with NEW password', newPhoneLogin.status === 200 && Boolean(newPhoneLogin.data.token));

        // 4B: Email Forgot Password
        const emailResetOtpRes = await axios.post(`${API}/send-otp`, {
            email: testEmail
        });
        assert('Password reset OTP sent to email', emailResetOtpRes.status === 200 && emailResetOtpRes.data.channel === 'email');
        const emailResetOtp = emailResetOtpRes.data.devOtp;

        const emailResetConfirm = await axios.post(`${API}/reset-password-with-otp`, {
            email: testEmail,
            otp: emailResetOtp,
            newPassword: newPassword
        });
        assert('Password reset successfully with email OTP', emailResetConfirm.status === 200);

        // Login with new password for email user
        const newEmailLogin = await axios.post(`${API}/login`, {
            email: testEmail,
            password: newPassword
        });
        assert('Email user logs in with NEW password', newEmailLogin.status === 200 && Boolean(newEmailLogin.data.token));

        // --- 5. SUPERADMIN LOGIN ---
        console.log('\n[5/5] Testing SuperAdmin Password Login (9161955178 / admin)...');
        const adminLoginRes = await axios.post(`${API}/login`, {
            phone: '9161955178',
            password: 'admin'
        });
        assert('SuperAdmin authenticated successfully', adminLoginRes.status === 200);
        assert('SuperAdmin role is admin', adminLoginRes.data.role === 'admin');

        console.log('\n================================================================');
        console.log(`TEST SUITE RESULTS: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
        console.log('================================================================');

    } catch (error) {
        console.error('\n❌ Unhandled error in test suite:', error.response?.data || error.message);
        process.exitCode = 1;
    }
}

runTests();
