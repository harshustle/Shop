import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ChevronDown, 
  Check, 
  ArrowUpDown
} from 'lucide-react';
import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import ProductCard from '../components/ProductCard';
import LocationPickerModal from '../components/LocationPickerModal';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const CATEGORY_FILTERS = [
  { slug: 'all', name: 'All' },
  { slug: 'dairy-breakfast', name: 'Dairy' },
  { slug: 'staples-and-grains', name: 'Atta & Flours' },
  { slug: 'edible-oils', name: 'Oils & Ghee' },
  { slug: 'packaged-foods-snacks', name: 'Snacks' },
  { slug: 'organic-vegetables', name: 'Veggies' },
  { slug: 'fresh-fruits', name: 'Fruits' }
];

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest Arrivals' }
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLocationModalOpen, setIsLocationModalOpen } = useCart();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const categoryParam = searchParams.get('category') || 'all';
  const queryParam = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('featured');
  const [searchKeyword, setSearchKeyword] = useState(queryParam);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Cart & Checkout Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    if (queryParam) setSearchKeyword(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/catalog/search?limit=100`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.items || data.products || []);
        }
      } catch (err) {
        console.warn('Catalog fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchKeyword) {
        const q = searchKeyword.toLowerCase();
        const match = (p.title && p.title.toLowerCase().includes(q)) ||
                      (p.brand && p.brand.toLowerCase().includes(q)) ||
                      (p.categoryName && p.categoryName.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (selectedCategory !== 'all') {
        const catSlug = (p.categorySlug || p.categoryName || '').toLowerCase().replace(/\s+/g, '-');
        if (!catSlug.includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const priceA = Number((a.variants && a.variants[0]?.price) || a.basePrice || 0);
      const priceB = Number((b.variants && b.variants[0]?.price) || b.basePrice || 0);

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
  }, [products, searchKeyword, selectedCategory, sortBy]);

  const activeSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Featured';

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text-primary)] flex flex-col font-sans transition-colors duration-200">
      
      {/* Sleek Navbar */}
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Catalog Header Bar */}
      <div className="bg-[var(--app-card)] border-b border-black/[0.04] dark:border-white/[0.06] py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xs font-black tracking-tight text-[var(--app-text-primary)]">
              All Items ({filteredProducts.length})
            </h1>
          </div>

          {/* CUSTOM SLEEK SORT DROPDOWN */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] border border-black/[0.05] dark:border-white/[0.08] text-[10px] font-bold text-[var(--app-text-primary)] transition cursor-pointer"
            >
              <ArrowUpDown size={11} className="text-[#635BFF] dark:text-[#7C71FF]" />
              <span>{activeSortLabel}</span>
              <ChevronDown size={11} className={`transition-transform duration-200 opacity-60 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Floating Menu */}
            {isSortOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-[var(--app-card)] rounded-xl shadow-xl border border-black/[0.06] dark:border-white/[0.1] py-1 z-50">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSortBy(option.id);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-medium flex items-center justify-between transition ${
                      sortBy === option.id 
                        ? 'text-[#635BFF] dark:text-[#7C71FF] bg-[#635BFF]/5 font-bold' 
                        : 'text-[var(--app-text-primary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.id && <Check size={12} className="stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 pb-1 w-full">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSearchParams(cat.slug === 'all' ? {} : { category: cat.slug });
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition ${
                selectedCategory === cat.slug
                  ? 'bg-[#635BFF] text-white shadow-xs'
                  : 'bg-[var(--app-card)] text-[var(--app-text-muted)] border border-black/[0.04] dark:border-white/[0.06]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Compact mobile grid */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex-1 w-full">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-44 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[var(--app-card)] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] p-6 max-w-sm mx-auto">
            <span className="text-2xl block mb-1">🔍</span>
            <h3 className="text-xs font-bold text-[var(--app-text-primary)]">No products found</h3>
            <p className="text-[10px] text-[var(--app-text-muted)] mt-0.5">Try another category or clear search.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchKeyword('');
                setSearchParams({});
              }}
              className="mt-3 px-3 py-1 rounded-full bg-[#635BFF] text-white text-[10px] font-bold"
            >
              Reset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <FreshCartFooter />

      {/* Drawers */}
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

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

    </div>
  );
};

export default Shop;
