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

  const imageUrl = product.images?.[0]?.imageUrl || product.primary_image?.image_url || product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80';

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
    <div className="group bg-[var(--app-card)] rounded-2xl p-2 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.08] transition-all flex flex-col justify-between relative">
      
      {/* Product Image: Compact mobile aspect */}
      <div className="relative w-full aspect-square max-h-32 bg-black/[0.02] dark:bg-white/[0.04] rounded-xl overflow-hidden mb-1.5 p-1.5 flex items-center justify-center">
        
        {/* Yellow Discount Pill */}
        {discountPercent > 0 && (
          <div className="absolute top-1.5 left-1.5 z-10 bg-[#FEEA85] text-slate-900 text-[8px] font-black px-1 py-0.2 rounded-full">
            {discountPercent}%
          </div>
        )}

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-rose-500 transition flex items-center justify-center"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart 
            size={10} 
            className={isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400"} 
          />
        </button>

        {/* Image */}
        <Link to={`/product/${product.slug || product._id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product.title || product.name || 'Product'}
            className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80';
            }}
          />
        </Link>
      </div>

      {/* Product Info: Small text */}
      <div className="mb-1.5 px-0.5 space-y-0.5">
        <Link 
          to={`/product/${product.slug || product._id}`}
          className="font-semibold text-[var(--app-text-primary)] text-[11px] leading-tight line-clamp-1 hover:text-[#635BFF] transition block"
        >
          {product.title || product.name || 'Item'}
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-[var(--app-text-primary)]">
            ₹{price}
          </span>
          {comparePrice > price && (
            <span className="text-[9px] text-slate-400 line-through">
              ₹{comparePrice}
            </span>
          )}
        </div>
      </div>

      {/* Button: Minimal pill button */}
      <div className="mt-auto">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={() => addToCart(product, currentVariant)}
            className="w-full py-1.5 px-2 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#635BFF] hover:text-white text-[var(--app-text-primary)] rounded-full text-[10px] font-semibold transition flex items-center justify-center gap-1 active:scale-95 group/btn"
          >
            <ShoppingBag size={11} className="text-slate-500 group-hover/btn:text-white" />
            <span>Move to bag</span>
          </button>
        ) : (
          <div className="w-full py-1 px-2 bg-[#635BFF] text-white rounded-full flex items-center justify-between text-[11px] font-bold">
            <button
              type="button"
              onClick={() => removeFromCart(variantId)}
              className="p-0.5 hover:bg-white/20 rounded-full transition active:scale-90"
            >
              <Minus size={10} />
            </button>
            <span className="px-1 text-[10px]">{quantity}</span>
            <button
              type="button"
              onClick={() => addToCart(product, currentVariant)}
              className="p-0.5 hover:bg-white/20 rounded-full transition active:scale-90"
            >
              <Plus size={10} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductCard;
