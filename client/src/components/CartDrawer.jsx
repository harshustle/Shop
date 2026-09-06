import React, { useState } from 'react';
import { X, Clock, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, Tag, Check, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartDrawer = ({ isOpen, onClose, onCheckout }) => {
  const {
    items,
    itemCount,
    itemTotal,
    totalSavings,
    deliveryFee,
    platformFee,
    appliedCoupon,
    couponDiscount,
    grandTotal,
    addToCart,
    removeFromCart,
    applyCouponCode,
    removeCoupon,
    selectedLocation
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isOpen) return null;

  const freeDeliveryThreshold = 499;
  const neededForFreeDelivery = Math.max(0, freeDeliveryThreshold - itemTotal);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    setIsApplyingCoupon(true);

    const res = await applyCouponCode(couponInput.trim());
    setIsApplyingCoupon(false);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F8FAFC] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="font-black text-lg text-slate-900">My FreshCart</h3>
              <span className="px-2.5 py-0.5 bg-[#E8F8F0] text-[#00B074] text-xs font-black rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            >
              <X size={19} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* 15-Min Delivery Header Badge */}
            <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] text-[#00B074] flex items-center justify-center shrink-0">
                <Clock size={20} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#00B074]">
                  <span className="w-2 h-2 rounded-full bg-[#00B074] animate-ping" />
                  <span>Guaranteed 15-Min Dispatch</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Delivering to: <strong className="text-slate-900">{selectedLocation?.address || 'Gomti Nagar, Lucknow'}</strong>
                </p>
              </div>
            </div>

            {/* Empty Cart State */}
            {items.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 mt-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-[#00B074] flex items-center justify-center mb-4 text-3xl">
                  🛒
                </div>
                <h4 className="font-black text-slate-900 text-lg">Your cart is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Add fresh vegetables, fruits, staples, and daily dairy items to begin.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-[#00B074] text-white font-black text-xs rounded-2xl hover:bg-[#009663] transition shadow-xs"
                >
                  Explore Store
                </button>
              </div>
            ) : (
              <>
                {/* Free Delivery Milestone Progress */}
                {neededForFreeDelivery > 0 ? (
                  <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3 text-xs text-amber-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-600 shrink-0" />
                    <span>Add items worth <strong>₹{neededForFreeDelivery}</strong> more for <strong>FREE Delivery</strong>!</span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-3 text-xs text-emerald-900 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#00B074] shrink-0" />
                    <span>You've unlocked <strong>FREE 15-Minute Delivery</strong> on this order!</span>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs divide-y divide-slate-50">
                  {items.map(it => (
                    <div key={it.variantId} className="py-3 first:pt-1 last:pb-1 flex items-center gap-3">
                      <img 
                        src={it.image} 
                        alt={it.title}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-900 text-xs truncate">{it.title}</h5>
                        {it.attributes?.pack_size && (
                          <span className="inline-block text-[10px] text-slate-400 font-semibold">
                            {it.attributes.pack_size}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-black text-sm text-slate-900">₹{it.price * it.quantity}</span>
                          {it.comparePrice > it.price && (
                            <span className="text-[10px] text-slate-400 line-through">₹{it.comparePrice * it.quantity}</span>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center bg-[#00B074] text-white rounded-xl shadow-xs font-black text-xs overflow-hidden shrink-0">
                        <button
                          onClick={() => removeFromCart(it.variantId)}
                          className="px-2 py-1.5 hover:bg-[#009663] transition"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="px-2 py-0.5 text-center font-black min-w-[20px]">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() => addToCart({ _id: it.productId, title: it.title, basePrice: it.price }, { _id: it.variantId, sku: it.sku, price: it.price })}
                          className="px-2 py-1.5 hover:bg-[#009663] transition"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Input Box */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag size={13} className="text-[#00B074]" />
                    <span>Apply Coupon Code</span>
                  </span>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-[#E8F8F0] border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#00B074]" />
                        <div>
                          <p className="text-xs font-black text-[#00B074]">{appliedCoupon.code} Applied</p>
                          <p className="text-[10px] text-emerald-800">You saved ₹{couponDiscount.toFixed(2)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. FRESH20"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition disabled:opacity-40"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </form>
                  )}

                  {couponError && <p className="text-[11px] font-bold text-rose-600">{couponError}</p>}
                  {couponSuccess && <p className="text-[11px] font-bold text-[#00B074]">{couponSuccess}</p>}
                </div>

                {/* Bill Details */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">Bill Summary</h4>
                  
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-slate-800">₹{itemTotal.toFixed(2)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-xs text-[#00B074] font-bold bg-[#E8F8F0] p-1.5 rounded-lg">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Delivery Charge</span>
                    {deliveryFee === 0 ? (
                      <span className="font-bold text-[#00B074] flex items-center gap-1">
                        <span className="line-through text-slate-400 font-normal">₹25</span> FREE
                      </span>
                    ) : (
                      <span className="font-bold text-slate-800">₹{deliveryFee}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Handling Fee</span>
                    <span className="font-bold text-slate-800">₹{platformFee}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-black text-base text-slate-900">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Drawer Footer CTA */}
          {items.length > 0 && (
            <div className="bg-white p-4 border-t border-slate-100 shadow-lg">
              <button
                onClick={onCheckout}
                className="w-full py-3.5 px-5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl font-black text-sm flex items-center justify-between transition shadow-md shadow-[#00B074]/30 active:scale-98"
              >
                <div className="flex flex-col text-left">
                  <span className="text-base font-black">₹{grandTotal.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-100 uppercase font-bold">TOTAL • 15-MIN DISPATCH</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-black">
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} />
                </div>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
