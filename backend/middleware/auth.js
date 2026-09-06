const TokenService = require('../services/tokenService');
const User = require('../models/User');

/**
 * Core Authentication Middleware
 * Extracts and verifies JWT Access Token from Authorization Header
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Authentication required: No Authorization header provided' });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        if (!token) {
            return res.status(401).json({ error: 'Authentication required: Bearer token is missing' });
        }

        const { valid, payload, expired, message } = TokenService.verifyAccessToken(token);
        if (!valid) {
            return res.status(401).json({
                error: expired ? 'Token expired: Please sign in again' : 'Invalid token signature',
                details: message
            });
        }

        // Attach decoded claims
        req.userId = payload.userId;
        req.role = payload.role;
        req.isAdmin = payload.role === 'admin' || payload.isAdmin === true;
        req.userClaims = payload;

        // Optionally fetch active user from DB to verify user is not deleted or suspended
        const user = await User.findById(payload.userId).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'User account not found or was removed' });
        }
        if (user.isActive === false) {
            return res.status(403).json({ error: 'Account suspended: Contact support' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failure', details: error.message });
    }
};

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} allowedRoles Roles permitted to access route (e.g. 'admin', 'customer')
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.role) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.role)) {
            return res.status(403).json({ 
                error: `Access forbidden: Required role [${allowedRoles.join(', ')}], your role is [${req.role}]` 
            });
        }
        next();
    };
};

/**
 * SuperAdmin Only Authorization Guard
 */
const superAdminOnly = (req, res, next) => {
    if (!req.role || req.role !== 'admin') {
        return res.status(403).json({ 
            error: 'SuperAdmin access required: You do not have administrative privileges' 
        });
    }
    next();
};

// Default export is requireAuth for seamless backward-compatibility with existing routes
module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
module.exports.superAdminOnly = superAdminOnly;
