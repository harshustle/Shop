import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  CheckCircle2,
  Tag,
  Plus
} from 'lucide-react';
import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const CATEGORIES_DATA = [
  { slug: 'staples-and-grains', name: 'Atta & Flours', icon: '🌾', count: '45 items', color: '#FEF3C7' },
  { slug: 'edible-oils', name: 'Oils & Ghee', icon: '🛢️', count: '28 items', color: '#E0F2FE' },
  { slug: 'fresh-fruits', name: 'Fresh Fruits', icon: '🍎', count: '62 items', color: '#FEE2E2' },
  { slug: 'organic-vegetables', name: 'Vegetables', icon: '🥦', count: '54 items', color: '#E8F8F0' },
  { slug: 'dairy-breakfast', name: 'Milk & Dairy', icon: '🥛', count: '38 items', color: '#EDE9FE' },
  { slug: 'packaged-foods-snacks', name: 'Tea & Snacks', icon: '☕', count: '40 items', color: '#FFEDD5' }
];

const TESTIMONIALS = [
  {
    name: 'Ananya Verma',
    location: 'Vibhuti Khand, Lucknow',
    rating: 5,
    text: 'FreshCart has completely changed how our family shops for groceries. The vegetables arrive fresh as morning harvest, and delivery is consistently under 15 minutes!',
    avatar: 'AV'
  },
  {
    name: 'Rajesh Malhotra',
    location: 'Indira Nagar, Lucknow',
    rating: 5,
    text: 'Genuine wholesale prices for Fortune oil and Aashirvaad Atta. Plus the checkout with coupon FRESH20 saved me an extra ₹150. Highly satisfied!',
    avatar: 'RM'
  },
  {
    name: 'Sneha Kapoor',
    location: 'Aliganj, Lucknow',
    rating: 5,
    text: 'The best customer support in town. One item was slightly bruised and they replaced it in 10 minutes with zero hassle. Truly 5-star service.',
    avatar: 'SK'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [offersList, setOffersList] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart & Checkout Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch Banners
        const bannerRes = await fetch(`${API_URL}/api/banners`);
        if (bannerRes.ok) {
          const bannerData = await bannerRes.json();
          setBanners(bannerData);
        }

        // Fetch Coupons
        const couponRes = await fetch(`${API_URL}/api/coupons/active`);
        if (couponRes.ok) {
          const couponData = await couponRes.json();
          setCoupons(couponData);
        }

        // Fetch Products
        const prodRes = await fetch(`${API_URL}/api/catalog/search?limit=24`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const items = prodData.items || prodData.products || [];
          setBestSellers(items.slice(0, 8));
          setNewArrivals(items.slice(4, 12));
          setOffersList(items.slice(2, 6));
        }
      } catch (err) {
        console.warn('Home fetch notice:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Banner autoplay timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const activeBanner = banners[currentBannerIdx] || {
    title: 'Farm-Fresh Grocery Delivered in 15 Minutes',
    subtitle: 'Daily organic fruits, vegetables, pure dairy & staples at genuine wholesale prices',
    badge: '⚡ Instant 15-Minute Delivery',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/shop',
    bgColor: '#E8F8F0',
    textColor: '#064E3B',
    btnText: 'Shop All Products'
  };

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const primaryVariant = (product.variants && product.variants[0]) || {
      _id: 'default-var',
      price: product.basePrice,
      sku: 'SKU-DIRECT'
    };
    addToCart(product, primaryVariant, 1);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      {/* FreshCart Navigation */}
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 space-y-12">

        {/* 1. HERO BANNER SLIDER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div 
            style={{ backgroundColor: activeBanner.bgColor || '#E8F8F0' }}
            className="rounded-3xl p-8 sm:p-12 transition-all duration-700 relative overflow-hidden shadow-sm border border-black/5 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[360px]"
          >
            {/* Left Content */}
            <div className="max-w-xl z-10 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full text-xs font-black text-[#00B074] shadow-xs">
                <Sparkles size={14} />
                <span>{activeBanner.badge || '⚡ Special Fresh Offer'}</span>
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {activeBanner.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                {activeBanner.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to={activeBanner.targetUrl || '/shop'}
                  className="px-6 py-3.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-lg shadow-[#00B074]/30 flex items-center gap-2"
                >
                  <span>{activeBanner.btnText || 'Explore Store'}</span>
                  <ArrowRight size={16} />
                </Link>

                <div className="flex items-center gap-2 bg-white/70 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700">
                  <Tag size={15} className="text-[#00B074]" />
                  <span>Use Coupon: <strong className="text-[#00B074]">FRESH20</strong></span>
                </div>
              </div>
            </div>

            {/* Right Image Artwork */}
            <div className="lg:w-1/2 w-full flex items-center justify-center relative">
              <div className="w-full max-w-md h-64 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60">
                <img
                  src={activeBanner.imageUrl}
                  alt={activeBanner.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                />
              </div>
            </div>

            {/* Slider Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-8 flex items-center gap-1.5 z-20">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIdx(idx)}
                    className={`h-2 rounded-full transition-all ${
                      currentBannerIdx === idx ? 'w-6 bg-[#00B074]' : 'w-2 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 2. FEATURED CATEGORIES RAIL */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Categories</h2>
              <p className="text-xs text-slate-500 font-medium">Explore hand-picked fresh groceries</p>
            </div>
            <Link to="/shop" className="text-xs font-bold text-[#00B074] hover:underline flex items-center gap-1">
              <span>View All Categories</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {CATEGORIES_DATA.map((cat, idx) => (
              <Link
                key={idx}
                to={`/shop?category=${cat.slug}`}
                className="bg-white p-4 rounded-3xl border border-slate-100 hover:border-emerald-300 hover:shadow-md transition text-center group flex flex-col items-center justify-center space-y-2"
              >
                <div 
                  style={{ backgroundColor: cat.color }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300 shadow-xs"
                >
                  {cat.icon}
                </div>
                <h3 className="text-xs font-black text-slate-900 group-hover:text-[#00B074] transition">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">{cat.count}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. BEST SELLERS & TRENDING PRODUCTS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <Flame size={14} />
                <span>Trending Now</span>
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">Best Sellers</h2>
            </div>
            <Link to="/shop" className="text-xs font-bold text-[#00B074] hover:underline flex items-center gap-1">
              <span>Explore Shop</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {bestSellers.map((product) => {
              const primaryVariant = (product.variants && product.variants[0]) || { price: product.basePrice };
              return (
                <div
                  key={product._id}
                  onClick={() => navigate(`/product/${product.slug || product._id}`)}
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-lg hover:border-emerald-200 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="w-full h-44 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden mb-3 relative">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <span className="text-4xl">🛒</span>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#00B074] text-white text-[9px] font-black rounded-full uppercase">
                        Fresh
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {product.brand || product.categoryName || 'FreshCart'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-[#00B074] transition">
                      {product.title}
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                    <div>
                      <span className="text-xs text-slate-400 line-through mr-1.5">
                        ₹{(primaryVariant.price * 1.25).toFixed(0)}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        ₹{primaryVariant.price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="w-8 h-8 rounded-xl bg-[#E8F8F0] hover:bg-[#00B074] text-[#00B074] hover:text-white flex items-center justify-center font-black transition active:scale-95 shadow-xs"
                      title="Add to Cart"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. DEALS OF THE DAY / OFFERS STRIP */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-800 via-[#00B074] to-teal-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider">
                ⚡ Flash Sale: Ends Tonight
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">Pantry Stock-Up: Save Flat ₹100</h3>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
                Use promo code <strong className="text-white underline">MEGA100</strong> on cart values above ₹999. Free delivery guaranteed on all fresh vegetables and daily dairy.
              </p>
            </div>
            <Link
              to="/shop"
              className="px-6 py-3 bg-white text-[#00B074] hover:bg-emerald-50 rounded-2xl text-xs font-black transition shrink-0 shadow-md"
            >
              Shop Deals Now →
            </Link>
          </div>
        </section>

        {/* 5. NEW ARRIVALS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-black text-[#00B074] uppercase tracking-wider">Direct From Mill</span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">New Arrivals</h2>
            </div>
            <Link to="/shop" className="text-xs font-bold text-[#00B074] hover:underline flex items-center gap-1">
              <span>See More</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {newArrivals.map((product) => {
              const primaryVariant = (product.variants && product.variants[0]) || { price: product.basePrice };
              return (
                <div
                  key={product._id}
                  onClick={() => navigate(`/product/${product.slug || product._id}`)}
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-lg hover:border-emerald-200 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-full h-44 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden mb-3 relative">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <span className="text-4xl">🌾</span>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase">
                        New
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {product.brand || 'Pure Harvest'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-[#00B074] transition">
                      {product.title}
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                    <span className="text-sm font-black text-slate-900">₹{primaryVariant.price}</span>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="w-8 h-8 rounded-xl bg-[#E8F8F0] hover:bg-[#00B074] text-[#00B074] hover:text-white flex items-center justify-center font-black transition active:scale-95 shadow-xs"
                      title="Add to Cart"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. CUSTOMER TESTIMONIALS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black text-[#00B074] uppercase tracking-wider">Trusted by 8,000+ Households</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{t.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] text-[#00B074] flex items-center justify-center font-black text-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{t.name}</h5>
                    <p className="text-[10px] text-slate-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* FreshCart Footer */}
      <FreshCartFooter />

    </div>
  );
};

export default Home;
