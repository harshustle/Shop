const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAccountDetails,
    updateProfile,
    saveAddress,
    deleteAddress,
    toggleWishlist
} = require('../controllers/accountController');

router.use(auth);

router.get('/me', getAccountDetails);
router.put('/profile', updateProfile);
router.post('/addresses', saveAddress);
router.delete('/addresses/:id', deleteAddress);
router.post('/wishlist/toggle', toggleWishlist);

module.exports = router;
