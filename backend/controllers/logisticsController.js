const logisticsService = require('../services/logisticsService');
const Order = require('../models/Order');

/**
 * 1-Click Fleet Dispatch: Generates AWB & Assigns Rider
 */
const dispatchOrder = async (req, res) => {
    try {
        const { orderId, riderName, riderPhone, vehicleNumber, estimatedDeliveryDate } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: 'orderId is required' });
        }

        const result = await logisticsService.dispatchOrder({
            orderId,
            riderName,
            riderPhone,
            vehicleNumber,
            estimatedDeliveryDate
        });

        res.json(result);
    } catch (error) {
        console.error('[Dispatch Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Updates package tracking status (e.g. PACKED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, RTO_INITIATED)
 */
const updateTrackingStatus = async (req, res) => {
    try {
        const { orderId, status, activity, location } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({ error: 'orderId and status are required' });
        }

        const order = await logisticsService.updateTrackingStatus({
            orderId,
            status,
            activity,
            location
        });

        res.json({
            success: true,
            orderNumber: order.orderNumber,
            fulfillmentStatus: order.fulfillmentStatus,
            trackingHistory: order.shippingLogistics.trackingHistory
        });
    } catch (error) {
        console.error('[Update Tracking Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Tracking timeline lookup by AWB Code or Order Number
 */
const getTrackingTimeline = async (req, res) => {
    try {
        const { identifier } = req.params;
        if (!identifier) {
            return res.status(400).json({ error: 'Tracking code or order number required' });
        }

        let order = await Order.findOne({ 'shippingLogistics.awbCode': identifier });
        if (!order) {
            order = await Order.findOne({ orderNumber: identifier });
        }
        if (!order && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(identifier);
        }

        if (!order) {
            return res.status(404).json({ error: `No shipment found for tracking code: ${identifier}` });
        }

        res.json({
            orderNumber: order.orderNumber,
            awbCode: order.shippingLogistics?.awbCode || 'Pending Dispatch',
            courierName: order.shippingLogistics?.courierName || 'FreshCart Express Fleet',
            fulfillmentStatus: order.fulfillmentStatus || 'UNFULFILLED',
            rider: {
                name: order.shippingLogistics?.riderName || 'Express Fleet Rider',
                phone: order.shippingLogistics?.riderPhone || '',
                vehicle: order.shippingLogistics?.vehicleNumber || ''
            },
            estimatedDeliveryDate: order.shippingLogistics?.estimatedDeliveryDate,
            trackingHistory: order.shippingLogistics?.trackingHistory || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Returns printable HTML shipping slip for delivery riders
 */
const getShippingLabel = async (req, res) => {
    try {
        const { orderId } = req.params;
        const html = await logisticsService.generateShippingLabelHtml(orderId);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(500).send(`<h3>Error generating shipping label: ${error.message}</h3>`);
    }
};

/**
 * Customer RMA Return Request
 */
const requestRma = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: 'orderId is required' });
        }

        const result = await logisticsService.createRmaRequest({ orderId, reason });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Staff/Admin RMA status review and automated refund trigger
 */
const updateRmaStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rmaStatus, refundAmount } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (!order.rma) order.rma = {};
        order.rma.rmaStatus = rmaStatus;

        if (rmaStatus === 'REFUNDED') {
            order.paymentStatus = 'refunded';
            order.rma.refundId = `RFND-${Date.now().toString().slice(-8)}`;
        }

        if (!order.shippingLogistics.trackingHistory) {
            order.shippingLogistics.trackingHistory = [];
        }

        order.shippingLogistics.trackingHistory.push({
            status: `RMA_${rmaStatus}`,
            activity: `Return ticket updated to ${rmaStatus}${order.rma.refundId ? ` (Refund ID: ${order.rma.refundId})` : ''}`,
            location: 'Central Returns Hub',
            timestamp: new Date()
        });

        await order.save();

        res.json({
            success: true,
            message: `RMA status updated to ${rmaStatus}`,
            order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    dispatchOrder,
    updateTrackingStatus,
    getTrackingTimeline,
    getShippingLabel,
    requestRma,
    updateRmaStatus
};
