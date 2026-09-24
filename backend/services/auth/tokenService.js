const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-shop-jwt-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET + '-refresh-token-salt-2026');
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

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
            fullName: user.fullName || 'User',
            tokenType: 'access'
        };

        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }

    /**
     * Issues dedicated JWT Refresh Token for session renewal
     */
    static generateRefreshToken(user) {
        const payload = {
            sub: user._id.toString(),
            userId: user._id.toString(),
            role: user.role || 'customer',
            tokenType: 'refresh',
            jti: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')
        };

        return jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN
        });
    }

    /**
     * Helper to issue both Access and Refresh tokens
     */
    static generateTokenPair(user) {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return {
            token: accessToken, // Backward-compatible alias for existing callers
            accessToken,
            refreshToken
        };
    }

    /**
     * Verifies and decodes JWT Access token
     */
    static verifyAccessToken(token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            if (payload.tokenType && payload.tokenType !== 'access') {
                return {
                    valid: false,
                    expired: false,
                    message: 'Invalid token type: expected access token'
                };
            }
            return { valid: true, payload };
        } catch (error) {
            return {
                valid: false,
                expired: error.name === 'TokenExpiredError',
                message: error.message
            };
        }
    }

    /**
     * Verifies and decodes JWT Refresh token
     */
    static verifyRefreshToken(token) {
        try {
            const payload = jwt.verify(token, JWT_REFRESH_SECRET);
            if (payload.tokenType && payload.tokenType !== 'refresh') {
                return {
                    valid: false,
                    expired: false,
                    message: 'Invalid token type: expected refresh token'
                };
            }
            return { valid: true, payload };
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

