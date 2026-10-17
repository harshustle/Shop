import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  
  const variants = product.variants || [];
  const currentVariant = variants[0] || {
    _id: product._id,
    sku: 'SKU-DIRECT',
    price: product.basePrice || product.price || 199,
    compareAtPrice: product.compareAtPrice || Math.round((product.basePrice || 199) * 1.2),
    stockQuantity: 50
  };

  const variantId = currentVariant._id || product._id;
  const quantity = typeof getItemQuantity === 'function' ? getItemQuantity(variantId) : 0;

  const price = currentVariant.price || product.basePrice || product.price || 199;
  const comparePrice = currentVariant.compareAtPrice || product.compareAtPrice || Math.round(price * 1.2);
  const discountPercent = comparePrice > price 
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : (product.discountPercent || 15);

  const imageUrl = product.images?.[0]?.imageUrl || product.primary_image?.image_url || product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('freshcart_wishlist') || '[]');
      if (Array.isArray(saved) && saved.includes(product._id)) {
        setIsWishlisted(true);
      }
    } catch (e) {}
  }, [product._id]);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    try {
      let saved = JSON.parse(localStorage.getItem('freshcart_wishlist') || '[]');
      if (nextState) {
        if (!saved.includes(product._id)) saved.push(product._id);
      } else {
        saved = saved.filter(id => id !== product._id);
      }
      localStorage.setItem('freshcart_wishlist', JSON.stringify(saved));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (e) {}
  };

  return (
    <div className="group bg-[var(--app-card)] rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-black/[0.06] dark:border-white/[0.08] hover:border-[#635BFF]/30 hover:shadow-md transition-all flex flex-col justify-between relative">
      
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-black/[0.02] dark:bg-white/[0.04] rounded-xl sm:rounded-2xl overflow-hidden mb-2 p-2 flex items-center justify-center">
        
        {/* Yellow Discount Pill */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-[#FEEA85] text-slate-900 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-2xs">
            {discountPercent}%
          </div>
        )}

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-400 hover:text-rose-500 shadow-2xs transition flex items-center justify-center"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart 
            size={14} 
            className={isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400"} 
          />
        </button>

        {/* Image */}
        <Link to={`/product/${product.slug || product._id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product.title || product.name || 'Product'}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </Link>
      </div>

      {/* Product Info */}
      <div className="mb-2.5 px-0.5 space-y-1">
        <Link 
          to={`/product/${product.slug || product._id}`}
          className="font-bold text-[var(--app-text-primary)] text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.4rem] hover:text-[#635BFF] transition block"
        >
          {product.title || product.name || 'Item'}
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-sm sm:text-base font-extrabold text-[var(--app-text-primary)]">
            ₹{price}
          </span>
          {comparePrice > price && (
            <span className="text-xs text-slate-400 line-through font-medium">
              ₹{comparePrice}
            </span>
          )}
        </div>
      </div>

      {/* Button */}
      <div className="mt-auto">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={() => addToCart(product, currentVariant)}
            className="w-full py-2 sm:py-2.5 px-3 bg-slate-100 hover:bg-[#635BFF] hover:text-white dark:bg-white/[0.08] dark:hover:bg-[#635BFF] text-[var(--app-text-primary)] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 group/btn shadow-2xs"
          >
            <ShoppingBag size={14} className="text-slate-500 group-hover/btn:text-white transition-colors" />
            <span>Move to bag</span>
          </button>
        ) : (
          <div className="w-full py-1.5 px-2 bg-[#635BFF] text-white rounded-xl sm:rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-xs">
            <button
              type="button"
              onClick={() => removeFromCart(variantId)}
              className="p-1 hover:bg-white/20 rounded-full transition active:scale-90"
            >
              <Minus size={13} />
            </button>
            <span className="px-2 text-xs sm:text-sm font-black">{quantity}</span>
            <button
              type="button"
              onClick={() => addToCart(product, currentVariant)}
              className="p-1 hover:bg-white/20 rounded-full transition active:scale-90"
            >
              <Plus size={13} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductCard;
