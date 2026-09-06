const Banner = require('../models/Banner');

/**
 * Get active hero banners for storefront
 * GET /api/banners
 */
const getActiveBanners = async (req, res) => {
    try {
        let banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });

        // If none seeded yet, return high-converting default FreshCart banners
        if (banners.length === 0) {
            banners = [
                {
                    _id: 'banner-1',
                    title: 'Fresh & Organic Grocery Delivered in 15 Minutes',
                    subtitle: 'Farm-picked vegetables, staples, dairy & essentials at unbeatable wholesale prices',
                    badge: 'Weekend Mega Savings - Up to 40% Off',
                    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
                    targetUrl: '/shop',
                    bgColor: '#E8F8F0',
                    textColor: '#064E3B',
                    btnText: 'Explore Fresh Market',
                    displayOrder: 1
                },
                {
                    _id: 'banner-2',
                    title: 'Pure Desi Ghee, Oils & Kitchen Staples',
                    subtitle: 'Top Indian brands: Fortune, Aashirvaad, Tata & India Gate with genuine purity guarantee',
                    badge: 'Flat 20% Off With Code: FRESH20',
                    imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=1200&q=80',
                    targetUrl: '/shop?category=staples-and-grains',
                    bgColor: '#FEF3C7',
                    textColor: '#78350F',
                    btnText: 'Shop Pantry Staples',
                    displayOrder: 2
                },
                {
                    _id: 'banner-3',
                    title: 'Crisp Orchard Apples, Berries & Tropical Fruits',
                    subtitle: 'Direct from certified orchards to your doorstep with 100% replacement guarantee',
                    badge: 'Daily Morning Harvest',
                    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
                    targetUrl: '/shop?category=fresh-fruits',
                    bgColor: '#FEE2E2',
                    textColor: '#991B1B',
                    btnText: 'Order Fresh Fruits',
                    displayOrder: 3
                }
            ];
        }

        res.json(banners);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Get all banners
 * GET /api/banners/admin/all
 */
const getAdminBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Create new banner
 * POST /api/banners/admin
 */
const createBanner = async (req, res) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json({ message: 'Banner created successfully', banner });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Super Admin: Toggle banner active state
 * PATCH /api/banners/admin/:id/toggle
 */
const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);
        if (!banner) return res.status(404).json({ error: 'Banner not found' });
        banner.isActive = !banner.isActive;
        await banner.save();
        res.json({ message: `Banner is now ${banner.isActive ? 'Active' : 'Inactive'}`, banner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Super Admin: Delete banner
 * DELETE /api/banners/admin/:id
 */
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await Banner.findByIdAndDelete(id);
        res.json({ message: 'Banner removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getActiveBanners,
    getAdminBanners,
    createBanner,
    toggleBannerStatus,
    deleteBanner
};
