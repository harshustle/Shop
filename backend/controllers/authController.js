const User = require('../models/User');
const TokenService = require('../services/tokenService');
const RedisService = require('../services/redisService');
const axios = require('axios');

const PROFILE_TTL = 7 * 24 * 60 * 60; // 7 days
const OTP_TTL = 10 * 60; // 10 minutes

/**
 * Phase 1 Core Authentication: Login
 * Authenticates SuperAdmin or Customer via Phone/Email and password
 */
const login = async (req, res) => {
    try {
        const { phone, email, password } = req.body;

        if (!password || (!phone && !email)) {
            return res.status(400).json({ 
                error: 'Validation failed: Password and either Phone Number or Email are required' 
            });
        }

        // 1. Direct Hardcoded SuperAdmin Check (preserves instant dev/demo access)
        if (phone === '9161955178' && password === 'admin') {
            let adminUser = await User.findOne({ phone: '9161955178' });
            if (!adminUser) {
                adminUser = await User.create({
                    phone: '9161955178',
                    email: 'admin@shop.local',
                    fullName: 'Super Admin',
                    password: 'admin',
                    role: 'admin'
                });
            }
            adminUser.lastLoginAt = new Date();
            await adminUser.save();

            const token = TokenService.generateAccessToken(adminUser);
            return res.json({
                message: 'SuperAdmin authenticated successfully',
                token,
                role: 'admin',
                user: adminUser.toSafeJSON()
            });
        }

        // 2. Query User in MongoDB
        let query = null;
        if (phone) {
            query = { phone: phone.trim() };
        } else if (email) {
            query = { email: email.trim().toLowerCase() };
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        if (user.isActive === false) {
            return res.status(403).json({ error: 'Account suspended: Please contact store administrator' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        // Update login timestamp
        user.lastLoginAt = new Date();
        await user.save();

        // Cache user profile in Redis
        await RedisService.set(`user:profile:${user._id}`, user.toSafeJSON(), PROFILE_TTL);

        const token = TokenService.generateAccessToken(user);

        return res.json({
            message: 'Authentication successful',
            token,
            role: user.role,
            user: user.toSafeJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Authentication internal failure', details: error.message });
    }
};

/**
 * Phase 1 Core Authentication: Register
 * Registers new Kirana Buyer / Customer with strict validation
 */
const register = async (req, res) => {
    try {
        const { phone, email, password, fullName, name } = req.body;
        const displayName = (fullName || name || '').trim();

        if (!displayName || displayName.length < 2) {
            return res.status(400).json({ error: 'Validation failed: Full Name must be at least 2 characters long' });
        }

        if (!phone) {
            return res.status(400).json({ error: 'Validation failed: 10-digit mobile phone number is required' });
        }

        const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return res.status(400).json({ 
                error: 'Validation failed: Please enter a valid 10-digit Indian mobile number starting with 6-9' 
            });
        }

        if (!password || password.length < 4) {
            return res.status(400).json({ error: 'Validation failed: Password must be at least 4 characters long' });
        }

        // Check duplicates
        const existingPhone = await User.findOne({ phone: cleanPhone });
        if (existingPhone) {
            return res.status(409).json({ error: 'Account already exists: Mobile number is already registered' });
        }

        if (email) {
            const cleanEmail = email.trim().toLowerCase();
            const existingEmail = await User.findOne({ email: cleanEmail });
            if (existingEmail) {
                return res.status(409).json({ error: 'Account already exists: Email address is already registered' });
            }
        }

        // Create User
        const newUser = await User.create({
            phone: cleanPhone,
            email: email ? email.trim().toLowerCase() : undefined,
            fullName: displayName,
            password: password,
            role: 'customer',
            isActive: true,
            lastLoginAt: new Date()
        });

        // Cache new user profile in Redis
        await RedisService.set(`user:profile:${newUser._id}`, newUser.toSafeJSON(), PROFILE_TTL);

        const token = TokenService.generateAccessToken(newUser);

        res.status(201).json({
            message: 'Customer account registered successfully',
            token,
            role: newUser.role,
            user: newUser.toSafeJSON()
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Phone number or email is already registered' });
        }
        res.status(400).json({ error: error.message });
    }
};

/**
 * Phase 1 Core Authentication: Get Current Profile
 * Validates token and returns authenticated user details (Redis-accelerated)
 */
const getMe = async (req, res) => {
    try {
        const profileKey = `user:profile:${req.userId}`;
        let cached = await RedisService.get(profileKey);

        if (!cached) {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User account not found' });
            }
            cached = user.toSafeJSON();
            await RedisService.set(profileKey, cached, PROFILE_TTL);
        }

        res.json({
            user: cached,
            userId: cached._id,
            phone: cached.phone,
            email: cached.email,
            fullName: cached.fullName,
            role: cached.role,
            isAdmin: cached.role === 'admin'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Phase 1 Core Authentication: Change Password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword || newPassword.length < 4) {
            return res.status(400).json({ 
                error: 'Validation failed: Current password and new password (min 4 chars) are required' 
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        user.password = newPassword; // Will trigger pre-save bcrypt hash
        await user.save();

        // Invalidate Redis profile cache
        await RedisService.del(`user:profile:${user._id}`);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Phase 1 OTP: Send Password Reset OTP
 * Stores ephemeral OTP in Redis with 10-minute auto-expiring TTL
 */
const sendPasswordResetOtp = async (req, res) => {
    try {
        const { phone, email } = req.body;
        if (!phone && !email) {
            return res.status(400).json({ error: 'Please enter your registered mobile number or email address' });
        }

        let query = null;
        if (phone) {
            const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
            query = { phone: cleanPhone };
        } else if (email) {
            query = { email: email.trim().toLowerCase() };
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ error: 'No account found with this mobile number or email' });
        }

        // Generate 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 1. Store in Redis with 10-minute TTL
        const otpKey = `otp:reset:${user.phone || user.email}`;
        await RedisService.set(otpKey, otp, OTP_TTL);

        // 2. Backup to MongoDB user document
        user.resetOtp = otp;
        user.resetOtpExpires = expiresAt;
        await user.save();

        console.log(`\n======================================================`);
        console.log(`[REDIS OTP SERVICE] Password Reset Request for: ${user.fullName} (${user.phone}) [Role: ${user.role}]`);
        console.log(`[OTP CODE]: ${otp} (Cached in Redis key: ${otpKey})`);
        console.log(`[EXPIRES]: 10 minutes (TTL: ${OTP_TTL}s)`);
        console.log(`======================================================\n`);

        res.json({
            success: true,
            message: `A 6-digit verification code has been generated for ${user.phone || user.email}`,
            phone: user.phone,
            otp, // Returned for instant testing and local dev verification
            expiresInMinutes: 10
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Phase 1 OTP: Verify OTP & Reset Password
 * Resets password using valid 6-digit OTP validated against Redis
 */
const verifyOtpAndResetPassword = async (req, res) => {
    try {
        const { phone, email, otp, newPassword } = req.body;

        if (!otp || !newPassword) {
            return res.status(400).json({ error: 'Verification code (OTP) and new password are required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters long' });
        }

        let query = null;
        let identifier = null;
        if (phone) {
            const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
            query = { phone: cleanPhone };
            identifier = cleanPhone;
        } else if (email) {
            query = { email: email.trim().toLowerCase() };
            identifier = email.trim().toLowerCase();
        } else {
            return res.status(400).json({ error: 'Phone or email is required' });
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ error: 'User account not found' });
        }

        // Verify against Redis first
        const otpKey = `otp:reset:${user.phone || user.email || identifier}`;
        const redisOtp = await RedisService.get(otpKey);

        const isRedisMatch = redisOtp && redisOtp.toString().trim() === otp.toString().trim();
        const isDbMatch = user.resetOtp && user.resetOtp.trim() === otp.toString().trim() && 
                          (!user.resetOtpExpires || new Date() <= user.resetOtpExpires);

        if (!isRedisMatch && !isDbMatch) {
            return res.status(400).json({ error: 'Invalid or expired verification code (OTP). Please check and retry.' });
        }

        // Set new password (triggers pre-save bcrypt hook)
        user.password = newPassword;
        user.resetOtp = null;
        user.resetOtpExpires = null;
        user.lastLoginAt = new Date();
        await user.save();

        // Flush consumed OTP and invalidate profile cache in Redis
        await RedisService.del(otpKey);
        await RedisService.del(`user:profile:${user._id}`);

        // Issue new JWT token
        const token = TokenService.generateAccessToken(user);

        console.log(`✓ Password successfully reset with OTP for user: ${user.phone} (${user.role})`);

        res.json({
            success: true,
            message: 'Password reset successfully! You are now logged in.',
            token,
            role: user.role,
            user: user.toSafeJSON()
        });
    } catch (error) {
        console.error('Verify OTP and reset password error:', error);
        res.status(500).json({ error: error.message });
    }
};


/**
 * Google OAuth Authentication
 * Verifies Google ID Token and logs in or registers user
 */
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential token is required' });
        }

        let googleUser = null;

        // Support demo/development token fallback if needed
        if (credential === 'demo-google-token' && process.env.NODE_ENV !== 'production') {
            googleUser = {
                sub: 'demo-google-id-12345',
                email: 'google.demo@example.com',
                name: 'Google Demo User',
                picture: null
            };
        } else {
            // Verify token with Google tokeninfo endpoint
            try {
                const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
                googleUser = response.data;
            } catch (verifyErr) {
                console.error('Google token validation error:', verifyErr.response?.data || verifyErr.message);
                return res.status(401).json({ 
                    error: 'Invalid or expired Google authentication token',
                    details: verifyErr.response?.data?.error_description || verifyErr.message 
                });
            }
        }

        const { sub: googleId, email, name, picture } = googleUser;

        if (!email) {
            return res.status(400).json({ error: 'Google account did not provide an email address' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check if user already exists by googleId
        let user = await User.findOne({ googleId });

        // 2. If not found by googleId, check by email
        if (!user) {
            user = await User.findOne({ email: normalizedEmail });
            if (user) {
                // Link googleId and avatar to existing account
                user.googleId = googleId;
                if (picture && !user.avatar) {
                    user.avatar = picture;
                }
            }
        }

        // 3. If still not found, create new user record
        if (!user) {
            user = new User({
                fullName: (name || normalizedEmail.split('@')[0] || 'Google User').trim(),
                email: normalizedEmail,
                googleId,
                avatar: picture || null,
                role: 'customer',
                isActive: true
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({ error: 'Account suspended: Please contact store administrator' });
        }

        // Update login timestamp
        user.lastLoginAt = new Date();
        await user.save();

        // Cache user profile in Redis
        await RedisService.set(`user:profile:${user._id}`, user.toSafeJSON(), PROFILE_TTL);

        const token = TokenService.generateAccessToken(user);

        return res.json({
            message: 'Google authentication successful',
            token,
            role: user.role,
            user: user.toSafeJSON()
        });
    } catch (error) {
        console.error('Google auth internal failure:', error);
        res.status(500).json({ error: 'Google authentication failed', details: error.message });
    }
};

module.exports = { 
    login, 
    register, 
    getMe, 
    changePassword,
    sendPasswordResetOtp,
    verifyOtpAndResetPassword,
    googleAuth
};

