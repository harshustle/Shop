const InventoryService = require('../services/inventoryService');

const getLowStockAlerts = async (req, res) => {
    try {
        const alerts = await InventoryService.getLowStockAlerts();
        res.json({
            count: alerts.length,
            alerts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getLowStockAlerts
};
