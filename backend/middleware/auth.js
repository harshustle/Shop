const TokenService = require('../services/auth/tokenService');
const User = require('../models/auth/User');
const RedisService = require('../services/cache/redisService');
const QCRedis = require('../services/cache/quickCommerceRedis');

const PROFILE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Core Authentication Middleware
 * Extracts and verifies JWT Access Token from Authorization Header with Redis Profile Caching
 * and Instant Token Blacklist Revocation (Pattern 45)
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

        // Pattern 45: Check Redis JWT Blacklist for rapid revocation
        const isRevoked = await QCRedis.isTokenBlacklisted(token);
        if (isRevoked) {
            return res.status(401).json({ error: 'Session terminated: Token has been revoked. Please sign in again.' });
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

        // Check Redis profile cache first for sub-millisecond lookup
        const profileKey = `user:profile:${payload.userId}`;
        let user = await RedisService.get(profileKey);

        if (!user) {
            const dbUser = await User.findById(payload.userId).select('-password');
            if (!dbUser) {
                return res.status(401).json({ error: 'User account not found or was removed' });
            }
            user = dbUser.toSafeJSON ? dbUser.toSafeJSON() : dbUser.toObject();
            await RedisService.set(profileKey, user, PROFILE_TTL);
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

/**
 * Distributed Rate Limiting Middleware (Pattern 42)
 */
const rateLimiter = (maxLimit = 50, windowSeconds = 60) => {
    return async (req, res, next) => {
        try {
            const identifier = req.userId || req.ip || 'anonymous';
            const { allowed, current, maxLimit: limit, remaining } = await QCRedis.checkRateLimit(identifier, maxLimit, windowSeconds);
            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', remaining);
            if (!allowed) {
                return res.status(429).json({
                    error: 'Too Many Requests: Rate quota exceeded. Please slow down.',
                    retryAfterSeconds: windowSeconds
                });
            }
            next();
        } catch (e) {
            next();
        }
    };
};

// Default export is requireAuth for seamless backward-compatibility with existing routes
module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
module.exports.superAdminOnly = superAdminOnly;
module.exports.rateLimiter = rateLimiter;
