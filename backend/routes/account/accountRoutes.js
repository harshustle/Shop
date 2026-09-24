const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
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
} = require('../../controllers/account/accountController');

router.use(auth);

router.get('/me', getAccountDetails);
router.put('/profile', updateProfile);
router.post('/addresses', saveAddress);
router.delete('/addresses/:id', deleteAddress);
router.post('/wishlist/toggle', toggleWishlist);
router.get('/location', getUserLocation);
router.put('/location', setUserLocation);
router.get('/wallet', getWallet);
router.post('/wallet/add', addWalletMoney);
router.post('/feedback', submitFeedback);

module.exports = router;

