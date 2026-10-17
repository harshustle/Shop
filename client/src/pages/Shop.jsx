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
  { slug: 'all', name: 'All Items' },
  { slug: 'dairy', name: 'Dairy & Bread' },
  { slug: 'vegetables', name: 'Vegetables' },
  { slug: 'fruits', name: 'Fresh Fruits' },
  { slug: 'atta-rice-dal', name: 'Atta, Rice & Dal' },
  { slug: 'oil-ghee', name: 'Oils & Ghee' },
  { slug: 'snacks', name: 'Snacks & Biscuits' },
  { slug: 'drinks', name: 'Cold Drinks & Tea' },
  { slug: 'cleaning', name: 'Cleaning & Household' }
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
        const catStr = ((p.categorySlug || '') + ' ' + (p.categoryName || '') + ' ' + (p.title || '') + ' ' + (p.brand || '')).toLowerCase();
        
        if (selectedCategory === 'dairy' || selectedCategory === 'dairy-breakfast' || selectedCategory === 'dairy-bread') {
          if (!catStr.includes('dairy') && !catStr.includes('milk') && !catStr.includes('butter') && !catStr.includes('dahi') && !catStr.includes('bread') && !catStr.includes('curd') && !catStr.includes('paneer') && !catStr.includes('cheese') && !catStr.includes('egg')) return false;
        } else if (selectedCategory === 'staples-and-grains' || selectedCategory === 'atta-rice-dal' || selectedCategory === 'atta') {
          if (!catStr.includes('atta') && !catStr.includes('flour') && !catStr.includes('rice') && !catStr.includes('dal') && !catStr.includes('grain') && !catStr.includes('staple') && !catStr.includes('wheat') && !catStr.includes('chana') && !catStr.includes('rajma')) return false;
        } else if (selectedCategory === 'edible-oils' || selectedCategory === 'oil-ghee' || selectedCategory === 'oil') {
          if (!catStr.includes('oil') && !catStr.includes('ghee') && !catStr.includes('mustard') && !catStr.includes('sunflower')) return false;
        } else if (selectedCategory === 'packaged-foods-snacks' || selectedCategory === 'snacks') {
          if (!catStr.includes('snack') && !catStr.includes('noodle') && !catStr.includes('maggi') && !catStr.includes('chip') && !catStr.includes('lays') && !catStr.includes('bhujia') && !catStr.includes('namkeen') && !catStr.includes('biscuit') && !catStr.includes('cookie') && !catStr.includes('chocolate') && !catStr.includes('silk') && !catStr.includes('kurkure') && !catStr.includes('kitkat') && !catStr.includes('parle')) return false;
        } else if (selectedCategory === 'organic-vegetables' || selectedCategory === 'vegetables' || selectedCategory === 'veggies') {
          if (!catStr.includes('vegetable') && !catStr.includes('onion') && !catStr.includes('pyaaz') && !catStr.includes('potato') && !catStr.includes('aloo') && !catStr.includes('tomato') && !catStr.includes('tamatar') && !catStr.includes('chilli') && !catStr.includes('garlic') && !catStr.includes('ginger') && !catStr.includes('lemon') && !catStr.includes('nimbu') && !catStr.includes('coriander') && !catStr.includes('dhaniya') && !catStr.includes('gobhi')) return false;
        } else if (selectedCategory === 'fresh-fruits' || selectedCategory === 'fruits') {
          if (!catStr.includes('fruit') && !catStr.includes('apple') && !catStr.includes('banana') && !catStr.includes('orange') && !catStr.includes('pomegranate') && !catStr.includes('anar') && !catStr.includes('mango') && !catStr.includes('santr')) return false;
        } else if (selectedCategory === 'cold-drinks-juices' || selectedCategory === 'drinks') {
          if (!catStr.includes('drink') && !catStr.includes('juice') && !catStr.includes('coke') && !catStr.includes('cola') && !catStr.includes('thums') && !catStr.includes('tea') && !catStr.includes('coffee') && !catStr.includes('nescafe') && !catStr.includes('sprite') && !catStr.includes('red bull') && !catStr.includes('frooti')) return false;
        } else if (selectedCategory === 'cleaning-household' || selectedCategory === 'cleaning') {
          if (!catStr.includes('clean') && !catStr.includes('surf') && !catStr.includes('detergent') && !catStr.includes('vim') && !catStr.includes('dettol') && !catStr.includes('handwash') && !catStr.includes('harpic') && !catStr.includes('colin') && !catStr.includes('toothpaste') && !catStr.includes('colgate') && !catStr.includes('whisper') && !catStr.includes('wash') && !catStr.includes('ariel')) return false;
        } else {
          const catSlug = (p.categorySlug || p.categoryName || '').toLowerCase().replace(/\s+/g, '-');
          if (!catSlug.includes(selectedCategory.toLowerCase())) return false;
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
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-[var(--app-text-primary)]">
              All Items ({filteredProducts.length})
            </h1>
          </div>

          {/* CUSTOM SLEEK SORT DROPDOWN */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] border border-black/[0.05] dark:border-white/[0.08] text-xs font-bold text-[var(--app-text-primary)] transition cursor-pointer"
            >
              <ArrowUpDown size={13} className="text-[#635BFF] dark:text-[#7C71FF]" />
              <span>{activeSortLabel}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 opacity-60 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Floating Menu */}
            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--app-card)] rounded-2xl shadow-xl border border-black/[0.06] dark:border-white/[0.1] p-1.5 z-50">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSortBy(option.id);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition ${
                      sortBy === option.id 
                        ? 'text-[#635BFF] dark:text-[#7C71FF] bg-[#635BFF]/10 font-bold' 
                        : 'text-[var(--app-text-primary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.id && <Check size={14} className="stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-3 pb-2 w-full">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSearchParams(cat.slug === 'all' ? {} : { category: cat.slug });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === cat.slug
                  ? 'bg-[#635BFF] text-white shadow-xs'
                  : 'bg-[var(--app-card)] text-[var(--app-text-muted)] border border-black/[0.05] dark:border-white/[0.07] hover:border-[#635BFF]/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 flex-1 w-full">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-56 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[var(--app-card)] rounded-2xl border border-black/[0.05] dark:border-white/[0.07] p-6 max-w-sm mx-auto">
            <span className="text-3xl block mb-2">🔍</span>
            <h3 className="text-sm font-bold text-[var(--app-text-primary)]">No products found</h3>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">Try another category or clear search.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchKeyword('');
                setSearchParams({});
              }}
              className="mt-4 px-4 py-2 rounded-full bg-[#635BFF] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
