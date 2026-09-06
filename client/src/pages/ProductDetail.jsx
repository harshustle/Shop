import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Clock, 
  Truck, 
  Check, 
  Heart, 
  Share2, 
  Minus, 
  Plus, 
  ChevronRight,
  MessageSquarePlus,
  Send,
  Loader2
} from 'lucide-react';
import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'reviews' | 'specs'
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reviews state
  const [reviewsData, setReviewsData] = useState({ totalReviews: 0, averageRating: 4.8, reviews: [] });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');

  // Cart & Checkout
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/catalog/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }

          // Fetch reviews
          const reviewRes = await fetch(`${API_URL}/api/reviews/product/${data._id}`);
          if (reviewRes.ok) {
            const rData = await reviewRes.json();
            setReviewsData(rData);
          }

          // Fetch related
          const relRes = await fetch(`${API_URL}/api/catalog/search?category=${encodeURIComponent(data.categoryName || '')}&limit=4`);
          if (relRes.ok) {
            const relData = await relRes.json();
            const relItems = relData.items || relData.products || [];
            setRelatedProducts(relItems.filter(p => p._id !== data._id));
          }
        }
      } catch (err) {
        console.warn('Product fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    addToCart(product, selectedVariant, quantity);
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;
    addToCart(product, selectedVariant, quantity);
    setIsCheckoutOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please sign in to your account to leave a verified review.');
      navigate('/login');
      return;
    }

    setIsSubmittingReview(true);
    setReviewNotice('');

    try {
      const res = await fetch(`${API_URL}/api/reviews/product/${product._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewNotice('Your review has been successfully published!');
        setShowReviewModal(false);
        setReviewTitle('');
        setReviewComment('');
        // Refresh reviews
        const rRes = await fetch(`${API_URL}/api/reviews/product/${product._id}`);
        if (rRes.ok) setReviewsData(await rRes.json());
      } else {
        setReviewNotice(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setReviewNotice('Server error while submitting review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#00B074] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading Product Specifications...</p>
          </div>
        </div>
        <FreshCartFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-8 rounded-3xl text-center max-w-md border border-slate-100 shadow-sm">
            <p className="text-4xl mb-3">🛍️</p>
            <h3 className="text-base font-black text-slate-900">Product Not Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">The item you are searching for might be out of stock or discontinued.</p>
            <Link to="/shop" className="px-5 py-2.5 bg-[#00B074] text-white rounded-2xl text-xs font-black">
              Return to Catalog
            </Link>
          </div>
        </div>
        <FreshCartFooter />
      </div>
    );
  }

  const galleryImages = (product.images && product.images.length > 0)
    ? product.images
    : [{ imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80' }];

  const currentPrice = Number(selectedVariant?.price || product.basePrice || 0);
  const comparePrice = Number(selectedVariant?.compareAtPrice || currentPrice * 1.25);
  const discountPercent = Math.round(((comparePrice - currentPrice) / comparePrice) * 100);
  const stockQty = selectedVariant?.stockQuantity ?? 50;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-100 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight size={13} />
          <Link to="/shop" className="hover:text-slate-800">Shop</Link>
          <ChevronRight size={13} />
          <span className="text-slate-800 font-bold truncate max-w-xs">{product.title}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        
        {/* TOP SECTION: GALLERY + DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-8 rounded-3xl border border-slate-100 shadow-xs">
          
          {/* LEFT: Multi-Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="w-full h-96 sm:h-[460px] rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 relative group">
              <img
                src={galleryImages[selectedImageIdx]?.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              {discountPercent > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white text-xs font-black rounded-full uppercase shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnails list */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                      selectedImageIdx === idx ? 'border-[#00B074] shadow-md' : 'border-slate-100 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information & Purchase CTAs */}
          <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#00B074] bg-[#E8F8F0] px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.brand || 'FreshCart Certified'}
                </span>
                <span className="text-xs text-slate-400 font-medium">SKU: {selectedVariant?.sku || 'FC-DIRECT'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                {product.title}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.round(reviewsData.averageRating) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">{reviewsData.averageRating} out of 5</span>
                <span className="text-xs text-slate-400 font-medium">({reviewsData.totalReviews} customer reviews)</span>
              </div>

              {/* Price Block */}
              <div className="flex items-baseline gap-3 mt-4 pt-4 border-t border-slate-100">
                <span className="text-3xl font-black text-slate-900">₹{currentPrice.toFixed(0)}</span>
                {comparePrice > currentPrice && (
                  <span className="text-base text-slate-400 line-through">₹{comparePrice.toFixed(0)}</span>
                )}
                <span className="text-xs font-bold text-[#00B074] bg-emerald-50 px-2 py-0.5 rounded-md">
                  Inclusive of all taxes
                </span>
              </div>

              {/* Variant Selector: Pack Size / Weight */}
              {product.variants && product.variants.length > 1 && (
                <div className="mt-6">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Select Pack Size / Quantity:</label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?._id === v._id;
                      const sizeLabel = v.attributes?.pack_size || v.attributes?.size || `${v.price ? `₹${v.price}` : 'Pack'}`;
                      return (
                        <button
                          key={v._id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`px-4 py-2 rounded-2xl text-xs font-bold border transition ${
                            isSelected
                              ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074] shadow-xs'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {sizeLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator */}
              <div className="mt-6 flex items-center gap-2 text-xs font-bold">
                {stockQty > 0 ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00B074] animate-pulse" />
                    <span className="text-[#00B074]">In Stock ({stockQty} units ready for immediate dispatch)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-rose-600">Currently Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity Stepper & Action Buttons */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-4">
                  {/* Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center text-xs font-black text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    disabled={stockQty <= 0}
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl font-black text-xs transition shadow-lg shadow-[#00B074]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShoppingCart size={17} />
                    <span>Add to Cart</span>
                  </button>
                </div>

                {/* Instant Buy Now CTA */}
                <button
                  type="button"
                  disabled={stockQty <= 0}
                  onClick={handleBuyNow}
                  className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap size={16} className="text-amber-400" />
                  <span>Instant 1-Click Buy Now</span>
                </button>
              </div>
            </div>

            {/* Guarantees Strip */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50">
                <Clock size={16} className="mx-auto text-[#00B074] mb-1" />
                <span className="text-[10px] font-bold text-slate-700 block">15-Min Delivery</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50">
                <ShieldCheck size={16} className="mx-auto text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 block">100% Genuine</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50">
                <RotateCcw size={16} className="mx-auto text-purple-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 block">Easy Return</span>
              </div>
            </div>

          </div>

        </div>

        {/* TABS: DESCRIPTION, SPECIFICATIONS, REVIEWS */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8">
          <div className="flex items-center gap-6 border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => setActiveTab('description')}
              className={`text-sm font-black transition pb-2 relative ${
                activeTab === 'description' ? 'text-[#00B074]' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Description & Benefits
              {activeTab === 'description' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B074] rounded-full" />}
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`text-sm font-black transition pb-2 relative ${
                activeTab === 'specs' ? 'text-[#00B074]' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Specifications & Storage
              {activeTab === 'specs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B074] rounded-full" />}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`text-sm font-black transition pb-2 relative flex items-center gap-1.5 ${
                activeTab === 'reviews' ? 'text-[#00B074]' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              <span>Customer Reviews</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                {reviewsData.totalReviews}
              </span>
              {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B074] rounded-full" />}
            </button>
          </div>

          {/* Description Content */}
          {activeTab === 'description' && (
            <div className="prose text-xs text-slate-600 leading-relaxed max-w-none space-y-3">
              <p>
                {product.description || `${product.title} is freshly sourced and certified under the FreshCart Quality Assurance charter. Our items undergo rigorous 5-step sorting to guarantee natural goodness, high nutritional retention, and superior flavor in every meal.`}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>100% natural, hygienic, and untouched by bare hands during automated packing.</li>
                <li>Sourced straight from certified agricultural mills and progressive farms.</li>
                <li>Zero chemical preservatives or synthetic additives.</li>
              </ul>
            </div>
          )}

          {/* Specs Content */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Category</span>
                <span className="font-bold text-slate-900">{product.categoryName || 'General Grocery'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Brand</span>
                <span className="font-bold text-slate-900">{product.brand || 'FreshCart Pure'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Shelf Life</span>
                <span className="font-bold text-slate-900">90 Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Origin</span>
                <span className="font-bold text-slate-900">India</span>
              </div>
            </div>
          )}

          {/* Reviews Content */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F8FDFB] p-6 rounded-3xl border border-emerald-100">
                <div>
                  <h4 className="text-base font-black text-slate-900">Customer Feedback & Ratings</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Real verified purchases from FreshCart users</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquarePlus size={15} />
                  <span>Write a Review</span>
                </button>
              </div>

              {reviewsData.reviews.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Be the first verified customer to leave a review for this product!
                </p>
              ) : (
                <div className="space-y-4 divide-y divide-slate-100">
                  {reviewsData.reviews.map((rev) => (
                    <div key={rev._id} className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                          {rev.verifiedPurchase && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-[#00B074] text-[9px] font-black rounded-full uppercase flex items-center gap-1">
                              <Check size={10} />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={13} fill="currentColor" />
                        ))}
                      </div>

                      {rev.title && <h5 className="text-xs font-bold text-slate-900">{rev.title}</h5>}
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">You Might Also Like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {relatedProducts.map((p) => (
                <Link
                  key={p._id}
                  to={`/product/${p.slug || p._id}`}
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition flex flex-col justify-between"
                >
                  <div className="w-full h-36 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden mb-2">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0].imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : '🛒'}
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{p.title}</h5>
                  <p className="text-xs font-black text-slate-900 mt-2">₹{p.basePrice}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <h3 className="text-base font-black text-slate-900 mb-1">Write a Review</h3>
            <p className="text-xs text-slate-500 mb-4">Share your experience with {product.title}</p>

            {reviewNotice && (
              <div className="p-3 mb-3 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl">
                {reviewNotice}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star size={22} fill={star <= reviewRating ? 'currentColor' : 'none'} stroke="currentColor" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Excellent freshness & taste!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Detailed Feedback *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="How was the quality, packaging, and taste?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default ProductDetail;
