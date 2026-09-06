const Order = require('../models/Order');
const Cart = require('../models/Cart');
const InventoryService = require('../services/inventoryService');
const { processIdempotentPayment } = require('../services/paymentStrategy');
const { v4: uuidv4 } = require('uuid');

/**
 * UC-4 & UC-6: Acquire 15-minute stock hold in MongoDB
 */
const acquireInventoryHold = async (req, res) => {
    try {
        const { items, session_token } = req.body;
        const sessionId = req.userId || session_token || `sess_${uuidv4()}`;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items list cannot be empty' });
        }

        const holds = [];
        for (const item of items) {
            const holdResult = await InventoryService.acquireStockHold(
                item.variant_id,
                item.quantity,
                sessionId,
                15 // 15-minute hold
            );

            if (!holdResult.success) {
                await InventoryService.releaseSessionHolds(sessionId);
                return res.status(409).json({
                    error: 'Inventory hold failed due to concurrent demand or low stock',
                    details: holdResult
                });
            }
            holds.push(holdResult);
        }

        res.json({
            success: true,
            message: '15-minute inventory hold acquired successfully',
            holds
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Creates pending order with historical snapshots in MongoDB
 */
const createCheckoutOrder = async (req, res) => {
    try {
        const {
            customer_name,
            phone_number,
            email,
            shipping_address,
            billing_address,
            items,
            cart_id
        } = req.body;

        const userId = req.userId || null;
        let snapshotItems = [];
        let legacyProducts = [];

        if (Array.isArray(items) && items.length > 0) {
            for (const it of items) {
                const found = await InventoryService.findVariant(it.variant_id);
                if (!found || !found.variant) {
                    return res.status(404).json({ error: `Variant ${it.variant_id} not found` });
                }

                const lineTotal = parseFloat((found.variant.price * it.quantity).toFixed(2));
                snapshotItems.push({
                    variantId: found.variant._id.toString(),
                    skuSnapshot: found.variant.sku,
                    productTitleSnapshot: found.product.title,
                    variantAttributesSnapshot: found.variant.attributes || {},
                    unitPriceSnapshot: found.variant.price,
                    quantity: it.quantity,
                    totalLinePrice: lineTotal
                });

                legacyProducts.push({
                    productName: found.product.title,
                    quantity: it.quantity,
                    price: found.variant.price
                });
            }
        } else if (cart_id) {
            const cart = await Cart.findById(cart_id);
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ error: 'Cart is empty or not found' });
            }

            for (const it of cart.items) {
                const lineTotal = parseFloat((it.price * it.quantity).toFixed(2));
                snapshotItems.push({
                    variantId: it.variantId,
                    skuSnapshot: it.sku,
                    productTitleSnapshot: it.productTitle,
                    variantAttributesSnapshot: it.attributes || {},
                    unitPriceSnapshot: it.price,
                    quantity: it.quantity,
                    totalLinePrice: lineTotal
                });

                legacyProducts.push({
                    productName: it.productTitle,
                    quantity: it.quantity,
                    price: it.price
                });
            }
        } else {
            return res.status(400).json({ error: 'No items or cart specified' });
        }

        const subtotal = snapshotItems.reduce((sum, it) => sum + it.totalLinePrice, 0);
        const taxAmount = parseFloat((subtotal * 0.05).toFixed(2));
        const shippingFee = subtotal > 1000 ? 0.00 : 50.00;
        const totalAmount = parseFloat((subtotal + taxAmount + shippingFee).toFixed(2));

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `ORD-${dateStr}-${randomNum}`;

        const addressStr = typeof shipping_address === 'string' 
            ? shipping_address 
            : (shipping_address?.address || JSON.stringify(shipping_address || {}));

        const order = await Order.create({
            orderNumber,
            customerId: userId,
            customerName: customer_name || 'Customer',
            phoneNumber: phone_number || '',
            email: email || '',
            address: addressStr,
            products: legacyProducts,
            items: snapshotItems,
            subtotal,
            taxAmount,
            shippingFee,
            totalAmount,
            status: 'pending',
            orderStatus: 'pending',
            paymentStatus: 'unpaid',
            shippingAddress: shipping_address || {},
            billingAddress: billing_address || shipping_address || {}
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('MongoDB Checkout error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * UC-5: Process Idempotent Payment in MongoDB
 */
const processCheckoutPayment = async (req, res) => {
    try {
        const {
            order_id,
            payment_gateway = 'mock',
            idempotency_key = req.headers['idempotency-key'] || `idemp_${uuidv4()}`,
            currency = 'INR'
        } = req.body;

        if (!order_id) {
            return res.status(400).json({ error: 'order_id is required' });
        }

        const query = order_id.match(/^[0-9a-fA-F]{24}$/) ? { _id: order_id } : { orderNumber: order_id };
        const order = await Order.findOne(query);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.paymentStatus === 'paid') {
            return res.json({
                message: 'Order is already paid',
                order
            });
        }

        // 1. Process payment with idempotency key
        const paymentResult = await processIdempotentPayment({
            orderId: order._id,
            amount: order.totalAmount,
            currency,
            gateway: payment_gateway,
            idempotencyKey: idempotency_key
        });

        if (paymentResult.payment.status === 'succeeded') {
            // 2. Atomic stock decrement for each line item in MongoDB
            for (const it of order.items) {
                if (it.variantId) {
                    await InventoryService.atomicStockDecrement(it.variantId, it.quantity);
                }
            }

            // 3. Mark order as paid
            order.paymentStatus = 'paid';
            order.status = 'processing';
            order.orderStatus = 'processing';
            await order.save();

            // 4. Release session holds
            if (order.customerId) {
                await InventoryService.releaseSessionHolds(order.customerId.toString());
            }
        }

        res.json({
            success: paymentResult.payment.status === 'succeeded',
            payment: paymentResult.payment,
            order
        });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    acquireInventoryHold,
    createCheckoutOrder,
    processCheckoutPayment
};
