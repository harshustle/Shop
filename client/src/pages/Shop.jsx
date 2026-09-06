import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  ChevronDown, 
  SlidersHorizontal, 
  Plus, 
  Star, 
  Check, 
  X, 
  ArrowUpDown,
  Tag
} from 'lucide-react';
import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const CATEGORY_FILTERS = [
  { slug: 'all', name: 'All Categories' },
  { slug: 'staples-and-grains', name: 'Staples & Grains' },
  { slug: 'edible-oils', name: 'Edible Oils & Ghee' },
  { slug: 'fresh-fruits', name: 'Fresh Fruits' },
  { slug: 'organic-vegetables', name: 'Organic Vegetables' },
  { slug: 'dairy-breakfast', name: 'Milk & Dairy' },
  { slug: 'packaged-foods-snacks', name: 'Packaged Snacks & Biscuits' }
];

const PRICE_RANGES = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-200', label: 'Under ₹200', max: 200 },
  { id: '200-500', label: '₹200 - ₹500', min: 200, max: 500 },
  { id: '500-1000', label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { id: 'over-1000', label: 'Above ₹1,000', min: 1000 }
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const categoryParam = searchParams.get('category') || 'all';
  const queryParam = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [searchKeyword, setSearchKeyword] = useState(queryParam);

  // Cart & Checkout Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    if (queryParam) setSearchKeyword(queryParam);
  }, [queryParam]);

  const [dynamicCategories, setDynamicCategories] = useState(CATEGORY_FILTERS);

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/catalog/search?limit=100`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.items || data.products || []);
          if (data.facets?.categories && data.facets.categories.length > 0) {
            setDynamicCategories([
              { slug: 'all', name: 'All Categories' },
              ...data.facets.categories.slice(0, 10).map(c => ({ slug: c.slug, name: c.name }))
            ]);
          }
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
      // 1. Search filter
      if (searchKeyword) {
        const q = searchKeyword.toLowerCase();
        const match = (p.title && p.title.toLowerCase().includes(q)) ||
                      (p.brand && p.brand.toLowerCase().includes(q)) ||
                      (p.categoryName && p.categoryName.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        const catSlug = (p.categorySlug || p.categoryName || '').toLowerCase().replace(/\s+/g, '-');
        if (!catSlug.includes(selectedCategory.toLowerCase()) && selectedCategory !== 'all') {
          return false;
        }
      }

      // 3. Price Range filter
      const price = Number((p.variants && p.variants[0]?.price) || p.basePrice || 0);
      if (selectedPriceRange === 'under-200' && price > 200) return false;
      if (selectedPriceRange === '200-500' && (price < 200 || price > 500)) return false;
      if (selectedPriceRange === '500-1000' && (price < 500 || price > 1000)) return false;
      if (selectedPriceRange === 'over-1000' && price < 1000) return false;

      // 4. In-Stock filter
      if (onlyInStock) {
        const stock = p.variants?.[0]?.stockQuantity ?? 50;
        if (stock <= 0) return false;
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
  }, [products, searchKeyword, selectedCategory, selectedPriceRange, onlyInStock, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setOnlyInStock(false);
    setSortBy('featured');
    setSearchKeyword('');
    setSearchParams({});
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
      
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Breadcrumbs & Header Bar */}
      <div className="bg-white border-b border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Home / Shop Catalog
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              All Grocery Products ({filteredProducts.length})
            </h1>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <ArrowUpDown size={13} />
              <span>Sort by:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* =================================================================== */}
          {/* SIDEBAR FILTERS                                                     */}
          {/* =================================================================== */}
          <aside className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                <SlidersHorizontal size={16} className="text-[#00B074]" />
                <span>Filters</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Filter 1: Categories */}
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Categories</h4>
              <div className="space-y-1.5">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setSearchParams(cat.slug === 'all' ? {} : { category: cat.slug });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-[#E8F8F0] text-[#00B074] font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {selectedCategory === cat.slug && <Check size={14} className="text-[#00B074]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Price Range */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Price Range</h4>
              <div className="space-y-1.5">
                {PRICE_RANGES.map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setSelectedPriceRange(pr.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                      selectedPriceRange === pr.id
                        ? 'bg-[#E8F8F0] text-[#00B074] font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{pr.label}</span>
                    {selectedPriceRange === pr.id && <Check size={14} className="text-[#00B074]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 3: In Stock Only */}
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00B074] focus:ring-[#00B074] border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800">In-Stock Items Only</span>
              </label>
            </div>

            {/* Coupon Promo Pill */}
            <div className="p-3 bg-[#E8F8F0] rounded-2xl border border-emerald-200/80 text-xs">
              <p className="font-bold text-[#00B074] flex items-center gap-1">
                <Tag size={13} />
                <span>Save 20% on all orders</span>
              </p>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">Apply code <strong>FRESH20</strong> at checkout.</p>
            </div>
          </aside>

          {/* =================================================================== */}
          {/* PRODUCT GRID                                                        */}
          {/* =================================================================== */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-[#00B074] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">Loading Fresh Catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-3xl mx-auto">
                  🔍
                </div>
                <h3 className="text-base font-black text-slate-900">No matching products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search terms or clearing your price and category filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-[#00B074] text-white rounded-2xl text-xs font-black hover:bg-[#009663] transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const primaryVariant = (product.variants && product.variants[0]) || { price: product.basePrice, stockQuantity: 50 };
                  const isOutOfStock = primaryVariant.stockQuantity <= 0;

                  return (
                    <div
                      key={product._id}
                      onClick={() => navigate(`/product/${product.slug || product._id}`)}
                      className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-lg hover:border-emerald-200 transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        {/* Thumbnail Image */}
                        <div className="w-full h-44 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden mb-3 relative">
                          {product.primary_image?.imageUrl || (product.images && product.images[0]?.imageUrl) ? (
                            <img
                              src={product.primary_image?.imageUrl || product.images[0]?.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <img
                              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          )}

                          {isOutOfStock && (
                            <span className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center text-xs font-black text-rose-600">
                              Out of Stock
                            </span>
                          )}
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
                            ₹{(primaryVariant.price * 1.2).toFixed(0)}
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            ₹{primaryVariant.price}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => handleQuickAdd(e, product)}
                          className="w-8 h-8 rounded-xl bg-[#E8F8F0] hover:bg-[#00B074] text-[#00B074] hover:text-white flex items-center justify-center font-black transition active:scale-95 shadow-xs disabled:opacity-40"
                          title="Add to Cart"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

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

      <FreshCartFooter />

    </div>
  );
};

export default Shop;
