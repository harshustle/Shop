import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight,
  ChevronRight, 
  Clock3,
  MapPin,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import ProductCard from '../components/ProductCard';
import LocationPickerModal from '../components/LocationPickerModal';
import StorefrontPageSkeleton from '../components/StorefrontPageSkeleton';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';
import { CATALOG_CATEGORIES } from '../catalogCategories';

const Home = () => {
  const { 
    isLocationModalOpen, 
    setIsLocationModalOpen, 
    selectedLocation,
    isCartOpen,
    setIsCartOpen
  } = useCart();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart & Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Automatically open Basti map modal on first homepage visit
  useEffect(() => {
    const hasSeenMap = sessionStorage.getItem('fresh_basti_map_opened');
    if (!hasSeenMap) {
      setIsLocationModalOpen(true);
      sessionStorage.setItem('fresh_basti_map_opened', 'true');
    }
  }, [setIsLocationModalOpen]);

  // Fetch real Blinkit grocery items
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${API_URL}/api/catalog/search?limit=100`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.items || data.products || []);
        }
      } catch (err) {
        console.warn('Catalog fetch notice:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const categorySections = useMemo(() => CATALOG_CATEGORIES.map((category) => {
    const acceptedSlugs = category.slug === 'masalas-spices'
      ? ['masalas-spices', 'oil-ghee']
      : [category.slug];
    const items = products.filter((product) => acceptedSlugs.includes(product.categorySlug));
    return { ...category, items };
  }).filter((category) => category.items.length > 0), [products]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text-primary)] flex flex-col font-sans transition-colors duration-200">
      
      {/* Sleek Minimal Navbar */}
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Content Container */}
      <main className="storefront-main flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-4 space-y-6">

        <section className="storefront-hero" aria-labelledby="storefront-hero-title">
          <div className="storefront-hero__main">
            <span className="storefront-eyebrow">Basti's quick grocery store</span>
            <h1 id="storefront-hero-title">Daily needs,<br />at your door.</h1>
            <p>Fresh groceries, household essentials and local favourites delivered without the long wait.</p>
            <div className="storefront-hero__actions">
              <Link to="/shop" className="storefront-primary-action">
                <ShoppingBag size={17} /> Shop groceries <ArrowRight size={17} />
              </Link>
              <button type="button" onClick={() => setIsLocationModalOpen(true)} className="storefront-secondary-action">
                <MapPin size={16} /> Change location
              </button>
            </div>
          </div>

          <div className="storefront-hero__promise">
            <Clock3 size={24} />
            <span>Delivery promise</span>
            <strong>12 min</strong>
            <small>across active Basti zones</small>
          </div>

          <div className="storefront-hero__trust">
            <ShieldCheck size={22} />
            <div>
              <strong>Quality checked</strong>
              <span>Fresh stock, secure payments</span>
            </div>
          </div>
        </section>

        {/* Location Header Banner */}
        <div className="storefront-location-bar bg-[var(--app-card)] rounded-2xl px-4 py-3 border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-[var(--app-text-muted)] font-black uppercase tracking-wider">Delivering To</p>
              <p className="text-xs sm:text-sm font-black text-[var(--app-text-primary)] leading-tight mt-0.5 truncate max-w-[210px] sm:max-w-none">
                {selectedLocation?.title || 'Gandhi Nagar, Basti, UP'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="text-xs sm:text-sm font-bold text-[#635BFF] dark:text-[#7C71FF] px-3 py-1.5 rounded-full bg-[#635BFF]/10 hover:bg-[#635BFF]/15 transition"
          >
            Change
          </button>
        </div>

        {/* Categories Section */}
        <section className="storefront-category-section space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--app-text-muted)]">
              Categories
            </h2>
            <Link to="/shop" className="text-xs sm:text-sm font-bold text-[#635BFF] flex items-center gap-1 hover:underline">
              <span>All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="storefront-category-grid grid grid-cols-6 gap-2 sm:gap-3">
            {CATALOG_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="bg-[var(--app-card)] p-2 sm:p-3 rounded-2xl border border-black/[0.05] dark:border-white/[0.07] hover:border-[#635BFF]/30 hover:shadow-xs transition text-center flex flex-col items-center justify-center gap-1.5 group"
              >
                <div 
                  style={{ backgroundColor: cat.color }}
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-2xl group-hover:scale-105 transition duration-200 shadow-2xs"
                >
                  {cat.icon}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[var(--app-text-primary)] group-hover:text-[#635BFF] transition leading-tight truncate w-full text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {isLoading ? (
          <StorefrontPageSkeleton />
        ) : categorySections.map((category) => (
          <section className="storefront-product-section space-y-3" key={category.slug}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[var(--app-text-primary)] tracking-tight">
                  {category.name}
                </h2>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">{category.items.length} products available</p>
              </div>
              <Link to={`/shop?category=${category.slug}`} className="text-xs sm:text-sm font-bold text-[#635BFF] flex items-center gap-1 hover:underline">
                <span>See all</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="storefront-product-rail">
              {category.items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        ))}

      </main>

      {/* Small Minimal Footer */}
      {!isLoading && <FreshCartFooter />}

      {/* Cart Drawer & Checkout Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Location Picker Modal (Defaults to Basti) */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

    </div>
  );
};

export default Home;
