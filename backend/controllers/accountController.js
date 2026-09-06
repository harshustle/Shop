const Address = require('../models/Address');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');

/**
 * Get customer profile & saved addresses
 * GET /api/account/me
 */
const getAccountDetails = async (req, res) => {
    try {
        const [user, addresses, wishlistDoc] = await Promise.all([
            User.findById(req.userId).select('-password'),
            Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 }),
            Wishlist.findOne({ userId: req.userId })
        ]);

        if (!user) return res.status(404).json({ error: 'User account not found' });

        const activeWishlist = wishlistDoc?.products?.map(p => p.toString()) || user.metadata?.wishlist || [];

        res.json({
            user: user.toSafeJSON(),
            addresses: addresses || [],
            wishlist: activeWishlist
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

        res.json({ message: 'Profile updated successfully', user: user.toSafeJSON() });
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
        const { label, fullName, phoneNumber, streetAddress, apartment, city, state, postalCode, isDefault } = req.body;

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
            isDefault: isDefault === true
        });

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

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.metadata = user.metadata || {};
        let wishlist = user.metadata.wishlist || [];

        const index = wishlist.indexOf(productId.toString());
        let added = false;
        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(productId.toString());
            added = true;
        }

        user.metadata.wishlist = wishlist;
        user.markModified('metadata');
        await user.save();

        // Also persist to dedicated Wishlist collection
        await Wishlist.findOneAndUpdate(
            { userId: req.userId },
            { products: wishlist },
            { upsert: true, new: true }
        ).catch(err => console.error('Wishlist collection sync error:', err));

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

module.exports = {
    getAccountDetails,
    updateProfile,
    saveAddress,
    deleteAddress,
    toggleWishlist
};
