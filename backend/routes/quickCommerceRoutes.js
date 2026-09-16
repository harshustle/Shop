const express = require('express');
const router = express.Router();
const QCRedis = require('../services/quickCommerceRedis');

// ============================================================================
// DOMAIN 1: CHECKOUT & FLASH SALES
// ============================================================================

// 1. Atomic Stock Decrement
router.post('/flash-sale/decrement', async (req, res) => {
    try {
        const { sku, quantity = 1, currentStock = 100 } = req.body;
        const result = await QCRedis.atomicDecrementStock(sku, quantity, currentStock);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. 7-Min Temporary Cart Stock Hold
router.post('/flash-sale/hold', async (req, res) => {
    try {
        const { cartId, sku, quantity = 1, ttlSeconds = 420 } = req.body;
        const result = await QCRedis.reserveCartStock(cartId, sku, quantity, ttlSeconds);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Restock Rollback
router.post('/flash-sale/rollback', async (req, res) => {
    try {
        const { sku, quantity = 1 } = req.body;
        const result = await QCRedis.rollbackRestock(sku, quantity);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. First-N Promo Limit (Max 100 uses)
router.post('/flash-sale/promo', async (req, res) => {
    try {
        const { code, maxUses = 100 } = req.body;
        const result = await QCRedis.claimPromoCode(code, maxUses);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Single-Use User Voucher
router.post('/flash-sale/voucher', async (req, res) => {
    try {
        const { voucherCode, userId } = req.body;
        const result = await QCRedis.claimSingleUseVoucher(voucherCode, userId);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 6. Delivery Slot Quotas (Max 25 orders per slot)
router.post('/flash-sale/slot', async (req, res) => {
    try {
        const { slotId, maxQuota = 25 } = req.body;
        const result = await QCRedis.reserveDeliverySlot(slotId, maxQuota);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 7. Minimum Cart Value Enforcer (In RAM)
router.post('/flash-sale/min-cart', (req, res) => {
    const { subtotal, minRequired = 99 } = req.body;
    res.json(QCRedis.enforceMinCartValue(subtotal, minRequired));
});

// 8. Payment Webhook Idempotency Check
router.post('/flash-sale/webhook-idempotency', async (req, res) => {
    try {
        const { eventId, ttlSeconds = 60 } = req.body;
        const isNewEvent = await QCRedis.acquireWebhookIdempotency(eventId, ttlSeconds);
        res.json({ eventId, processed: !isNewEvent, canProcess: isNewEvent });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 9. Cart Abandonment Tracker
router.post('/flash-sale/abandonment', async (req, res) => {
    try {
        const { cartId, userId, ttlSeconds = 1800 } = req.body;
        const result = await QCRedis.trackCartAbandonment(cartId, userId, ttlSeconds);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 10. Surge Pricing Toggles
router.get('/flash-sale/surge/:zoneId', async (req, res) => {
    res.json(await QCRedis.getSurgeMultiplier(req.params.zoneId));
});

router.post('/flash-sale/surge', async (req, res) => {
    try {
        const { zoneId, multiplier = 1.25 } = req.body;
        res.json(await QCRedis.setSurgePricing(zoneId, multiplier));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// DOMAIN 2: SEARCH & STOREFRONT EXPERIENCE
// ============================================================================

// 11. Autocomplete Search
router.get('/search/autocomplete', async (req, res) => {
    try {
        const { q = '', limit = 8 } = req.query;
        const results = await QCRedis.searchAutocomplete(q, Number(limit));
        res.json({ query: q, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/search/index', async (req, res) => {
    try {
        const { keywords } = req.body;
        await QCRedis.indexSearchPrefixes(keywords);
        res.json({ success: true, count: keywords.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 12. Homepage Layout Cache
router.get('/storefront/layout', async (req, res) => {
    const layout = await QCRedis.getHomepageLayout();
    res.json({ layout });
});

router.post('/storefront/layout', async (req, res) => {
    await QCRedis.cacheHomepageLayout(req.body);
    res.json({ success: true });
});

// 14. Recently Viewed Shelves
router.get('/storefront/recently-viewed/:userId', async (req, res) => {
    const items = await QCRedis.getRecentlyViewed(req.params.userId);
    res.json({ userId: req.params.userId, items });
});

router.post('/storefront/recently-viewed', async (req, res) => {
    const { userId, productId } = req.body;
    await QCRedis.pushRecentlyViewed(userId, productId);
    res.json({ success: true });
});

// 15. User Search History
router.get('/search/history/:userId', async (req, res) => {
    const history = await QCRedis.getSearchHistory(req.params.userId);
    res.json({ history });
});

router.post('/search/history', async (req, res) => {
    const { userId, query } = req.body;
    await QCRedis.pushSearchHistory(userId, query);
    res.json({ success: true });
});

// 16. Hourly Best-Sellers (Trending)
router.get('/storefront/trending', async (req, res) => {
    const trending = await QCRedis.getHourlyBestSellers(Number(req.query.limit || 10));
    res.json({ trending });
});

router.post('/storefront/record-sale', async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    await QCRedis.recordProductSale(productId, quantity);
    res.json({ success: true });
});

// 18. Personalized Buy Again
router.get('/storefront/buy-again/:userId', async (req, res) => {
    const items = await QCRedis.getBuyAgainItems(req.params.userId);
    res.json({ items });
});

// 20. Store Open/Close Kill-Switch
router.get('/storefront/store-status', async (req, res) => {
    res.json(await QCRedis.isStoreOpen());
});

router.post('/storefront/store-status', async (req, res) => {
    const { isOpen, note } = req.body;
    res.json(await QCRedis.setStoreStatus(isOpen, note));
});

// ============================================================================
// DOMAIN 3: DARK STORE & IN-HUB PACKING
// ============================================================================

// 21. Dispatch Queue
router.post('/hub/enqueue', async (req, res) => {
    res.json(await QCRedis.enqueueOrderForPacking(req.body.orderId));
});

router.post('/hub/pop-next', async (req, res) => {
    const orderId = await QCRedis.popNextOrderForPicker(req.body.pickerId);
    res.json({ pickerId: req.body.pickerId, orderId });
});

// 22. Bin Picking Status
router.post('/hub/picking-status', async (req, res) => {
    const { orderId, itemId, status, notes } = req.body;
    await QCRedis.updateBinPickingStatus(orderId, itemId, status, notes);
    res.json({ success: true });
});

router.get('/hub/picking-status/:orderId', async (req, res) => {
    res.json(await QCRedis.getOrderPickingStatus(req.params.orderId));
});

// 23. Picker Velocity
router.post('/hub/picker-velocity', async (req, res) => {
    const { pickerId, count = 1 } = req.body;
    res.json(await QCRedis.incrementPickerVelocity(pickerId, count));
});

// 24. Out of Stock Broadcast
router.post('/hub/out-of-stock', async (req, res) => {
    res.json(await QCRedis.broadcastOutOfStock(req.body.productId, req.body.hubId));
});

// 26. Barcode Validation
router.post('/hub/barcode/register', async (req, res) => {
    const { barcode, skuData } = req.body;
    await QCRedis.registerBarcode(barcode, skuData);
    res.json({ registered: true, barcode });
});

router.get('/hub/barcode/:barcode', async (req, res) => {
    const item = await QCRedis.validateBarcode(req.params.barcode);
    res.json({ found: Boolean(item), item });
});

// 27. Bag Weight Verification
router.post('/hub/weight/verify', async (req, res) => {
    const { orderId, measuredGrams } = req.body;
    res.json(await QCRedis.verifyBagWeight(orderId, measuredGrams));
});

// 28. Assembly SLA Stopwatch
router.post('/hub/assembly/start', async (req, res) => {
    res.json(await QCRedis.startAssemblyTimer(req.body.orderId));
});

router.get('/hub/assembly/:orderId', async (req, res) => {
    res.json(await QCRedis.getAssemblyElapsedSeconds(req.params.orderId));
});

// 29. Cold-Chain Alert
router.post('/hub/coldchain/register', async (req, res) => {
    res.json(await QCRedis.registerColdChainBag(req.body.orderId));
});

router.get('/hub/coldchain/:orderId', async (req, res) => {
    res.json(await QCRedis.checkColdChainAlert(req.params.orderId));
});

// 30. Damaged SKU Log
router.post('/hub/damaged-sku', async (req, res) => {
    const { sku, quantity, reason, pickerId } = req.body;
    res.json(await QCRedis.logDamagedSKU(sku, quantity, reason, pickerId));
});

// ============================================================================
// DOMAIN 4: RIDER LOGISTICS & LAST-MILE
// ============================================================================

// 31. Ingest Driver GPS
router.post('/logistics/gps', async (req, res) => {
    const { riderId, latitude, longitude } = req.body;
    res.json(await QCRedis.ingestRiderGPS(riderId, latitude, longitude));
});

// Dark Store Hub Information & Turf GeoJSON Perimeter
router.get('/store-hub', (req, res) => {
    res.json({
        success: true,
        hub: QCRedis.getStoreHubInfo()
    });
});

// 32. Geofence Verification (Point-in-Polygon & Distance via Turf)
router.post('/logistics/geofence', (req, res) => {
    const { customerLat, customerLng, hubLat, hubLng, radiusKm, customPolygon } = req.body;
    res.json(QCRedis.validateAddressGeofence(customerLat, customerLng, hubLat, hubLng, radiusKm, customPolygon));
});

// 33. Nearest Riders in 2km
router.get('/logistics/nearest', async (req, res) => {
    const { lat = 26.8467, lng = 80.9462, radiusKm = 2 } = req.query;
    res.json(await QCRedis.findNearestRiders(Number(lat), Number(lng), Number(radiusKm)));
});

// 37. Route Checkpoints
router.post('/logistics/checkpoint', async (req, res) => {
    const { orderId, checkpointName } = req.body;
    res.json(await QCRedis.recordRouteCheckpoint(orderId, checkpointName));
});

router.get('/logistics/checkpoints/:orderId', async (req, res) => {
    res.json(await QCRedis.getRouteCheckpoints(req.params.orderId));
});

// 40. Proof-of-Delivery OTP
router.post('/logistics/delivery-otp/generate', async (req, res) => {
    res.json(await QCRedis.generateDeliveryOTP(req.body.orderId));
});

router.post('/logistics/delivery-otp/verify', async (req, res) => {
    const { orderId, otp } = req.body;
    res.json(await QCRedis.verifyDeliveryOTP(orderId, otp));
});

// ============================================================================
// DOMAIN 5: USER SECURITY & PLATFORM INFRASTRUCTURE
// ============================================================================

// 41. 2-Min Login OTP
router.post('/security/login-otp/send', async (req, res) => {
    res.json(await QCRedis.createLoginOTP(req.body.phone));
});

router.post('/security/login-otp/verify', async (req, res) => {
    const { phone, otp } = req.body;
    res.json(await QCRedis.verifyLoginOTP(phone, otp));
});

// 42. Rate Limiting Check
router.get('/security/rate-limit', async (req, res) => {
    const id = req.query.id || req.ip || 'client-test';
    res.json(await QCRedis.checkRateLimit(id, Number(req.query.limit || 50)));
});

// 45. JWT Token Blacklist
router.post('/security/blacklist-token', async (req, res) => {
    const { token, ttlSeconds = 86400 } = req.body;
    await QCRedis.blacklistToken(token, ttlSeconds);
    res.json({ blacklisted: true });
});

// 49. Feature Flags
router.get('/security/feature-flag/:flagName', async (req, res) => {
    res.json(await QCRedis.getFeatureFlag(req.params.flagName));
});

router.post('/security/feature-flag', async (req, res) => {
    const { flagName, enabled, config } = req.body;
    res.json(await QCRedis.setFeatureFlag(flagName, enabled, config));
});

// 50. Vendor Circuit Breaker
router.get('/security/circuit-breaker/:vendor', async (req, res) => {
    const isOpen = await QCRedis.isCircuitOpen(req.params.vendor);
    res.json({ vendor: req.params.vendor, circuitOpen: isOpen });
});

router.post('/security/circuit-breaker/failure', async (req, res) => {
    const { vendor, threshold = 5 } = req.body;
    res.json(await QCRedis.recordVendorFailure(vendor, threshold));
});

module.exports = router;
