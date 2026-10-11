import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  MapPin
} from 'lucide-react';
import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import ProductCard from '../components/ProductCard';
import LocationPickerModal from '../components/LocationPickerModal';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const CATEGORIES = [
  { slug: 'dairy-breakfast', name: 'Dairy', icon: '🥛', color: '#EDE9FE' },
  { slug: 'staples-and-grains', name: 'Atta & Rice', icon: '🌾', color: '#FEF3C7' },
  { slug: 'edible-oils', name: 'Oils & Ghee', icon: '🛢️', color: '#E0F2FE' },
  { slug: 'packaged-foods-snacks', name: 'Snacks', icon: '☕', color: '#FFEDD5' },
  { slug: 'organic-vegetables', name: 'Vegetables', icon: '🥦', color: '#E8F8F0' },
  { slug: 'fresh-fruits', name: 'Fruits', icon: '🍎', color: '#FEE2E2' }
];

const Home = () => {
  const { 
    isLocationModalOpen, 
    setIsLocationModalOpen, 
    selectedLocation 
  } = useCart();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart & Checkout
  const [isCartOpen, setIsCartOpen] = useState(false);
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
        const res = await fetch(`${API_URL}/api/catalog/search?limit=36`);
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

  const dailyPicks = products.slice(0, 8);
  const pantryStaples = products.slice(8, 20);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text-primary)] flex flex-col font-sans transition-colors duration-200">
      
      {/* Sleek Minimal Navbar */}
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 space-y-4">

        {/* Minimal Location Header Banner */}
        <div className="bg-[var(--app-card)] rounded-xl px-3 py-2 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
              <MapPin size={12} />
            </div>
            <div>
              <p className="text-[9px] text-[var(--app-text-muted)] font-semibold uppercase leading-none">Delivering To</p>
              <p className="text-[11px] font-bold text-[var(--app-text-primary)] leading-tight mt-0.5 truncate max-w-[200px] sm:max-w-none">
                {selectedLocation?.title || 'Gandhi Nagar, Basti, UP'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="text-[10px] font-bold text-[#635BFF] dark:text-[#7C71FF] hover:underline"
          >
            Change
          </button>
        </div>

        {/* Categories Rail */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
              Categories
            </h2>
            <Link to="/shop" className="text-[10px] font-bold text-[#635BFF] flex items-center gap-0.5 hover:underline">
              <span>All</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {CATEGORIES.map((cat, idx) => (
              <Link
                key={idx}
                to={`/shop?category=${cat.slug}`}
                className="bg-[var(--app-card)] p-1.5 sm:p-2 rounded-xl border border-black/[0.04] dark:border-white/[0.06] hover:border-[#635BFF]/30 transition text-center flex flex-col items-center justify-center gap-1 group"
              >
                <div 
                  style={{ backgroundColor: cat.color }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-base group-hover:scale-105 transition duration-200"
                >
                  {cat.icon}
                </div>
                <span className="text-[10px] font-semibold text-[var(--app-text-primary)] group-hover:text-[#635BFF] transition leading-tight truncate w-full text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Daily Essentials */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-[var(--app-text-primary)] tracking-tight">
                Daily Essentials
              </h2>
              <p className="text-[10px] text-[var(--app-text-muted)]">Dairy, flours & staples</p>
            </div>
            <Link to="/shop" className="text-[10px] font-bold text-[#635BFF] flex items-center gap-0.5 hover:underline">
              <span>See More</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {dailyPicks.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Pantry Staples */}
        {pantryStaples.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-[var(--app-text-primary)] tracking-tight">
                  Pantry Staples
                </h2>
                <p className="text-[10px] text-[var(--app-text-muted)]">Oils, rice & packaged goods</p>
              </div>
              <Link to="/shop" className="text-[10px] font-bold text-[#635BFF] flex items-center gap-0.5 hover:underline">
                <span>Explore</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {pantryStaples.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Small Minimal Footer */}
      <FreshCartFooter />

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
