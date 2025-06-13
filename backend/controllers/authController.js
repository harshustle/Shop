const User = require('../models/User');
const jwt = require('jsonwebtoken');


const login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        console.log('Login attempt:', { phone, password }); // Debug log

        // Admin login check
        if (phone === '9161955178' && password === 'admin') {
            console.log('Admin login successful'); // Debug log
            const token = jwt.sign(
                { userId: 'admin', isAdmin: true },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            return res.json({
                token,
                role: 'admin',
                user: { phone, isAdmin: true }
            });
        }

        // Regular user login
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            token,
            role: 'user',
            user: { phone: user.phone }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

const register = async (req, res) => {
    try {
        const existingUser = await User.findOne({ phone: req.body.phone });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this phone number' });
        }
        const { phone, password } = req.body;
        const user = await User.create({ phone, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }
        res.status(400).json({ error: error.message });
    }
};

module.exports = { login, register };
