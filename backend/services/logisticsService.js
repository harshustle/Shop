const Order = require('../models/Order');
const User = require('../models/User');

class LogisticsService {
    constructor() {
        this.fleetName = process.env.FLEET_NAME || 'FreshCart Express Fleet';
        this.hubAddress = process.env.WAREHOUSE_ADDRESS || 'Central Fulfillment Hub, Sector 4, Indirapuram, Ghaziabad, UP - 201014';
        this.hubContact = process.env.SUPPORT_PHONE || '1800-FRESH-CART';
    }

    /**
     * Generates a unique AWB tracking code for In-House Delivery Fleet
     */
    generateAwbCode() {
        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomHex = Math.floor(100000 + Math.random() * 900000);
        return `FC-EXP-${datePart}-${randomHex}`;
    }

    /**
     * 1-Click Dispatch: Generates AWB, assigns rider/vehicle, marks order as MANIFESTED
     */
    async dispatchOrder({ orderId, riderName, riderPhone, vehicleNumber, estimatedDeliveryDate }) {
        const query = orderId.match(/^[0-9a-fA-F]{24}$/) ? { _id: orderId } : { orderNumber: orderId };
        const order = await Order.findOne(query);

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        const awbCode = order.shippingLogistics?.awbCode || this.generateAwbCode();
        const now = new Date();
        const estDelivery = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : new Date(now.getTime() + 24 * 60 * 60 * 1000);

        order.fulfillmentStatus = 'MANIFESTED';
        order.status = 'processing';
        order.orderStatus = 'processing';

        if (!order.shippingLogistics) {
            order.shippingLogistics = {};
        }

        order.shippingLogistics.courierName = this.fleetName;
        order.shippingLogistics.awbCode = awbCode;
        order.shippingLogistics.riderName = riderName || order.shippingLogistics.riderName || 'In-House Courier Assigned';
        order.shippingLogistics.riderPhone = riderPhone || order.shippingLogistics.riderPhone || '';
        order.shippingLogistics.vehicleNumber = vehicleNumber || order.shippingLogistics.vehicleNumber || '';
        order.shippingLogistics.pickupScheduledDate = now;
        order.shippingLogistics.estimatedDeliveryDate = estDelivery;

        if (!Array.isArray(order.shippingLogistics.trackingHistory)) {
            order.shippingLogistics.trackingHistory = [];
        }

        order.shippingLogistics.trackingHistory.push({
            status: 'MANIFESTED',
            activity: `Package packed and manifested. Assigned to Rider: ${order.shippingLogistics.riderName} (${order.shippingLogistics.vehicleNumber || 'Van'})`,
            location: 'Central Dispatch Hub',
            timestamp: now
        });

        await order.save();

        return {
            success: true,
            message: 'Order dispatched via In-House Fleet',
            orderNumber: order.orderNumber,
            awbCode,
            fulfillmentStatus: order.fulfillmentStatus,
            rider: {
                name: order.shippingLogistics.riderName,
                phone: order.shippingLogistics.riderPhone,
                vehicle: order.shippingLogistics.vehicleNumber
            },
            estimatedDelivery: estDelivery
        };
    }

    /**
     * Updates live fulfillment status (e.g. OUT_FOR_DELIVERY, DELIVERED, RTO_INITIATED)
     */
    async updateTrackingStatus({ orderId, status, activity, location }) {
        const query = orderId.match(/^[0-9a-fA-F]{24}$/) ? { _id: orderId } : { orderNumber: orderId };
        const order = await Order.findOne(query);

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        order.fulfillmentStatus = status;

        if (status === 'DELIVERED') {
            order.status = 'delivered';
            order.orderStatus = 'delivered';
            if (order.paymentMethod === 'cod') {
                order.paymentStatus = 'paid'; // COD collected at doorstep
            }
        } else if (status === 'OUT_FOR_DELIVERY') {
            order.status = 'out_for_delivery';
            order.orderStatus = 'out_for_delivery';
        } else if (status === 'IN_TRANSIT') {
            order.status = 'shipped';
            order.orderStatus = 'shipped';
        } else if (status === 'RTO_INITIATED' || status === 'RETURNED') {
            if (order.customerId) {
                await User.findByIdAndUpdate(order.customerId, {
                    $inc: { rtoCount: 1 }
                });
            }
        }

        if (!order.shippingLogistics.trackingHistory) {
            order.shippingLogistics.trackingHistory = [];
        }

        order.shippingLogistics.trackingHistory.push({
            status,
            activity: activity || `Package status updated to ${status}`,
            location: location || 'Local Area Fleet',
            timestamp: new Date()
        });

        await order.save();
        return order;
    }

    /**
     * Generates a printable shipping label HTML / Slip for the fleet rider
     */
    async generateShippingLabelHtml(orderId) {
        const query = orderId.match(/^[0-9a-fA-F]{24}$/) ? { _id: orderId } : { orderNumber: orderId };
        const order = await Order.findOne(query);

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        const awb = order.shippingLogistics?.awbCode || `FC-EXP-${Date.now().toString().slice(-8)}`;
        const isCod = order.paymentMethod?.toLowerCase() === 'cod';

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Shipping Label - ${awb}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #0f172a; }
                .label-box { width: 380px; border: 2px solid #0f172a; padding: 16px; border-radius: 8px; margin: auto; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
                .cod-badge { background: #fee2e2; color: #b91c1c; border: 1px solid #f87171; }
                .prepaid-badge { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
                .barcode-sim { background: #0f172a; height: 36px; border-radius: 2px; margin: 12px 0 6px 0; display: flex; align-items: center; justify-content: center; color: white; letter-spacing: 4px; font-family: monospace; font-size: 14px; }
                .section { margin-top: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; font-size: 13px; }
                .section strong { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
                .amount { font-size: 20px; font-weight: bold; color: #0f172a; }
                .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="label-box">
                <div class="header">
                    <div>
                        <h2 style="margin:0; font-size: 18px; color: #16a34a;">FreshCart Express</h2>
                        <span style="font-size: 11px; color: #64748b;">In-House Delivery Fleet</span>
                    </div>
                    <div>
                        ${isCod 
                            ? `<span class="badge cod-badge">C.O.D. ₹${order.totalAmount}</span>` 
                            : `<span class="badge prepaid-badge">PREPAID</span>`
                        }
                    </div>
                </div>

                <div class="barcode-sim">|||| | | ||||| ||| | ||| ||||</div>
                <div style="text-align: center; font-family: monospace; font-weight: bold; font-size: 13px;">${awb}</div>

                <div class="section">
                    <strong>Ship To (Customer):</strong>
                    <div style="font-weight: bold; font-size: 14px;">${order.customerName}</div>
                    <div>Phone: <strong>${order.phoneNumber}</strong></div>
                    <div>${order.address}</div>
                </div>

                <div class="section">
                    <strong>Order Summary:</strong>
                    <div>Order No: <strong>${order.orderNumber}</strong></div>
                    <div>Items: ${order.items?.length || order.products?.length || 1} product(s)</div>
                    ${isCod ? `<div style="margin-top: 4px;">Collect Cash: <span class="amount">₹${order.totalAmount}</span></div>` : ''}
                </div>

                <div class="section">
                    <strong>Assigned Rider:</strong>
                    <div>${order.shippingLogistics?.riderName || 'Express Fleet Rider'} ${order.shippingLogistics?.vehicleNumber ? `(${order.shippingLogistics.vehicleNumber})` : ''}</div>
                </div>

                <div class="footer">
                    Origin: ${this.hubAddress} | Helpline: ${this.hubContact}
                </div>
            </div>
            <script>
                // Auto-trigger print dialog when opened in new window
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
        `;

        return html;
    }

    /**
     * Reverse Logistics: Creates RMA return ticket and schedules reverse pickup
     */
    async createRmaRequest({ orderId, reason }) {
        const query = orderId.match(/^[0-9a-fA-F]{24}$/) ? { _id: orderId } : { orderNumber: orderId };
        const order = await Order.findOne(query);

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        if (order.fulfillmentStatus !== 'DELIVERED' && order.status !== 'delivered') {
            throw new Error('Returns can only be requested for delivered orders');
        }

        const reverseAwb = `RMA-${order.orderNumber.slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

        order.rma = {
            returnRequested: true,
            returnReason: reason || 'Customer requested return',
            rmaStatus: 'PENDING_APPROVAL',
            reverseAwb,
            refundId: ''
        };

        if (!order.shippingLogistics.trackingHistory) {
            order.shippingLogistics.trackingHistory = [];
        }

        order.shippingLogistics.trackingHistory.push({
            status: 'RMA_REQUESTED',
            activity: `Return requested: ${reason}. Awaiting hub authorization.`,
            location: 'Customer Doorstep',
            timestamp: new Date()
        });

        await order.save();

        return {
            success: true,
            message: 'Return request submitted successfully',
            orderNumber: order.orderNumber,
            rma: order.rma
        };
    }
}

module.exports = new LogisticsService();
