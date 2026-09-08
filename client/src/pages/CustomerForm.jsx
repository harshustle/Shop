import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, ShieldCheck, Clock, TrendingUp, ShoppingBag } from 'lucide-react';
import QuickHeader from '../components/QuickHeader';
import CategoryRail from '../components/CategoryRail';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

// Fallback curated products for instant offline/rich display
const FALLBACK_PRODUCTS = [
  {
    _id: 'prod_1',
    title: 'Vintage Washed Heavyweight Cotton Tee',
    brand: 'Heritage Studio',
    basePrice: 799,
    compareAtPrice: 999,
    categoryName: 'Apparel & Fashion',
    category: 'apparel-fashion',
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' }],
    variants: [
      { _id: 'v1_1', sku: 'TEE-BLK-M', price: 799, compareAtPrice: 999, stockQuantity: 45, attributes: { color: 'Black', size: 'M' } },
      { _id: 'v1_2', sku: 'TEE-NVY-L', price: 849, compareAtPrice: 999, stockQuantity: 20, attributes: { color: 'Navy Blue', size: 'L' } }
    ]
  },
  {
    _id: 'prod_2',
    title: 'Classic Relaxed Fit Linen Button-Down Shirt',
    brand: 'Loom & Thread',
    basePrice: 1299,
    compareAtPrice: 1699,
    categoryName: 'Apparel & Fashion',
    category: 'apparel-fashion',
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80' }],
    variants: [
      { _id: 'v2_1', sku: 'SHIRT-WHT-L', price: 1299, compareAtPrice: 1699, stockQuantity: 30, attributes: { color: 'White', size: 'L' } },
      { _id: 'v2_2', sku: 'SHIRT-OLV-M', price: 1299, compareAtPrice: 1699, stockQuantity: 15, attributes: { color: 'Olive', size: 'M' } }
    ]
  },
  {
    _id: 'prod_3',
    title: 'True Wireless Noise-Cancelling Earbuds Pro',
    brand: 'SonicAura',
    basePrice: 1899,
    compareAtPrice: 2499,
    categoryName: 'Electronics & Gadgets',
    category: 'electronics-gadgets',
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80' }],
    variants: [
      { _id: 'v3_1', sku: 'EARBUD-BLK', price: 1899, compareAtPrice: 2499, stockQuantity: 25, attributes: { color: 'Matte Black' } }
    ]
  },
  {
    _id: 'prod_4',
    title: 'Smart Fitness Tracker Band with AMOLED Display',
    brand: 'PulseFit',
    basePrice: 1499,
    compareAtPrice: 2199,
    categoryName: 'Electronics & Gadgets',
    category: 'electronics-gadgets',
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80' }],
    variants: [
      { _id: 'v4_1', sku: 'BAND-OBSIDIAN', price: 1499, compareAtPrice: 2199, stockQuantity: 40, attributes: { color: 'Obsidian' } }
    ]
  },
  {
    _id: 'prod_5',
    title: 'Ceramic Pour-Over Coffee Dripper Set with Carafe',
    brand: 'Nordic Brew',
    basePrice: 899,
    compareAtPrice: 1199,
    categoryName: 'Home & Living',
    category: 'home-living',
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' }],
    variants: [
      { _id: 'v5_1', sku: 'BREW-CRM', price: 899, compareAtPrice: 1199, stockQuantity: 18, attributes: { color: 'Matte Cream' } }
    ]
  },
  {
    _id: 'prod_6',
    title: 'Aromatic Soy Wax Scented Candle - French Lavender',
    brand: 'AromaBotanica',
    basePrice: 499,
    compareAtPrice: 699,
    categoryName: 'Home & Living',
    category: 'home-living',
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80' }],
    variants: [
      { _id: 'v6_1', sku: 'CNDL-LAV', price: 499, compareAtPrice: 699, stockQuantity: 50, attributes: { scent: 'Lavender' } }
    ]
  }
];

const CustomerForm = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { searchQuery, selectedCategory, itemCount, grandTotal, setIsCartOpen } = useCart();

  useEffect(() => {
    fetchCatalog();
  }, [searchQuery, selectedCategory]);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      let url = `${API_URL}/api/catalog/search?q=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory && selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setProducts(data.items);
        } else if (!searchQuery && selectedCategory === 'all') {
          setProducts(FALLBACK_PRODUCTS);
        } else {
          setProducts([]);
        }
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch (e) {
      console.warn('Using curated fallback catalog:', e.message);
      // Filter fallback products locally if offline
      let filtered = [...FALLBACK_PRODUCTS];
      if (searchQuery) {
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (selectedCategory && selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }
      setProducts(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col">
      {/* Quick Store Top Bar */}
      <QuickHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Promotional Hero Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Banner 1 */}
          <div className="bg-gradient-to-r from-amber-400 to-amber-300 rounded-3xl p-5 text-gray-900 flex items-center justify-between shadow-xs relative overflow-hidden">
            <div>
              <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                ⚡ 10 MINUTE DELIVERY
              </span>
              <h3 className="text-xl font-black mt-2 leading-tight">Instant Essentials & Fashion</h3>
              <p className="text-xs font-semibold text-gray-800 mt-1">Over 5,000+ items at best prices</p>
            </div>
            <div className="text-5xl shrink-0 opacity-90">🛍️</div>
          </div>

          {/* Banner 2 */}
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-3xl p-5 text-white flex items-center justify-between shadow-xs relative overflow-hidden">
            <div>
              <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                FREE DELIVERY
              </span>
              <h3 className="text-xl font-black mt-2 leading-tight">Orders Above ₹499</h3>
              <p className="text-xs font-medium text-emerald-100 mt-1">Guaranteed freshness & quality</p>
            </div>
            <div className="text-5xl shrink-0 opacity-90">🛵</div>
          </div>

          {/* Banner 3 */}
          <div className="hidden md:flex bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 text-white items-center justify-between shadow-xs relative overflow-hidden">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-400 text-black text-[10px] font-black rounded-full uppercase tracking-wider">
                MEGA SAVINGS
              </span>
              <h3 className="text-xl font-black mt-2 leading-tight">Up to 40% OFF</h3>
              <p className="text-xs font-medium text-gray-300 mt-1">Trending wardrobe & gadgets</p>
            </div>
            <div className="text-5xl shrink-0 opacity-90">✨</div>
          </div>
        </div>

        {/* Category Rails */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-extrabold text-gray-900">Browse Categories</h2>
            <span className="text-xs font-bold text-[#0C831F] cursor-pointer hover:underline">
              See All
            </span>
          </div>
          <CategoryRail />
        </div>

        {/* Product Catalog Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Handpicked for You'}
              </h2>
              <span className="text-xs font-bold text-gray-400">
                ({products.length} {products.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <Zap size={14} className="text-[#0C831F]" />
              <span>Instant Dispatch</span>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse space-y-3">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 my-6">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-extrabold text-base text-gray-900">No matching items found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Try searching with another keyword or explore our top categories above.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Floating Sticky Bottom Cart Pill (Mobile/Tablet) */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 bg-[#0C831F] text-white rounded-2xl font-black text-sm flex items-center justify-between shadow-xl active:scale-98 animate-in slide-in-from-bottom"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'} • ₹{grandTotal}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-3 py-1 rounded-lg">
              View Cart →
            </span>
          </button>
        </div>
      )}

      {/* Slide-Over Quick Cart Drawer */}
      <CartDrawer />

      {/* One-Click Checkout Modal */}
      <CheckoutModal />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-12 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline">
            <span className="text-xl font-black text-slate-900">Fresh</span>
            <span className="text-xl font-black text-[#00B074]">Cart</span>
            <span className="w-2 h-2 rounded-full bg-[#00B074] ml-0.5"></span>
            <span className="text-[11px] text-gray-400 font-semibold ml-2">Fresh Groceries & Essentials</span>
          </div>
          <p>© 2026 FreshCart. Engineered for High-Speed Quick Commerce.</p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerForm;