const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const superAdminOnly = require('../../middleware/superAdminOnly');
const {
    getAdminMetrics,
    getCustomers,
    deleteCustomer,
    deleteCustomerByPhone,
    updateAdminProfile
} = require('../../controllers/admin/adminController');

router.use(auth, superAdminOnly);

router.get('/metrics', getAdminMetrics);
router.get('/customers', getCustomers);
router.delete('/customers/by-phone/:phone', deleteCustomerByPhone);
router.delete('/customers/:id', deleteCustomer);
router.put('/profile', updateAdminProfile);

module.exports = router;
