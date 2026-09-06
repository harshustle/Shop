import React, { useState } from 'react';
import { Clock, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  
  // Select first variant by default
  const variants = product.variants || [];
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const currentVariant = variants[selectedVariantIndex] || {
    _id: product._id,
    sku: 'SKU-DIRECT',
    price: product.basePrice || product.price || 299,
    compareAtPrice: product.compareAtPrice || Math.round((product.basePrice || 299) * 1.25),
    stockQuantity: 50,
    attributes: {}
  };

  const variantId = currentVariant._id || currentVariant.variant_id || currentVariant.sku || product._id;
  const quantity = getItemQuantity(variantId);

  const price = currentVariant.price || product.basePrice || 299;
  const comparePrice = currentVariant.compareAtPrice || Math.round(price * 1.25);
  const discountPercent = comparePrice > price 
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : 0;

  const imageUrl = product.images?.[0]?.imageUrl || product.primary_image?.image_url || product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80';

  return (
    <div className="group bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative">
      
      {/* Top Image & 8 MINS delivery badge */}
      <div>
        <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
          {/* 8 MINS Badge */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-extrabold text-emerald-800 shadow-xs border border-emerald-100">
            <Clock size={11} className="text-emerald-600" />
            <span>8 MINS</span>
          </div>

          {/* Discount Tag */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2 z-10 bg-[#0C831F] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md tracking-tight shadow-xs">
              {discountPercent}% OFF
            </div>
          )}

          {/* Product Image */}
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        {/* Variant selector chips if multiple variants */}
        {variants.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {variants.slice(0, 3).map((v, idx) => {
              const label = v.attributes?.size || v.attributes?.color || v.sku;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedVariantIndex(idx)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                    selectedVariantIndex === idx
                      ? 'border-[#0C831F] bg-emerald-50 text-[#0C831F]'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Title */}
        <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-emerald-900 transition">
          {product.title}
        </h4>

        {/* Brand / Category subline */}
        <p className="text-xs text-gray-400 font-medium mb-3">
          {product.brand || product.categoryName || 'Authentic Quality'}
        </p>
      </div>

      {/* Bottom Pricing & ADD Button */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-gray-900">₹{price}</span>
            {comparePrice > price && (
              <span className="text-xs text-gray-400 line-through">₹{comparePrice}</span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Instant Stock</span>
        </div>

        {/* Blinkit ADD / Stepper Button */}
        <div>
          {quantity === 0 ? (
            <button
              onClick={() => addToCart(product, currentVariant)}
              className="px-5 py-1.5 bg-emerald-50 text-[#0C831F] border border-[#0C831F] hover:bg-[#0C831F] hover:text-white rounded-lg font-black text-xs transition duration-200 shadow-xs active:scale-95"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-[#0C831F] text-white rounded-lg shadow-sm font-extrabold text-xs overflow-hidden">
              <button
                onClick={() => removeFromCart(variantId)}
                className="px-2.5 py-1.5 hover:bg-[#0A6E1A] transition active:scale-90"
              >
                <Minus size={13} />
              </button>
              <span className="px-2 py-1 min-w-[20px] text-center font-black">
                {quantity}
              </span>
              <button
                onClick={() => addToCart(product, currentVariant)}
                className="px-2.5 py-1.5 hover:bg-[#0A6E1A] transition active:scale-90"
              >
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
