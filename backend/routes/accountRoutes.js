const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAccountDetails,
    updateProfile,
    saveAddress,
    deleteAddress,
    toggleWishlist,
    getUserLocation,
    setUserLocation
} = require('../controllers/accountController');

router.use(auth);

router.get('/me', getAccountDetails);
router.put('/profile', updateProfile);
router.post('/addresses', saveAddress);
router.delete('/addresses/:id', deleteAddress);
router.post('/wishlist/toggle', toggleWishlist);
router.get('/location', getUserLocation);
router.put('/location', setUserLocation);

module.exports = router;
