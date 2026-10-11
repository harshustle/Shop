import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const WishlistTab = ({ wishlistProducts = [], onRemoveItem }) => {
  const { addToCart } = useCart();

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header matching Screen 3 */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
          WISHLIST
        </h1>
        <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
          {wishlistProducts.length} items
        </span>
      </div>

      {/* Wishlist Grid (Screen 3: 2-column cards) */}
      {wishlistProducts.length === 0 ? (
        /* Empty State with 3D Purple Gift Box matching Screen 3 */
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 sm:p-12 text-center shadow-2xs space-y-4">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[#EFEBFF] rounded-full blur-xl opacity-70"></div>
            
            {/* Vector 3D Purple Gift Box matching Screen 3 */}
            <svg
              className="w-24 h-24 relative z-10 drop-shadow-md animate-pulse"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stars / sparkle */}
              <path d="M85 25 L86.5 28.5 L90 30 L86.5 31.5 L85 35 L83.5 31.5 L80 30 L83.5 28.5 Z" fill="#FEEA85" />
              <path d="M15 45 L16 47 L18 48 L16 49 L15 51 L14 49 L12 48 L14 47 Z" fill="#FEEA85" />
              
              {/* Gift box body (purple isometric) */}
              <path d="M22 45 L50 60 L50 92 L22 77 Z" fill="#6C5CE7" />
              <path d="M50 60 L78 45 L78 77 L50 92 Z" fill="#5A48D9" />
              <path d="M50 60 L78 45 L50 30 L22 45 Z" fill="#7C6DF2" />

              {/* Lavender ribbon wrap */}
              <path d="M33 39 L47 46 L47 78 L33 71 Z" fill="#DFCCF9" opacity="0.9" />
              <path d="M53 46 L67 39 L67 71 L53 78 Z" fill="#CBB3F5" opacity="0.9" />

              {/* Big lavender bow on top */}
              <path
                d="M50 30 C40 18, 25 22, 38 33 C45 37, 50 30, 50 30 Z"
                fill="#E8DCFC"
              />
              <path
                d="M50 30 C60 18, 75 22, 62 33 C55 37, 50 30, 50 30 Z"
                fill="#D9C7FA"
              />
              <circle cx="50" cy="30" r="5" fill="#C5AEF7" />
            </svg>
          </div>

          <div>
            <h3 className="text-base font-black text-slate-800">Your wishlist is empty</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs mx-auto">
              Save your favorite items to quickly move them to your bag later.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#635BFF] hover:bg-[#5248EE] text-white rounded-full text-xs font-black transition shadow-lg shadow-[#635BFF]/30 active:scale-95"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {wishlistProducts.map((p) => {
            const price = p.price || 80;
            const discount = p.discountPercent || (p.originalPrice ? Math.round(((p.originalPrice - price) / p.originalPrice) * 100) : 23);

            return (
              <div
                key={p._id}
                className="bg-white rounded-[26px] p-3 border border-slate-100/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-2.5 group"
              >
                {/* Product Image Tile with Pastel Background & Top Badges */}
                <div className="relative aspect-square rounded-2xl bg-[#F4F4F8] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={p.image || p.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300'}
                    alt={p.title || p.name || 'Product'}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300';
                    }}
                  />

                  {/* Discount Tag (Yellow Pill top-left matching Screen 3) */}
                  {discount > 0 && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#FEEA85] text-slate-900 text-[10px] font-black tracking-tight shadow-2xs">
                      {discount}%
                    </span>
                  )}

                  {/* Heart Toggle Button (top-right matching Screen 3) */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(p._id)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition flex items-center justify-center shadow-2xs"
                    title="Remove from Wishlist"
                  >
                    <Heart size={14} className="fill-rose-500 text-rose-500" />
                  </button>
                </div>

                {/* Product Title & Price matching Screen 3 */}
                <div className="space-y-0.5 px-1">
                  <Link
                    to={`/product/${p.slug || p._id}`}
                    className="text-xs font-black text-slate-900 hover:text-[#635BFF] transition block truncate"
                  >
                    {p.title || p.name || 'Air Max 270 React'}
                  </Link>
                  <p className="text-xs font-black text-slate-900">
                    {price}$
                  </p>
                </div>

                {/* Full-width "Move to bag" Pill Button matching Screen 3 */}
                <button
                  type="button"
                  onClick={() => {
                    addToCart(p);
                    onRemoveItem(p._id);
                  }}
                  className="w-full py-2.5 px-3 bg-[#F4F4F8] hover:bg-[#EAEAF0] active:scale-[0.98] text-slate-800 rounded-full text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={13} className="text-slate-700" />
                  <span>Move to bag</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default WishlistTab;
