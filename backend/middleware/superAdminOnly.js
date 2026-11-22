const User = require('../models/auth/User');

const ADMIN_PHONE = (process.env.SUPER_ADMIN_PHONE || '9161955178').replace(/\D/g, '').slice(-10);

/**
 * Database-backed owner check. JWT role claims alone are never trusted because
 * an old or forged role claim must not grant access after an account changes.
 */
module.exports = async function superAdminOnly(req, res, next) {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Authentication required' });

        const owner = await User.findById(req.userId).select('phone role isActive').lean();
        if (!owner || owner.isActive === false || owner.role !== 'admin' || owner.phone !== ADMIN_PHONE) {
            return res.status(403).json({ error: 'Access denied: Store owner account required' });
        }

        req.role = 'admin';
        req.isAdmin = true;
        return next();
    } catch (error) {
        return res.status(403).json({ error: 'Administrative authorization could not be verified' });
    }
};

module.exports.ADMIN_PHONE = ADMIN_PHONE;
