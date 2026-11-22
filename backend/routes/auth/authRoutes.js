const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const loginRateLimit = require('../../middleware/loginRateLimit');
const { 
    login, 
    register, 
    sendSignupOtp,
    getMe, 
    changePassword,
    sendPasswordResetOtp,
    verifyOtpAndResetPassword,
    googleAuth,
    refreshToken,
    logout,
    sendLoginOtp,
    verifyLoginOtp,
    firebasePhoneLogin,
    sendGooglePhoneOtp,
    verifyGooglePhoneOtp
} = require('../../controllers/auth/authController');

router.post('/login', loginRateLimit, login);
router.post('/register', register);
router.post('/signup/send-otp', sendSignupOtp);
router.post('/google', googleAuth);
router.post('/google/phone/send-otp', auth, sendGooglePhoneOtp);
router.post('/google/phone/verify-otp', auth, verifyGooglePhoneOtp);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);

// Firebase Google Phone Auth (10,000 Free SMS / mo)
router.post('/firebase-login', firebasePhoneLogin);

// OTP Direct Login (Phone SMS or Email Dispatch)
router.post('/otp/send', loginRateLimit, sendLoginOtp);
router.post('/otp/verify', loginRateLimit, verifyLoginOtp);

// OTP Password Reset (SuperAdmin & Customer)
router.post('/send-otp', sendPasswordResetOtp);
router.post('/reset-password-with-otp', verifyOtpAndResetPassword);

module.exports = router;

