import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  Check, 
  Truck,
  ShoppingBag,
  CreditCard,
  AlertTriangle 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartDrawer = ({ isOpen, onClose, onCheckout }) => {
  const {
    items,
    itemCount,
    itemTotal,
    deliveryFee,
    platformFee,
    appliedCoupon,
    couponDiscount,
    grandTotal,
    addToCart,
    removeFromCart,
    applyCouponCode,
    removeCoupon,
    selectedLocation,
    openLocationModal
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#FBFBFE] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header (Screen 1 style) */}
          <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">Shopping Bag</h3>
              <span className="px-3 py-1 bg-[#EFEBFF] text-[#635BFF] text-xs font-black rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#F4F4F8] hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Delivery Address Pill Card (Screen 1 style) */}
            <div 
              onClick={() => openLocationModal && openLocationModal()}
              className="bg-[#F4F4F8] p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer hover:bg-[#EAEAF0] transition"
              title="Click to change location or view 5km geofence"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Truck size={17} className="text-[#635BFF] shrink-0" />
                <div className="truncate">
                  <p className="font-black text-slate-900 truncate">
                    Order: {selectedLocation?.address || 'Street Golden 23/21, 7760'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {selectedLocation?.isDeliverable !== false ? '⚡ 15-Min Express Dispatch Active' : '⚠️ Outside 5km Delivery Zone'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black text-[#635BFF] bg-white px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
                Change
              </span>
            </div>

            {/* Empty Cart State */}
            {items.length === 0 ? (
              <div className="bg-white rounded-[32px] p-8 text-center border border-slate-100 mt-8 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#EFEBFF] text-[#635BFF] flex items-center justify-center text-2xl shadow-lg shadow-[#635BFF]/15">
                  <ShoppingBag size={28} />
                </div>
                <h4 className="font-black text-slate-900 text-lg">Your bag is empty</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
                  Add items from the store to begin fast 15-minute checkout.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-3 bg-[#635BFF] text-white font-black text-xs rounded-full hover:bg-[#5248EE] transition shadow-lg shadow-[#635BFF]/30"
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
                  <div className="bg-[#EFEBFF] border border-[#635BFF]/20 rounded-2xl p-3 text-xs text-[#635BFF] flex items-center gap-2 font-bold">
                    <ShieldCheck size={16} className="text-[#635BFF] shrink-0" />
                    <span>You've unlocked <strong>FREE 15-Minute Delivery</strong> on this order!</span>
                  </div>
                )}

                {/* Cart Items List (Screen 1 Soft Card Geometry) */}
                <div className="space-y-2.5">
                  {items.map(it => (
                    <div 
                      key={it.variantId} 
                      className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Soft pastel product thumbnail container */}
                        <div className="w-14 h-14 bg-[#F4F4F8] rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <img 
                            src={it.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200'} 
                            alt={it.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200';
                            }}
                          />
                        </div>

                        {/* Title, attributes, price */}
                        <div className="min-w-0">
                          <h5 className="font-black text-slate-900 text-xs truncate">{it.title}</h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              Color: <span className="w-2.5 h-2.5 rounded-full bg-[#635BFF] inline-block"></span>
                            </span>
                            <span>•</span>
                            <span>Size: {it.attributes?.pack_size || it.attributes?.size || 'M'}</span>
                          </div>
                          <p className="text-xs font-black text-slate-900 mt-1">
                            ₹{it.price * it.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Purple Stepper Button */}
                      <div className="flex items-center bg-[#635BFF] text-white rounded-full font-black text-xs shadow-md shadow-[#635BFF]/20 overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => removeFromCart(it.variantId)}
                          className="px-2.5 py-1.5 hover:bg-white/20 transition active:scale-90"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="px-1.5 text-center font-black min-w-[18px]">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart({ _id: it.productId, title: it.title, basePrice: it.price }, { _id: it.variantId, sku: it.sku, price: it.price })}
                          className="px-2.5 py-1.5 hover:bg-white/20 transition active:scale-90"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Input Box */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs space-y-2">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag size={13} className="text-[#635BFF]" />
                    <span>Apply Coupon Code</span>
                  </span>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-[#EFEBFF] border border-[#635BFF]/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#635BFF]" />
                        <div>
                          <p className="text-xs font-black text-[#635BFF]">{appliedCoupon.code} Applied</p>
                          <p className="text-[10px] text-purple-900 font-medium">You saved ₹{couponDiscount.toFixed(2)}</p>
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
                        className="flex-1 px-3 py-2 bg-[#F4F4F8] border-0 rounded-xl text-xs font-bold uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="px-4 py-2 bg-[#635BFF] hover:bg-[#5248EE] text-white text-xs font-black rounded-xl transition disabled:opacity-40"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </form>
                  )}

                  {couponError && <p className="text-[11px] font-bold text-rose-600">{couponError}</p>}
                  {couponSuccess && <p className="text-[11px] font-bold text-[#635BFF]">{couponSuccess}</p>}
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span className="font-black text-slate-900">₹{itemTotal.toFixed(2)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[#635BFF] font-bold bg-[#EFEBFF] p-2 rounded-xl">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Shipping:</span>
                    {deliveryFee === 0 ? (
                      <span className="font-bold text-[#635BFF] flex items-center gap-1">
                        <span className="line-through text-slate-400 font-normal">₹25</span> FREE
                      </span>
                    ) : (
                      <span className="font-black text-slate-900">₹{deliveryFee}</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-black text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-base text-slate-900 font-black">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Drawer Footer CTA (Screen 1 Pill Button) */}
          {items.length > 0 && (
            <div className="bg-white p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onCheckout}
                className="w-full py-4 px-6 bg-[#635BFF] hover:bg-[#5248EE] text-white rounded-full font-black text-sm flex items-center justify-between transition shadow-xl shadow-[#635BFF]/30 active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={18} />
                  <span>PAY NOW</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-black">
                  <span>₹{grandTotal.toFixed(2)}</span>
                  <ArrowRight size={16} />
                </div>
              </button>
              {/* Requirement 6 & 10: Legal Consent & GST Transparency */}
              <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
                By placing your order, you agree to our{' '}
                <Link to="/terms" onClick={onClose} className="text-[#635BFF] underline font-semibold">Terms</Link> and{' '}
                <Link to="/refunds" onClick={onClose} className="text-[#635BFF] underline font-semibold">Refund Policy</Link>. All prices include GST.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
