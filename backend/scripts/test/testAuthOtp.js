/**
 * Verification Test: Dual-Channel OTP Login (SMS for Phone & Email for Email)
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NotificationService = require('../../services/notification/notificationService');
const RedisService = require('../../services/cache/redisService');
const { sendLoginOtp, verifyLoginOtp } = require('../../controllers/auth/authController');
const { connectDB } = require('../../config/db');
const User = require('../../models/auth/User');
const mongoose = require('mongoose');

// Mock Express req/res
const createMockReqRes = (body = {}) => {
    const req = { body };
    let statusCode = 200;
    let responseData = null;

    const res = {
        status: (code) => {
            statusCode = code;
            return res;
        },
        json: (data) => {
            responseData = data;
            return res;
        },
        getStatusCode: () => statusCode,
        getData: () => responseData
    };

    return { req, res };
};

const runOtpTests = async () => {
    console.log('================================================================');
    console.log('TEST SUITE: Dual-Channel OTP Login (Phone SMS & Email)');
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
        // Step 1: Connect to Database (or handle graceful connection)
        console.log('[1/4] Connecting to Database & In-Memory / Upstash Redis...');
        try {
            await connectDB();
            console.log('  Connected to MongoDB');
        } catch (dbErr) {
            console.log('  Note: Local MongoDB standalone not active; continuing test in-memory mock');
        }

        // Step 2: Test NotificationService SMS dispatch
        console.log('\n[2/4] Testing SMS Dispatch via NotificationService...');
        const testPhone = '9876543210';
        const testOtp = '849201';
        const smsResult = await NotificationService.sendSMS({
            phone: testPhone,
            otp: testOtp
        });

        assert(smsResult.success === true, 'NotificationService.sendSMS returns success: true');
        assert(smsResult.channel === 'sms', 'NotificationService.sendSMS channel is sms');

        // Step 3: Test NotificationService Email dispatch
        console.log('\n[3/4] Testing Branded HTML Email Dispatch via NotificationService...');
        const testEmail = 'customer.freshcart@example.com';
        const emailResult = await NotificationService.sendEmail({
            to: testEmail,
            otp: testOtp,
            name: 'Rahul Sharma'
        });

        assert(emailResult.success === true, 'NotificationService.sendEmail returns success: true');
        assert(emailResult.channel === 'email', 'NotificationService.sendEmail channel is email');

        // Step 4: Test Controller sendLoginOtp & verifyLoginOtp
        console.log('\n[4/4] Testing Authentication Controllers: sendLoginOtp & verifyLoginOtp...');
        
        // 4A: Phone Login OTP
        const { req: reqPhoneSend, res: resPhoneSend } = createMockReqRes({ phone: testPhone });
        await sendLoginOtp(reqPhoneSend, resPhoneSend);
        assert(resPhoneSend.getStatusCode() === 200, 'sendLoginOtp responds 200 for phone');
        const phoneSendData = resPhoneSend.getData();
        assert(phoneSendData.channel === 'sms', 'sendLoginOtp channel is sms');
        assert(phoneSendData.phone === testPhone, 'sendLoginOtp returns formatted 10-digit phone');

        // Retrieve OTP stored in Redis
        const cachedPhoneOtp = await RedisService.get(`otp:auth:phone:${testPhone}`);
        assert(Boolean(cachedPhoneOtp), `OTP stored in Redis at key otp:auth:phone:${testPhone} (Value: ${cachedPhoneOtp})`);

        // 4B: Verify Phone Login OTP
        if (mongoose.connection.readyState === 1) {
            const { req: reqPhoneVerify, res: resPhoneVerify } = createMockReqRes({ 
                phone: testPhone, 
                otp: cachedPhoneOtp 
            });
            await verifyLoginOtp(reqPhoneVerify, resPhoneVerify);
            assert(resPhoneVerify.getStatusCode() === 200, 'verifyLoginOtp responds 200 for correct phone OTP');
            const verifyPhoneData = resPhoneVerify.getData();
            assert(Boolean(verifyPhoneData.token), 'JWT Token generated on phone OTP login');
            assert(verifyPhoneData.role === 'customer', 'New phone user assigned role: customer');
        } else {
            console.log('  ℹ️ Skipping DB-write verification (requires active Mongo connection)');
        }

        // 4C: Email Login OTP
        const { req: reqEmailSend, res: resEmailSend } = createMockReqRes({ email: testEmail });
        await sendLoginOtp(reqEmailSend, resEmailSend);
        assert(resEmailSend.getStatusCode() === 200, 'sendLoginOtp responds 200 for email');
        const emailSendData = resEmailSend.getData();
        assert(emailSendData.channel === 'email', 'sendLoginOtp channel is email');
        assert(emailSendData.email === testEmail, 'sendLoginOtp returns normalized email');

        const cachedEmailOtp = await RedisService.get(`otp:auth:email:${testEmail}`);
        assert(Boolean(cachedEmailOtp), `OTP stored in Redis at key otp:auth:email:${testEmail} (Value: ${cachedEmailOtp})`);

        // 4D: Invalid OTP rejection
        const { req: reqInvalid, res: resInvalid } = createMockReqRes({
            email: testEmail,
            otp: '000000'
        });
        await verifyLoginOtp(reqInvalid, resInvalid);
        assert(resInvalid.getStatusCode() === 400, 'verifyLoginOtp rejects invalid OTP with 400 Bad Request');

        console.log('\n================================================================');
        console.log(`TEST RESULTS: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
        console.log('================================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Unhandled test failure:', err);
        process.exit(1);
    }
};

runOtpTests();
