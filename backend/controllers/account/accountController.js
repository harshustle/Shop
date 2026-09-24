const Address = require('../../models/account/Address');
const User = require('../../models/auth/User');
const Wishlist = require('../../models/account/Wishlist');
const RedisService = require('../../services/redisService');
const QCRedis = require('../../services/quickCommerceRedis');

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const LOCATION_TTL = 30 * 24 * 60 * 60; // 30 days

/**
 * Get customer profile & saved addresses (Redis accelerated)
 * GET /api/account/me
 */
const getAccountDetails = async (req, res) => {
    try {
        const profileKey = `user:profile:${req.userId}`;
        const addressesKey = `user:addresses:${req.userId}`;
        const wishlistKey = `user:wishlist:${req.userId}`;

        // 1. Fetch all 3 from Redis in parallel
        const [cachedUser, cachedAddresses, cachedWishlist] = await Promise.all([
            RedisService.get(profileKey),
            RedisService.get(addressesKey),
            RedisService.get(wishlistKey)
        ]);

        let user = cachedUser;
        let addresses = cachedAddresses;
        let wishlist = cachedWishlist;

        // 2. Hydrate missing data from MongoDB
        const dbPromises = [];
        if (!user) dbPromises.push(User.findById(req.userId).select('-password'));
        if (!addresses) dbPromises.push(Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 }));
        if (!wishlist) dbPromises.push(Wishlist.findOne({ userId: req.userId }));

        if (dbPromises.length > 0) {
            const dbResults = await Promise.all(dbPromises);
            let idx = 0;

            if (!user) {
                const dbUser = dbResults[idx++];
                if (!dbUser) return res.status(404).json({ error: 'User account not found' });
                user = dbUser.toSafeJSON ? dbUser.toSafeJSON() : dbUser;
                await RedisService.set(profileKey, user, CACHE_TTL);
            }

            if (!addresses) {
                addresses = dbResults[idx++] || [];
                await RedisService.set(addressesKey, addresses, CACHE_TTL);
            }

            if (!wishlist) {
                const wishlistDoc = dbResults[idx++];
                wishlist = wishlistDoc?.products?.map(p => p.toString()) || user?.metadata?.wishlist || [];
                await RedisService.set(wishlistKey, wishlist, CACHE_TTL);
            }
        }

        res.json({
            user,
            addresses: addresses || [],
            wishlist: wishlist || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update customer profile details
 * PUT /api/account/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (fullName) user.fullName = fullName.trim();
        if (email) user.email = email.trim().toLowerCase();
        await user.save();

        const safeUser = user.toSafeJSON();

        // Update Redis cache immediately
        await RedisService.set(`user:profile:${req.userId}`, safeUser, CACHE_TTL);

        res.json({ message: 'Profile updated successfully', user: safeUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Add or update saved address
 * POST /api/account/addresses
 */
const saveAddress = async (req, res) => {
    try {
        const { label, fullName, phoneNumber, streetAddress, apartment, city, state, postalCode, latitude, longitude, isDefault } = req.body;

        if (!fullName || !phoneNumber || !streetAddress || !city || !postalCode) {
            return res.status(400).json({ error: 'Full name, phone, street address, city, and pincode are required' });
        }

        const address = await Address.create({
            userId: req.userId,
            label: label || 'Home',
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            streetAddress: streetAddress.trim(),
            apartment: apartment ? apartment.trim() : '',
            city: city.trim(),
            state: state || 'Uttar Pradesh',
            postalCode: postalCode.trim(),
            latitude: latitude ? Number(latitude) : null,
            longitude: longitude ? Number(longitude) : null,
            isDefault: isDefault === true
        });

        // Re-cache updated address list in Redis
        const updatedAddresses = await Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
        await RedisService.set(`user:addresses:${req.userId}`, updatedAddresses, CACHE_TTL);

        res.status(201).json({ message: 'Address saved successfully', address });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Delete saved address
 * DELETE /api/account/addresses/:id
 */
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        await Address.findOneAndDelete({ _id: id, userId: req.userId });

        // Re-cache updated address list in Redis
        const remainingAddresses = await Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
        await RedisService.set(`user:addresses:${req.userId}`, remainingAddresses, CACHE_TTL);

        res.json({ message: 'Address removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Toggle product in wishlist
 * POST /api/account/wishlist/toggle
 */
const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ error: 'Product ID is required' });

        const wishlistKey = `user:wishlist:${req.userId}`;
        let wishlist = await RedisService.get(wishlistKey);

        if (!Array.isArray(wishlist)) {
            const wishlistDoc = await Wishlist.findOne({ userId: req.userId });
            wishlist = wishlistDoc?.products?.map(p => p.toString()) || [];
        }

        const index = wishlist.indexOf(productId.toString());
        let added = false;
        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(productId.toString());
            added = true;
        }

        // 1. Update Redis instantly
        await RedisService.set(wishlistKey, wishlist, CACHE_TTL);

        // 2. Asynchronously persist to MongoDB
        (async () => {
            try {
                await Wishlist.findOneAndUpdate(
                    { userId: req.userId },
                    { products: wishlist },
                    { upsert: true, new: true }
                );
                await User.findByIdAndUpdate(req.userId, { 'metadata.wishlist': wishlist });
            } catch (err) {
                console.error('[Wishlist] Background sync error:', err.message);
            }
        })();

        res.json({
            success: true,
            wishlist,
            added,
            message: added ? 'Product added to your wishlist!' : 'Product removed from wishlist.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get active user's selected delivery location from Redis
 * GET /api/account/location
 */
const getUserLocation = async (req, res) => {
    try {
        const locationKey = `user:location:${req.userId}`;
        const location = await RedisService.get(locationKey);
        res.json({
            success: true,
            location: location || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Save user's selected delivery location in Redis
 * PUT /api/account/location
 */
const setUserLocation = async (req, res) => {
    try {
        const { tag, address, flatNumber, landmark, lat, lng, postalCode, city } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        let geofenceResult = { withinBoundary: true, distanceKm: 0.5, etaMinutes: 12 };
        if (lat && lng) {
            geofenceResult = QCRedis.validateAddressGeofence(Number(lat), Number(lng));
        }

        const locationKey = `user:location:${req.userId}`;
        const locationData = {
            tag: tag || 'Home',
            address: address.trim(),
            flatNumber: flatNumber ? flatNumber.trim() : '',
            landmark: landmark ? landmark.trim() : '',
            lat: lat ? Number(lat) : null,
            lng: lng ? Number(lng) : null,
            postalCode: postalCode || '',
            city: city || '',
            distanceKm: geofenceResult.distanceKm,
            isDeliverable: geofenceResult.withinBoundary,
            etaMinutes: geofenceResult.etaMinutes || (geofenceResult.withinBoundary ? 12 : null),
            updatedAt: new Date()
        };

        await RedisService.set(locationKey, locationData, LOCATION_TTL);

        res.json({
            success: true,
            message: 'Delivery location saved in Redis',
            location: locationData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get user wallet balance & referral rewards
 * GET /api/account/wallet
 */
const getWallet = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.referralCode) {
            user.referralCode = 'FC' + (user.phone ? user.phone.slice(-6) : user._id.toString().slice(-6)).toUpperCase();
            await user.save();
        }

        const transactions = user.metadata?.walletTransactions || [
            {
                id: 'tx_welcome',
                type: 'credit',
                amount: 0,
                description: 'FreshCart Welcome Bonus',
                createdAt: user.createdAt || new Date()
            }
        ];

        res.json({
            success: true,
            balance: user.walletBalance || 0,
            referralCode: user.referralCode,
            referralReward: 5,
            transactions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Add money to wallet (Instant recharge / refund top-up)
 * POST /api/account/wallet/add
 */
const addWalletMoney = async (req, res) => {
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            return res.status(400).json({ error: 'Valid recharge amount is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.walletBalance = (user.walletBalance || 0) + numAmount;
        if (!user.metadata) user.metadata = {};
        if (!Array.isArray(user.metadata.walletTransactions)) {
            user.metadata.walletTransactions = [];
        }

        const newTx = {
            id: 'tx_' + Date.now(),
            type: 'credit',
            amount: numAmount,
            description: `Quick Wallet Top-up (₹${numAmount})`,
            createdAt: new Date()
        };
        user.metadata.walletTransactions.unshift(newTx);
        user.markModified('metadata');
        await user.save();

        // Invalidate and update Redis cache
        await RedisService.del(`user:profile:${req.userId}`);

        res.json({
            success: true,
            message: `₹${numAmount} added to FreshCart Wallet successfully!`,
            balance: user.walletBalance,
            transaction: newTx
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Submit user feedback or report an issue
 * POST /api/account/feedback
 */
const submitFeedback = async (req, res) => {
    try {
        const { category, rating, message } = req.body;
        if (!message || message.trim().length < 3) {
            return res.status(400).json({ error: 'Feedback message is required (at least 3 characters)' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const feedbackEntry = {
            id: 'fb_' + Date.now(),
            category: category || 'General Feedback',
            rating: Number(rating) || 5,
            message: message.trim(),
            submittedAt: new Date()
        };

        if (!user.metadata) user.metadata = {};
        if (!Array.isArray(user.metadata.feedbackHistory)) {
            user.metadata.feedbackHistory = [];
        }
        user.metadata.feedbackHistory.unshift(feedbackEntry);
        user.markModified('metadata');
        await user.save();

        res.json({
            success: true,
            message: 'Thank you! Your feedback has been received and shared with our support team.',
            feedback: feedbackEntry
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAccountDetails,
    updateProfile,
    saveAddress,
    deleteAddress,
    toggleWishlist,
    getUserLocation,
    setUserLocation,
    getWallet,
    addWalletMoney,
    submitFeedback
};

