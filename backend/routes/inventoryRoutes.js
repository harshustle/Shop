const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getLowStockAlerts } = require('../controllers/inventoryController');

// UC-11: Low-stock threshold alerts
router.get('/alerts', auth, getLowStockAlerts);

module.exports = router;
