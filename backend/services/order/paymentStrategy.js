const Payment = require('../../models/order/Payment');
const { v4: uuidv4 } = require('uuid');

class IPaymentStrategy {
    async createPaymentIntent(amount, currency, idempotencyKey, metadata = {}) {
        throw new Error('createPaymentIntent must be implemented');
    }
    async verifyWebhookSignature(payload, signature) {
        throw new Error('verifyWebhookSignature must be implemented');
    }
    async processRefund(transactionId, amount) {
        throw new Error('processRefund must be implemented');
    }
}

class StripePaymentStrategy extends IPaymentStrategy {
    constructor(secretKey = process.env.STRIPE_SECRET_KEY) {
        super();
        this.secretKey = secretKey;
    }

    async createPaymentIntent(amount, currency = 'USD', idempotencyKey, metadata = {}) {
        return {
            gateway: 'stripe',
            clientSecret: `pi_mock_${uuidv4()}_secret_${uuidv4().substring(0, 8)}`,
            transactionId: `txn_stripe_${uuidv4()}`,
            amount,
            currency,
            status: 'succeeded'
        };
    }

    async verifyWebhookSignature(payload, signature) {
        return true;
    }

    async processRefund(transactionId, amount) {
        return { success: true, refundId: `re_${uuidv4()}` };
    }
}

class RazorpayPaymentStrategy extends IPaymentStrategy {
    constructor(keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET) {
        super();
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    async createPaymentIntent(amount, currency = 'INR', idempotencyKey, metadata = {}) {
        return {
            gateway: 'razorpay',
            orderId: `order_rp_${uuidv4().substring(0, 14)}`,
            transactionId: `pay_rp_${uuidv4().substring(0, 14)}`,
            amount,
            currency,
            status: 'succeeded'
        };
    }

    async verifyWebhookSignature(payload, signature) {
        return true;
    }

    async processRefund(transactionId, amount) {
        return { success: true, refundId: `rfnd_${uuidv4()}` };
    }
}

class MockPaymentStrategy extends IPaymentStrategy {
    async createPaymentIntent(amount, currency = 'INR', idempotencyKey, metadata = {}) {
        return {
            gateway: 'mock',
            transactionId: `mock_tx_${Date.now()}_${uuidv4().substring(0, 8)}`,
            amount,
            currency,
            status: 'succeeded',
            message: 'Mock payment authorized successfully'
        };
    }

    async verifyWebhookSignature(payload, signature) {
        return true;
    }

    async processRefund(transactionId, amount) {
        return { success: true, refundId: `mock_rfnd_${Date.now()}` };
    }
}

const getPaymentStrategy = (gatewayName = 'mock') => {
    switch (gatewayName.toLowerCase()) {
        case 'stripe':
            return new StripePaymentStrategy();
        case 'razorpay':
            return new RazorpayPaymentStrategy();
        default:
            return new MockPaymentStrategy();
    }
};

const processIdempotentPayment = async ({
    orderId,
    amount,
    currency = 'INR',
    gateway = 'mock',
    idempotencyKey,
    metadata = {}
}) => {
    // 1. Idempotency check in MongoDB
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment) {
        return {
            isDuplicate: true,
            payment: existingPayment
        };
    }

    // 2. Execute payment strategy
    const strategy = getPaymentStrategy(gateway);
    const intentResult = await strategy.createPaymentIntent(amount, currency, idempotencyKey, metadata);

    // 3. Save to Payment ledger
    const createdPayment = await Payment.create({
        orderId,
        paymentGateway: gateway,
        gatewayTransactionId: intentResult.transactionId,
        idempotencyKey,
        amount,
        currency,
        status: intentResult.status,
        gatewayResponse: intentResult
    });

    return {
        isDuplicate: false,
        payment: createdPayment
    };
};

module.exports = {
    IPaymentStrategy,
    StripePaymentStrategy,
    RazorpayPaymentStrategy,
    MockPaymentStrategy,
    getPaymentStrategy,
    processIdempotentPayment
};
