const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAdminMetrics,
    getCustomers,
    deleteCustomer
} = require('../controllers/adminController');

// Super Admin check middleware
const superAdminOnly = (req, res, next) => {
    if (req.isAdmin || req.role === 'admin' || req.userId === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Access denied: Super Admin privilege required' });
};

router.use(auth, superAdminOnly);

router.get('/metrics', getAdminMetrics);
router.get('/customers', getCustomers);
router.delete('/customers/:id', deleteCustomer);

module.exports = router;
