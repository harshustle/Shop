const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const superAdminOnly = require('../../middleware/superAdminOnly');
const {
    getProductReviews,
    createReview,
    getAdminReviews,
    toggleReviewApproval,
    updateReviewStatus,
    deleteReview
} = require('../../controllers/review/reviewController');

// Public: Get reviews for product
router.get('/product/:idOrSlug', getProductReviews);

// Customer: Submit review
router.post('/product/:idOrSlug', auth, createReview);

// Admin: Moderate reviews
router.get('/admin', auth, superAdminOnly, getAdminReviews);
router.get('/admin/all', auth, superAdminOnly, getAdminReviews);
router.patch('/admin/:id/status', auth, superAdminOnly, updateReviewStatus);
router.patch('/admin/:id/toggle', auth, superAdminOnly, toggleReviewApproval);
router.delete('/admin/:id', auth, superAdminOnly, deleteReview);

module.exports = router;
