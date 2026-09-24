const Order = require('../../models/order/Order');
const Cart = require('../../models/order/Cart');
const User = require('../../models/auth/User');
const InventoryService = require('../../services/inventory/inventoryService');
const razorpayService = require('../../services/order/razorpayService');
const redisService = require('../../services/cache/redisService');
const { processIdempotentPayment } = require('../../services/order/paymentStrategy');
const { v4: uuidv4 } = require('uuid');

/**
 * UC-4 & UC-6: Acquire 15-minute stock hold via Redis Lua + MongoDB
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
                item.variant_id || item.variantId,
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
 * Section 6.2: Create Razorpay Order with Server-Side Canonical Pricing & 15-Min Stock Hold
 */
const createRazorpayOrder = async (req, res) => {
    try {
        const { items, destination_state, coupon_discount, session_token } = req.body;
        const sessionId = req.userId || session_token || `sess_${uuidv4()}`;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart items are required to create Razorpay order' });
        }

        // 1. Compute canonical pricing server-side (prevents client tampering)
        const pricing = await razorpayService.calculateCanonicalPricing(
            items, 
            destination_state || 'Maharashtra', 
            coupon_discount || 0
        );

        // 2. Acquire atomic 15-minute stock holds for each line item
        const holds = [];
        for (const it of pricing.lineItems) {
            const holdResult = await InventoryService.acquireStockHold(
                it.variantId,
                it.quantity,
                sessionId,
                15
            );
            if (!holdResult.success) {
                await InventoryService.releaseSessionHolds(sessionId);
                return res.status(409).json({
                    error: `Inventory lock failed: ${it.title} (${it.sku}) is out of stock.`,
                    details: holdResult
                });
            }
            holds.push(holdResult);
        }

        // 3. Create Razorpay order (Live API or High-Fidelity Sandbox)
        const razorpayOrder = await razorpayService.createOrder({
            amountInPaise: pricing.amountInPaise,
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: {
                sessionId: sessionId.toString(),
                itemCount: String(pricing.lineItems.length),
                subtotal: String(pricing.subtotal)
            }
        });

        res.json({
            success: true,
            ...razorpayOrder,
            pricing
        });
    } catch (error) {
        console.error('[Razorpay Order Creation Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Section 6.3: Verify Razorpay Payment Signature & Finalize Order
 */
const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            customer_name,
            phone_number,
            email,
            shipping_address,
            billing_address,
            items,
            coupon_code,
            coupon_discount
        } = req.body;

        const userId = req.userId || null;

        if (!razorpay_order_id || !razorpay_payment_id) {
            return res.status(400).json({ error: 'razorpay_order_id and razorpay_payment_id are required' });
        }

        // 1. Verify HMAC-SHA256 signature
        const isValid = razorpayService.verifyPaymentSignature({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        });

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid Razorpay payment signature. Payment validation failed.' });
        }

        // 2. Idempotency check: verify if order already created
        const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
        if (existingOrder) {
            return res.json({
                success: true,
                message: 'Order already processed',
                order: existingOrder
            });
        }

        // 3. Compute canonical pricing
        const destinationState = (shipping_address?.state || 'Maharashtra');
        const pricing = await razorpayService.calculateCanonicalPricing(
            items,
            destinationState,
            coupon_discount || 0
        );

        // 4. Atomic stock decrement for each line item
        for (const it of pricing.lineItems) {
            await InventoryService.atomicStockDecrement(it.variantId, it.quantity);
        }

        // 5. Generate Order Number
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `ORD-${dateStr}-${randomNum}`;

        const snapshotItems = pricing.lineItems.map(it => ({
            variantId: it.variantId,
            skuSnapshot: it.sku,
            productTitleSnapshot: it.title,
            unitPriceSnapshot: it.unitPrice,
            quantity: it.quantity,
            totalLinePrice: it.lineTotal
        }));

        const legacyProducts = pricing.lineItems.map(it => ({
            productName: it.title,
            quantity: it.quantity,
            price: it.unitPrice
        }));

        const addressStr = typeof shipping_address === 'string'
            ? shipping_address
            : (shipping_address?.address || JSON.stringify(shipping_address || {}));

        // 6. Create Order in MongoDB
        const order = await Order.create({
            orderNumber,
            customerId: userId,
            customerName: customer_name || 'Customer',
            phoneNumber: phone_number || '',
            email: email || '',
            address: addressStr,
            products: legacyProducts,
            items: snapshotItems,
            subtotal: pricing.subtotal,
            taxAmount: pricing.taxBreakdown.totalTax,
            taxBreakdown: pricing.taxBreakdown,
            shippingFee: pricing.shippingFee,
            totalAmount: pricing.totalAmount,
            couponCode: coupon_code || null,
            discountAmount: pricing.discount,
            paymentMethod: 'razorpay',
            status: 'processing',
            orderStatus: 'processing',
            paymentStatus: 'paid',
            fulfillmentStatus: 'UNFULFILLED',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature || 'verified_signature',
            shippingAddress: shipping_address || {},
            billingAddress: billing_address || shipping_address || {},
            shippingLogistics: {
                courierName: 'FreshCart Express Fleet',
                awbCode: `FC-${dateStr}-${randomNum}`,
                trackingHistory: [
                    {
                        status: 'ORDER_PLACED',
                        activity: 'Payment verified via Razorpay. Order confirmed.',
                        location: 'FreshCart Hub',
                        timestamp: new Date()
                    }
                ]
            }
        });

        // 7. Update user lifetime spend
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $inc: { totalSpend: pricing.totalAmount }
            });
            await InventoryService.releaseSessionHolds(userId.toString());
        }

        res.status(201).json({
            success: true,
            message: 'Payment verified and order created successfully',
            order
        });
    } catch (error) {
        console.error('[Verify Razorpay Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Section 6.4: Distributed Razorpay Webhook Deduplication Handler
 */
const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const payload = req.body;
        const rawBody = JSON.stringify(payload);

        // 1. Signature check
        if (!razorpayService.verifyWebhookSignature(rawBody, signature)) {
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;

        if (event === 'payment.captured' && paymentEntity) {
            const paymentId = paymentEntity.id;
            const razorpayOrderId = paymentEntity.order_id;

            // 2. Distributed Lock via Redis SETNX (prevents duplicate webhook processing)
            const lockAcquired = await redisService.setnx(`webhook:lock:${paymentId}`, '1', 60);
            if (!lockAcquired) {
                return res.json({ status: 'ignored', message: 'Webhook already processed or currently locking' });
            }

            // Find matching order
            const order = await Order.findOne({ razorpayOrderId });
            if (order && order.paymentStatus !== 'paid') {
                order.paymentStatus = 'paid';
                order.status = 'processing';
                order.orderStatus = 'processing';
                order.razorpayPaymentId = paymentId;
                await order.save();
            }
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('[Razorpay Webhook Error]:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Section 6.5: Delivery Pincode & Cash on Delivery (COD) Serviceability Check
 */
const validatePincodeAndCod = async (req, res) => {
    try {
        const { pincode } = req.params;
        const totalAmount = Number(req.query.amount) || 0;
        const user = req.userId ? await User.findById(req.userId) : null;

        const codEvaluation = await razorpayService.evaluateCodRisk({
            user,
            totalAmount,
            pincode
        });

        res.json({
            pincode,
            serviceable: true,
            codEligible: codEvaluation.allowed,
            reason: codEvaluation.reason || 'Serviceable for both Online and Cash on Delivery',
            estimatedDeliveryDays: 1 // FreshCart Same-day / Next-day delivery
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Creates standard checkout order (Cash on Delivery or Local/Card Gateway)
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
            cart_id,
            payment_method = 'cod',
            coupon_code,
            coupon_discount = 0
        } = req.body;

        const userId = req.userId || null;
        const user = userId ? await User.findById(userId) : null;

        // 1. Validate items
        let rawItems = items || [];
        if ((!rawItems || rawItems.length === 0) && cart_id) {
            const cart = await Cart.findById(cart_id);
            if (cart && cart.items.length > 0) {
                rawItems = cart.items.map(it => ({
                    variant_id: it.variantId,
                    quantity: it.quantity
                }));
            }
        }

        if (rawItems.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }

        // 2. Canonical pricing computation
        const destinationState = (shipping_address?.state || 'Maharashtra');
        const pricing = await razorpayService.calculateCanonicalPricing(
            rawItems,
            destinationState,
            coupon_discount
        );

        // 3. Anti-Fraud COD Evaluation
        if (payment_method.toLowerCase() === 'cod') {
            const codCheck = await razorpayService.evaluateCodRisk({
                user,
                totalAmount: pricing.totalAmount,
                pincode: shipping_address?.pincode || shipping_address?.postalCode
            });

            if (!codCheck.allowed) {
                return res.status(403).json({
                    error: codCheck.reason,
                    codBlocked: true
                });
            }
        }

        // 4. Atomic stock decrement for each item
        for (const it of pricing.lineItems) {
            await InventoryService.atomicStockDecrement(it.variantId, it.quantity);
        }

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `ORD-${dateStr}-${randomNum}`;

        const snapshotItems = pricing.lineItems.map(it => ({
            variantId: it.variantId,
            skuSnapshot: it.sku,
            productTitleSnapshot: it.title,
            unitPriceSnapshot: it.unitPrice,
            quantity: it.quantity,
            totalLinePrice: it.lineTotal
        }));

        const legacyProducts = pricing.lineItems.map(it => ({
            productName: it.title,
            quantity: it.quantity,
            price: it.unitPrice
        }));

        const addressStr = typeof shipping_address === 'string'
            ? shipping_address
            : (shipping_address?.address || JSON.stringify(shipping_address || {}));

        const isPaidOnline = payment_method.toLowerCase() === 'paid_mock';

        const order = await Order.create({
            orderNumber,
            customerId: userId,
            customerName: customer_name || 'Customer',
            phoneNumber: phone_number || '',
            email: email || '',
            address: addressStr,
            products: legacyProducts,
            items: snapshotItems,
            subtotal: pricing.subtotal,
            taxAmount: pricing.taxBreakdown.totalTax,
            taxBreakdown: pricing.taxBreakdown,
            shippingFee: pricing.shippingFee,
            totalAmount: pricing.totalAmount,
            couponCode: coupon_code || null,
            discountAmount: pricing.discount,
            paymentMethod: payment_method,
            status: isPaidOnline ? 'processing' : 'pending',
            orderStatus: isPaidOnline ? 'processing' : 'pending',
            paymentStatus: isPaidOnline ? 'paid' : 'unpaid',
            fulfillmentStatus: 'UNFULFILLED',
            shippingAddress: shipping_address || {},
            billingAddress: billing_address || shipping_address || {},
            shippingLogistics: {
                courierName: 'FreshCart Express Fleet',
                awbCode: `FC-${dateStr}-${randomNum}`,
                trackingHistory: [
                    {
                        status: 'ORDER_PLACED',
                        activity: `Order received (${payment_method.toUpperCase()}). Ready for fulfillment.`,
                        location: 'FreshCart Local Hub',
                        timestamp: new Date()
                    }
                ]
            }
        });

        // Update user spend & cleanup session holds
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $inc: { totalSpend: pricing.totalAmount }
            });
            await InventoryService.releaseSessionHolds(userId.toString());
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('Checkout error:', error);
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

        const paymentResult = await processIdempotentPayment({
            orderId: order._id,
            amount: order.totalAmount,
            currency,
            gateway: payment_gateway,
            idempotencyKey: idempotency_key
        });

        if (paymentResult.payment.status === 'succeeded') {
            order.paymentStatus = 'paid';
            order.status = 'processing';
            order.orderStatus = 'processing';
            await order.save();

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
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook,
    validatePincodeAndCod,
    createCheckoutOrder,
    processCheckoutPayment
};
