const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { 
    login, 
    register, 
    getMe, 
    changePassword,
    sendPasswordResetOtp,
    verifyOtpAndResetPassword,
    googleAuth,
    refreshToken,
    logout
} = require('../../controllers/auth/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);

// OTP Password Reset (SuperAdmin & Customer)
router.post('/send-otp', sendPasswordResetOtp);
router.post('/reset-password-with-otp', verifyOtpAndResetPassword);

module.exports = router;

