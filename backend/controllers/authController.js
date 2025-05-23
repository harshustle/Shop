const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.js');

const adminLogin = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ error: 'Please provide phone number and password' });
        }
        const admin = await Admin.findOne({ phone });
        if (!admin) {
            return res.status(401).json({ error: 'Your phone number is incorrect' });
        }
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Your password is incorrect' });
        }
        const token = jwt.sign(
            { adminId: admin._id, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        // take data from Login form
        const { phone, password } = req.body;
        // check if phone number and password are provided
        if (!phone || !password) {
            return res.status(400).json({ error: 'Please provide phone number and password' });
        }
        // check if user exists
        const user = await User.findOne({ phone });
        // find user by phone number
        if (!user) {
            return res.status(401).json({ error: 'Your phone number is incorrect' });
        }
        // check if password is correct
        const isMatch = await user.comparePassword(password);
        // compare password with hashed password
        if (!isMatch) {
            return res.status(401).json({ error: 'Your password is incorrect' });
        }
        // generate JWT token
        // create JWT token with user ID and secret key
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });

        // Optionally, you can send additional user info if needed
        // On the frontend, after receiving the token, redirect to userDashboard
        // No server-side redirect here since this is an API
        // Example: res.json({ token, redirectTo: '/userDashboard' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const register = async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.create({ phone, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }
        res.status(400).json({ error: error.message });
    }
};

module.exports = { login, register };
