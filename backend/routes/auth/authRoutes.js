const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
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
    firebasePhoneLogin
} = require('../../controllers/auth/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/signup/send-otp', sendSignupOtp);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);

// Firebase Google Phone Auth (10,000 Free SMS / mo)
router.post('/firebase-login', firebasePhoneLogin);

// OTP Direct Login (Phone SMS or Email Dispatch)
router.post('/otp/send', sendLoginOtp);
router.post('/otp/verify', verifyLoginOtp);

// OTP Password Reset (SuperAdmin & Customer)
router.post('/send-otp', sendPasswordResetOtp);
router.post('/reset-password-with-otp', verifyOtpAndResetPassword);

module.exports = router;

