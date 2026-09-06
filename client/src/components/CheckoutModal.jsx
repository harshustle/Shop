import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Phone, User, CheckCircle2, ShieldCheck, CreditCard, Banknote, Sparkles, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const CheckoutModal = () => {
  const navigate = useNavigate();
  const {
    items,
    grandTotal,
    clearCart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    selectedLocation
  } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: selectedLocation.address || '',
    addressTag: selectedLocation.tag || 'Home',
    paymentMethod: 'cod' // 'cod' or 'online'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone) {
        setFormData(prev => ({ ...prev, phone: savedPhone }));
      }
    } catch (e) {}
  }, []);

  if (!isCheckoutOpen) return null;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Prepare order payload compatible with backend
      const orderPayload = {
        customerName: formData.name,
        phoneNumber: formData.phone,
        email: formData.email,
        address: `${formData.addressTag}: ${formData.address}`,
        products: items.map(it => ({
          productName: it.title,
          quantity: it.quantity,
          price: it.price,
          sku: it.sku
        })),
        status: 'pending'
      };

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place order');
      }

      const savedOrder = await response.json();
      
      // Save latest order to localStorage for tracking
      localStorage.setItem('latestOrder', JSON.stringify(savedOrder));
      localStorage.setItem('userPhone', formData.phone);

      // 2. If online payment selected, trigger idempotent payment simulation
      if (formData.paymentMethod === 'online' && savedOrder.orderNumber) {
        try {
          await fetch(`${API_URL}/api/checkout/pay`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              order_id: savedOrder._id || savedOrder.orderNumber,
              payment_gateway: 'mock',
              idempotency_key: `idemp_${Date.now()}`
            })
          });
        } catch (e) {}
      }

      setOrderSuccess(savedOrder);
      clearCart();

      // Auto-redirect to tracking after 2.5s
      setTimeout(() => {
        setIsCheckoutOpen(false);
        navigate('/orders');
      }, 2500);

    } catch (err) {
      console.error('Order submission error:', err);
      setError(err.message || 'Something went wrong while placing order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 my-8">
        
        {/* Close Button */}
        {!orderSuccess && (
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        )}

        {orderSuccess ? (
          /* Order Success State */
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-[#0C831F] flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 size={46} />
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[#0C831F] text-xs font-black rounded-full uppercase tracking-wider">
              Order Confirmed!
            </span>
            <h3 className="text-2xl font-black text-gray-900 mt-3">Order #{orderSuccess.orderNumber || 'PLACED'}</h3>
            <p className="text-xs text-gray-600 mt-1">
              Your 10-minute instant delivery partner has been assigned!
            </p>

            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between font-bold">
                <span>Deliver to:</span>
                <span className="text-gray-900">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{formData.phone}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount:</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Loader2 size={13} className="animate-spin text-[#0C831F]" />
              Redirecting to Live Order Tracker...
            </p>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
              <span className="text-[11px] font-extrabold uppercase text-[#0C831F] tracking-wide">
                Delivery in 8 to 10 minutes
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900">Complete Your Order</h3>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="mt-5 space-y-4">
              
              {/* Recipient Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0C831F]/30 focus:border-[#0C831F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number (for Delivery OTP) *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0C831F]/30 focus:border-[#0C831F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Address *</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3 text-gray-400" />
                    <textarea
                      required
                      rows={2}
                      placeholder="House/Flat No, Building, Street, Landmark"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0C831F]/30 focus:border-[#0C831F]"
                    />
                  </div>

                  {/* Address Tag Chips */}
                  <div className="flex gap-2 mt-2">
                    {['Home', 'Work', 'Other'].map(tag => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setFormData({ ...formData, addressTag: tag })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                          formData.addressTag === tag
                            ? 'border-[#0C831F] bg-emerald-50 text-[#0C831F]'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#0C831F] bg-emerald-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${formData.paymentMethod === 'cod' ? 'bg-[#0C831F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <Banknote size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900">Pay on Delivery</p>
                      <p className="text-[10px] text-gray-500">Cash / UPI at door</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                      formData.paymentMethod === 'online'
                        ? 'border-[#0C831F] bg-emerald-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${formData.paymentMethod === 'online' ? 'bg-[#0C831F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900">UPI / Card</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">Instant Secure Pay</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Line */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Total to pay:</span>
                  <p className="text-base font-black text-gray-900">₹{grandTotal}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                  <ShieldCheck size={16} className="text-[#0C831F]" />
                  <span>100% Safe Delivery</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#0C831F] text-white rounded-2xl font-black text-sm hover:bg-[#0A6E1A] transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>Place Order • ₹{grandTotal}</span>
                )}
              </button>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default CheckoutModal;
