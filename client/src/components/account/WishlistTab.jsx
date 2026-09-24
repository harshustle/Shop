import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const WishlistTab = ({ wishlistProducts = [], onRemoveItem }) => {
  const { addToCart } = useCart();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <Heart size={18} />
          </span>
          <span>My Wishlist ({wishlistProducts.length})</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Saved grocery items and daily favorites for fast re-ordering.
        </p>
      </div>

      {/* Wishlist Products */}
      {wishlistProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Tap the heart icon on any product in the store to save it here for later.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistProducts.map((p) => {
            const price = p.price || 0;
            const originalPrice = p.originalPrice || (p.discountPercent ? Math.round(price / (1 - p.discountPercent / 100)) : null);

            return (
              <div
                key={p._id}
                className="group p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                {/* Image & Badges */}
                <div className="relative aspect-square rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={p.image || p.imageUrl || 'https://placehold.co/300x300?text=FreshCart'}
                    alt={p.title || 'Product'}
                    className="w-full h-full object-contain group-hover:scale-105 transition"
                  />
                  {p.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black tracking-wider">
                      {p.discountPercent}% OFF
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(p._id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-xs"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {p.category?.name || p.unit || 'Grocery'}
                  </span>
                  <Link
                    to={`/product/${p.slug || p._id}`}
                    className="text-xs font-bold text-slate-800 hover:text-[#00B074] transition line-clamp-2 leading-snug"
                  >
                    {p.title || p.name}
                  </Link>
                </div>

                {/* Price & Add to Cart */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-sm font-black text-slate-900">₹{price}</span>
                    {originalPrice && (
                      <span className="text-[11px] text-slate-400 line-through ml-1.5 font-medium">
                        ₹{originalPrice}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="px-3.5 py-1.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ShoppingBag size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default WishlistTab;
