import React from 'react';
import { X, Clock, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, Bike } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartDrawer = () => {
  const {
    items,
    itemCount,
    itemTotal,
    totalSavings,
    deliveryFee,
    platformFee,
    grandTotal,
    addToCart,
    removeFromCart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    selectedLocation
  } = useCart();

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 499;
  const neededForFreeDelivery = Math.max(0, freeDeliveryThreshold - itemTotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F4F6FB] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="font-extrabold text-lg text-gray-900">My Cart</h3>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* 8-Min Delivery Banner */}
            <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0C831F] flex items-center justify-center shrink-0">
                <Bike size={22} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#0C831F]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
                  <span>Delivery in 8 minutes</span>
                </div>
                <p className="text-xs text-gray-600 truncate mt-0.5">
                  Shipment delivering to <strong className="text-gray-900">{selectedLocation.tag}</strong>
                </p>
              </div>
            </div>

            {/* Empty Cart State */}
            {items.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 mt-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 text-3xl">
                  🛒
                </div>
                <h4 className="font-extrabold text-gray-900 text-lg">Your cart is empty</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Explore fresh fashion and electronics delivered in 8 to 10 minutes.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-6 py-2.5 bg-[#0C831F] text-white font-extrabold text-sm rounded-xl hover:bg-[#0A6E1A] transition shadow-xs"
                >
                  Start Shopping
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
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>You've unlocked <strong>FREE Delivery</strong> on this order!</span>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs divide-y divide-gray-50">
                  {items.map(it => (
                    <div key={it.variantId} className="py-3 first:pt-1 last:pb-1 flex items-center gap-3">
                      <img 
                        src={it.image} 
                        alt={it.title}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-gray-900 text-xs truncate">{it.title}</h5>
                        {it.attributes?.size && (
                          <span className="inline-block text-[10px] text-gray-400 font-semibold uppercase">
                            Size: {it.attributes.size}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-black text-sm text-gray-900">₹{it.price * it.quantity}</span>
                          {it.comparePrice > it.price && (
                            <span className="text-[10px] text-gray-400 line-through">₹{it.comparePrice * it.quantity}</span>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center bg-[#0C831F] text-white rounded-lg shadow-xs font-extrabold text-xs overflow-hidden shrink-0">
                        <button
                          onClick={() => removeFromCart(it.variantId)}
                          className="px-2 py-1 hover:bg-[#0A6E1A] transition"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-2 py-0.5 text-center font-black min-w-[18px]">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() => addToCart({ _id: it.productId, title: it.title, price: it.price }, { _id: it.variantId, sku: it.sku, price: it.price })}
                          className="px-2 py-1 hover:bg-[#0A6E1A] transition"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill Details */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
                  <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Bill Details</h4>
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Items Total</span>
                    <span className="font-bold text-gray-800">₹{itemTotal}</span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Delivery Charge</span>
                    {deliveryFee === 0 ? (
                      <span className="font-bold text-[#0C831F] flex items-center gap-1">
                        <span className="line-through text-gray-400 font-normal">₹25</span> FREE
                      </span>
                    ) : (
                      <span className="font-bold text-gray-800">₹{deliveryFee}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Handling Fee</span>
                    <span className="font-bold text-gray-800">₹{platformFee}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-bold">
                      <span>Total Savings</span>
                      <span>-₹{totalSavings}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline font-black text-base text-gray-900">
                    <span>Grand Total</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                {/* Cancellation Policy Banner */}
                <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-500 leading-relaxed border border-gray-100">
                  Orders cannot be cancelled once packed for dispatch. Quality guarantee applies on all 10-minute deliveries.
                </div>
              </>
            )}

          </div>

          {/* Drawer Footer CTA */}
          {items.length > 0 && (
            <div className="bg-white p-4 border-t border-gray-100 shadow-lg">
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 px-5 bg-[#0C831F] text-white rounded-2xl font-extrabold text-sm flex items-center justify-between hover:bg-[#0A6E1A] transition shadow-md active:scale-98"
              >
                <div className="flex flex-col text-left">
                  <span className="text-base font-black">₹{grandTotal}</span>
                  <span className="text-[10px] text-emerald-200 uppercase font-semibold">TOTAL • VIEW BREAKDOWN</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>Proceed to Pay</span>
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
