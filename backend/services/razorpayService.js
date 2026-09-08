const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const User = require('../models/User');

class RazorpayService {
    constructor() {
        this.keyId = process.env.RAZORPAY_KEY_ID || '';
        this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
        this.storeState = (process.env.STORE_STATE || 'Maharashtra').toLowerCase().trim();
        this.maxCodAmount = Number(process.env.MAX_COD_AMOUNT) || 10000;

        // Check if real keys are supplied
        this.isLive = !!(
            this.keyId && 
            this.keySecret && 
            !this.keyId.includes('YOUR_KEY') && 
            !this.keySecret.includes('YOUR_SECRET')
        );

        this.client = null;
        if (this.isLive) {
            try {
                const Razorpay = require('razorpay');
                this.client = new Razorpay({
                    key_id: this.keyId,
                    key_secret: this.keySecret
                });
                console.log(`[RazorpayService] Initialized live Razorpay client with Key ID: ${this.keyId.substring(0, 8)}...`);
            } catch (err) {
                console.warn('[RazorpayService] Failed to load razorpay package:', err.message);
                this.isLive = false;
            }
        } else {
            console.log('[RazorpayService] Operating in Safe Sandbox/Mock mode (Real keys not yet set in .env)');
        }
    }

    /**
     * Section 6: Server-Side Canonical Price Calculation in Paise
     * Re-queries MongoDB to get authoritative variant prices and computes GST.
     * Prevents client-side price tampering.
     */
    async calculateCanonicalPricing(items = [], destinationState = '', couponDiscount = 0) {
        let subtotal = 0;
        const lineItems = [];

        for (const item of items) {
            let variant = null;
            let product = null;

            if (item.variant_id) {
                product = await Product.findOne({ "variants._id": item.variant_id });
                if (product) {
                    variant = product.variants.id(item.variant_id);
                }
            } else if (item.sku) {
                product = await Product.findOne({ "variants.sku": item.sku });
                if (product) {
                    variant = product.variants.find(v => v.sku === item.sku);
                }
            }

            if (!product || !variant) {
                throw new Error(`Variant ${item.variant_id || item.sku} not found in catalog`);
            }

            const unitPrice = Number(variant.price);
            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
            const lineTotal = parseFloat((unitPrice * quantity).toFixed(2));
            subtotal += lineTotal;

            lineItems.push({
                variantId: variant._id.toString(),
                sku: variant.sku,
                title: product.title,
                unitPrice,
                quantity,
                lineTotal,
                taxRatePercent: variant.taxRatePercent || 5,
                hsnCode: variant.hsnCode || '1905'
            });
        }

        subtotal = parseFloat(subtotal.toFixed(2));
        const effectiveDiscount = Math.min(subtotal, Math.max(0, Number(couponDiscount) || 0));
        const taxableSubtotal = Math.max(0, subtotal - effectiveDiscount);

        // Indian GST Calculation (Section 4.3 & 6)
        const isIntraState = destinationState.toLowerCase().trim() === this.storeState;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        const blendedTaxRate = 0.05; // 5% default GST on groceries & food
        const totalTax = parseFloat((taxableSubtotal * blendedTaxRate).toFixed(2));

        if (isIntraState) {
            cgst = parseFloat((totalTax / 2).toFixed(2));
            sgst = parseFloat((totalTax - cgst).toFixed(2));
        } else {
            igst = totalTax;
        }

        // Standard Delivery: Free over ₹500, else ₹40
        const shippingFee = subtotal >= 500 ? 0 : 40.00;
        const totalAmount = parseFloat((taxableSubtotal + totalTax + shippingFee).toFixed(2));
        const amountInPaise = Math.round(totalAmount * 100);

        return {
            subtotal,
            discount: effectiveDiscount,
            taxBreakdown: {
                cgst,
                sgst,
                igst,
                totalTax
            },
            shippingFee,
            totalAmount,
            amountInPaise,
            currency: 'INR',
            lineItems
        };
    }

    /**
     * Section 6.2: Create Razorpay Order
     */
    async createOrder({ amountInPaise, receipt, notes = {} }) {
        if (this.isLive && this.client) {
            try {
                const order = await this.client.orders.create({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: receipt || `rec_${Date.now()}`,
                    notes
                });
                return {
                    success: true,
                    mode: 'live',
                    keyId: this.keyId,
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    receipt: order.receipt
                };
            } catch (err) {
                console.error('[RazorpayService] Live order creation error:', err.message);
                throw new Error(`Razorpay gateway error: ${err.message}`);
            }
        }

        // Seamless Mock Fallback
        const mockOrderId = `order_mock_${uuidv4().replace(/-/g, '').substring(0, 14)}`;
        return {
            success: true,
            mode: 'mock',
            keyId: this.keyId || 'rzp_mock_freshcart',
            orderId: mockOrderId,
            amount: amountInPaise,
            currency: 'INR',
            receipt: receipt || `rec_${Date.now()}`
        };
    }

    /**
     * Section 6.3: HMAC-SHA256 Signature Verification
     */
    verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
        if (!razorpayOrderId || !razorpayPaymentId) {
            return false;
        }

        if (this.isLive) {
            const body = `${razorpayOrderId}|${razorpayPaymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', this.keySecret)
                .update(body.toString())
                .digest('hex');
            return expectedSignature === razorpaySignature;
        }

        // Sandbox/Mock verification
        return true;
    }

    /**
     * Section 6.4: Webhook Signature Verification
     */
    verifyWebhookSignature(rawBody, signature) {
        if (this.isLive && this.webhookSecret) {
            const expected = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(rawBody)
                .digest('hex');
            return expected === signature;
        }
        return true;
    }

    /**
     * Section 6.5: Cash on Delivery (COD) Anti-Fraud Risk Engine
     */
    async evaluateCodRisk({ user, totalAmount, pincode }) {
        // 1. Pincode validation: 6-digit Indian format
        const cleanPin = String(pincode || '').trim();
        if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
            return {
                allowed: false,
                reason: 'Invalid delivery pincode. Must be a valid 6-digit Indian pincode.'
            };
        }

        // 2. Maximum COD Order Value Check (Default ₹10,000)
        if (totalAmount > this.maxCodAmount) {
            return {
                allowed: false,
                reason: `Orders exceeding ₹${this.maxCodAmount.toLocaleString('en-IN')} are not eligible for Cash on Delivery. Please pay online via UPI, Cards, or NetBanking.`
            };
        }

        // 3. User Risk Check
        if (user) {
            if (user.codBlocked) {
                return {
                    allowed: false,
                    reason: 'Cash on Delivery is currently disabled for this account.'
                };
            }

            if (user.rtoCount >= 2) {
                return {
                    allowed: false,
                    reason: 'COD is restricted due to previous delivery rejections (RTO). Please select Online Payment.'
                };
            }
        }

        return {
            allowed: true,
            riskScore: 0,
            message: 'Eligible for Cash on Delivery'
        };
    }
}

module.exports = new RazorpayService();
