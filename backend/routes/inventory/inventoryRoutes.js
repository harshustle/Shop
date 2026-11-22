const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const superAdminOnly = require('../../middleware/superAdminOnly');
const { getLowStockAlerts } = require('../../controllers/inventory/inventoryController');

// UC-11: Low-stock threshold alerts
router.get('/alerts', auth, superAdminOnly, getLowStockAlerts);

module.exports = router;
