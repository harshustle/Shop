const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryService = require('../services/inventoryService');

const Category = require('../models/Category');

/**
 * Aggregated analytics for Super Admin
 */
const getAdminMetrics = async (req, res) => {
    try {
        const [orders, customersCount, productsCount, categoriesCount, alerts, adminUser] = await Promise.all([
            Order.find().lean(),
            User.countDocuments({ role: 'customer' }),
            Product.countDocuments(),
            Category.countDocuments(),
            InventoryService.getLowStockAlerts(),
            User.findOne({ role: 'admin' }).select('fullName phone email').lean()
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || Number(o.subtotal) || 0), 0);
        const pendingCount = orders.filter(o => (o.status || o.orderStatus) === 'pending').length;
        const packedCount = orders.filter(o => (o.status || o.orderStatus) === 'packed').length;
        const deliveredCount = orders.filter(o => (o.status || o.orderStatus) === 'delivered').length;
        const activeDispatches = pendingCount + packedCount;

        res.json({
            adminName: adminUser ? adminUser.fullName : 'Harsh Srivastava',
            adminPhone: adminUser ? adminUser.phone : '9161955178',
            totalOrders: orders.length,
            totalRevenue,
            totalCustomers: customersCount,
            totalProducts: productsCount,
            totalCategories: categoriesCount,
            pendingOrders: pendingCount,
            packedOrders: packedCount,
            deliveredOrders: deliveredCount,
            activeDispatches,
            lowStockCount: alerts.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Customer Registry for Super Admin
 */
const getCustomers = async (req, res) => {
    try {
        const customers = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });

        const customersWithStats = await Promise.all(customers.map(async (cust) => {
            const customerOrders = await Order.find({
                $or: [{ customerId: cust._id }, { phoneNumber: cust.phone }]
            });

            const totalSpend = customerOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

            return {
                _id: cust._id,
                fullName: cust.fullName,
                phone: cust.phone,
                email: cust.email,
                role: cust.role,
                createdAt: cust.createdAt,
                ordersCount: customerOrders.length,
                totalSpend
            };
        }));

        res.json(customersWithStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin customer deletion / ban
 */
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: 'Customer account removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAdminMetrics,
    getCustomers,
    deleteCustomer
};
