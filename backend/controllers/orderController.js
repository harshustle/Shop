const Order = require('../models/Order');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates order - 100% compatible with CustomerForm.jsx and spec
 */
const createOrder = async (req, res) => {
    try {
        const {
            customerName,
            phoneNumber,
            email,
            address,
            products = [],
            status = 'pending'
        } = req.body;

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `ORD-${dateStr}-${randomNum}`;

        // Link with customer account if exists
        let customerId = null;
        if (phoneNumber) {
            const user = await User.findOne({ phone: phoneNumber });
            if (user) customerId = user._id;
        }

        // Build items snapshot and compute totals
        let subtotal = 0;
        const normalizedProducts = [];
        const snapshotItems = [];

        if (Array.isArray(products)) {
            for (const p of products) {
                const pName = p.productName || p.name || 'Custom Product';
                const pQty = Number(p.quantity) || 1;
                const pPrice = Number(p.price) || 299.00;
                const lineTotal = parseFloat((pPrice * pQty).toFixed(2));
                subtotal += lineTotal;

                normalizedProducts.push({
                    productName: pName,
                    quantity: pQty,
                    price: pPrice
                });

                snapshotItems.push({
                    skuSnapshot: p.sku || 'SKU-DIRECT',
                    productTitleSnapshot: pName,
                    variantAttributesSnapshot: p.attributes || {},
                    unitPriceSnapshot: pPrice,
                    quantity: pQty,
                    totalLinePrice: lineTotal
                });
            }
        }

        const taxAmount = parseFloat((subtotal * 0.05).toFixed(2));
        const shippingFee = subtotal > 1000 ? 0.00 : 50.00;
        const totalAmount = parseFloat((subtotal + taxAmount + shippingFee).toFixed(2));

        const order = await Order.create({
            orderNumber,
            customerId,
            customerName,
            phoneNumber,
            email,
            address,
            products: normalizedProducts,
            items: snapshotItems,
            subtotal,
            taxAmount,
            shippingFee,
            totalAmount,
            status,
            orderStatus: status,
            paymentStatus: 'unpaid'
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Gets all orders for AdminPanel
 */
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Failed to get orders:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Updates order status (Admin)
 */
const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId || req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        let order = null;
        if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findByIdAndUpdate(
                orderId,
                { status, orderStatus: status },
                { new: true }
            );
        } else {
            order = await Order.findOneAndUpdate(
                { orderNumber: orderId },
                { status, orderStatus: status },
                { new: true }
            );
        }

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * UC-12: Process Order Fulfillment & Tracking
 */
const fulfillOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { carrier, tracking_number } = req.body;

        const query = orderId.match(/^[0-9a-fA-F]{24}$/) 
            ? { _id: orderId } 
            : { orderNumber: orderId };

        const order = await Order.findOneAndUpdate(
            query,
            {
                trackingCarrier: carrier || 'Standard Express',
                trackingNumber: tracking_number || `TRK-${Date.now()}`,
                status: 'shipped',
                orderStatus: 'shipped'
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            message: 'Order fulfilled and marked as shipped',
            order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * UC-7: Public Order Tracking
 */
const trackOrder = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const query = orderNumber.match(/^[0-9a-fA-F]{24}$/) 
            ? { _id: orderNumber } 
            : { orderNumber };

        const order = await Order.findOne(query);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get orders by customer phone (for Dashboard & UserOrders)
 */
const getUserOrdersByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const orders = await Order.find({ phoneNumber: phone }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete order
 */
const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id || req.params.orderId;
        const query = orderId.match(/^[0-9a-fA-F]{24}$/) 
            ? { _id: orderId } 
            : { orderNumber: orderId };

        const order = await Order.findOneAndDelete(query);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus,
    fulfillOrder,
    trackOrder,
    getUserOrdersByPhone,
    deleteOrder
};
