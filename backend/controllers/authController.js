const User = require('../models/User');
const TokenService = require('../services/tokenService');

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
 * Validates token and returns authenticated user details
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User account not found' });
        }

        res.json({
            user: user.toSafeJSON(),
            userId: user._id,
            phone: user.phone,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isAdmin: user.role === 'admin'
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

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Phase 1 OTP: Send Password Reset OTP
 * Supports both SuperAdmin and Normal Customers
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

        user.resetOtp = otp;
        user.resetOtpExpires = expiresAt;
        await user.save();

        console.log(`\n======================================================`);
        console.log(`[OTP SERVICE] Password Reset Request for: ${user.fullName} (${user.phone}) [Role: ${user.role}]`);
        console.log(`[OTP CODE]: ${otp}`);
        console.log(`[EXPIRES]: 10 minutes`);
        console.log(`======================================================\n`);

        res.json({
            success: true,
            message: `A 6-digit verification code has been generated for ${user.phone}`,
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
 * Resets password using valid 6-digit OTP
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
        if (phone) {
            const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
            query = { phone: cleanPhone };
        } else if (email) {
            query = { email: email.trim().toLowerCase() };
        } else {
            return res.status(400).json({ error: 'Phone or email is required' });
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ error: 'User account not found' });
        }

        if (!user.resetOtp || user.resetOtp.trim() !== otp.toString().trim()) {
            return res.status(400).json({ error: 'Invalid verification code (OTP). Please check and retry.' });
        }

        if (user.resetOtpExpires && new Date() > user.resetOtpExpires) {
            return res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
        }

        // Set new password (triggers pre-save bcrypt hook)
        user.password = newPassword;
        user.resetOtp = null;
        user.resetOtpExpires = null;
        user.lastLoginAt = new Date();
        await user.save();

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

module.exports = { 
    login, 
    register, 
    getMe, 
    changePassword,
    sendPasswordResetOtp,
    verifyOtpAndResetPassword
};
