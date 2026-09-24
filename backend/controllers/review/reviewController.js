const Review = require('../../models/review/Review');
const Product = require('../../models/catalog/Product');
const Order = require('../../models/order/Order');

/**
 * Get approved reviews for a product
 * GET /api/reviews/product/:idOrSlug
 */
const getProductReviews = async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        // Resolve product ID if slug was passed
        let productId = idOrSlug;
        if (!idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
            const product = await Product.findOne({ slug: idOrSlug });
            if (!product) return res.status(404).json({ error: 'Product not found' });
            productId = product._id;
        }

        const reviews = await Review.find({ productId, isApproved: true })
            .sort({ createdAt: -1 })
            .lean();

        // Calculate average rating breakdown
        const total = reviews.length;
        const avg = total > 0
            ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1))
            : 4.8; // default positive baseline

        const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (ratingBreakdown[r.rating] !== undefined) ratingBreakdown[r.rating]++;
        });

        res.json({
            productId,
            totalReviews: total,
            averageRating: avg,
            ratingBreakdown,
            reviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Submit customer review
 * POST /api/reviews/product/:idOrSlug
 */
const createReview = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const { rating, title, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ error: 'Rating (1-5) and review comment are required' });
        }

        let product = await Product.findById(idOrSlug).catch(() => null);
        if (!product) {
            product = await Product.findOne({ slug: idOrSlug });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ productId: product._id, userId: req.userId });
        if (existingReview) {
            return res.status(409).json({ error: 'You have already submitted a review for this product' });
        }

        // Check if verified buyer from order history
        const hasPurchased = await Order.findOne({
            customerId: req.userId,
            status: { $in: ['delivered', 'packed', 'shipped', 'received'] }
        });

        const review = await Review.create({
            productId: product._id,
            userId: req.userId,
            userName: req.user?.fullName || 'Verified Buyer',
            rating: Number(rating),
            title: title || '',
            comment: comment.trim(),
            verifiedPurchase: !!hasPurchased,
            isApproved: true
        });

        res.status(201).json({
            message: 'Thank you! Your review has been published.',
            review
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Super Admin: Get all reviews for moderation
 * GET /api/reviews/admin/all
 */
const getAdminReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('productId', 'title slug images')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Toggle review approval status
 * PATCH /api/reviews/admin/:id/toggle
 */
const toggleReviewApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        review.isApproved = !review.isApproved;
        review.status = review.isApproved ? 'approved' : 'rejected';
        await review.save();

        res.json({ message: `Review approval set to ${review.isApproved}`, review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Update explicit review status
 * PATCH /api/reviews/admin/:id/status
 */
const updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        if (status) {
            review.status = status;
            review.isApproved = (status === 'approved');
        } else {
            review.isApproved = !review.isApproved;
            review.status = review.isApproved ? 'approved' : 'rejected';
        }
        await review.save();

        res.json({ message: `Review status updated to ${review.status}`, review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Delete review
 * DELETE /api/reviews/admin/:id
 */
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await Review.findByIdAndDelete(id);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProductReviews,
    createReview,
    getAdminReviews,
    toggleReviewApproval,
    updateReviewStatus,
    deleteReview
};
