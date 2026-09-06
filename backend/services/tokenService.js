const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-shop-jwt-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class TokenService {
    /**
     * Issues standard JWT Access Token with user claims
     */
    static generateAccessToken(user) {
        const payload = {
            sub: user._id.toString(),
            userId: user._id.toString(),
            role: user.role || 'customer',
            isAdmin: user.role === 'admin',
            phone: user.phone,
            email: user.email || null,
            fullName: user.fullName || 'User'
        };

        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }

    /**
     * Verifies and decodes JWT token
     */
    static verifyAccessToken(token) {
        try {
            return { valid: true, payload: jwt.verify(token, JWT_SECRET) };
        } catch (error) {
            return {
                valid: false,
                expired: error.name === 'TokenExpiredError',
                message: error.message
            };
        }
    }
}

module.exports = TokenService;
