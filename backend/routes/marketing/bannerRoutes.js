const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
    getActiveBanners,
    getAdminBanners,
    createBanner,
    toggleBannerStatus,
    deleteBanner
} = require('../../controllers/marketing/bannerController');

const superAdminOnly = (req, res, next) => {
    if (req.isAdmin || req.role === 'admin') return next();
    return res.status(403).json({ error: 'Access denied: Super Admin privilege required' });
};

// Public
router.get('/', getActiveBanners);

// Admin
router.get('/admin', auth, superAdminOnly, getAdminBanners);
router.get('/admin/all', auth, superAdminOnly, getAdminBanners);
router.post('/admin', auth, superAdminOnly, createBanner);
router.patch('/admin/:id', auth, superAdminOnly, toggleBannerStatus);
router.patch('/admin/:id/toggle', auth, superAdminOnly, toggleBannerStatus);
router.delete('/admin/:id', auth, superAdminOnly, deleteBanner);

module.exports = router;
