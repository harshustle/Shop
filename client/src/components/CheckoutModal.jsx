import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  Loader2, 
  QrCode, 
  Truck,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

// Helper to load Razorpay script on demand
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    items,
    itemTotal,
    appliedCoupon,
    couponDiscount,
    deliveryFee,
    grandTotal,
    clearCart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    selectedLocation
  } = useCart();

  const showModal = isOpen !== undefined ? isOpen : isCheckoutOpen;
  const handleClose = onClose || (() => setIsCheckoutOpen(false));

  const [formData, setFormData] = useState({
    name: localStorage.getItem('fullName') || '',
    phone: localStorage.getItem('userPhone') || '',
    email: localStorage.getItem('userEmail') || localStorage.getItem('adminEmail') || '',
    address: selectedLocation?.address || 'Flat 402, Royal Residency, Sector 4, Ghaziabad, UP',
    pincode: '201014',
    state: 'Uttar Pradesh',
    addressTag: selectedLocation?.tag || 'Home',
    deliveryMethod: 'instant', // 'instant' | 'scheduled'
    paymentMethod: 'razorpay' // 'razorpay' | 'cod' | 'upi'
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/account/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.addresses && data.addresses.length > 0) {
              setSavedAddresses(data.addresses);
              const def = data.addresses.find(a => a.isDefault) || data.addresses[0];
              setFormData(prev => ({
                ...prev,
                name: def.fullName || prev.name,
                phone: def.phoneNumber || prev.phone,
                address: `${def.streetAddress}, ${def.city} - ${def.postalCode}`,
                pincode: def.postalCode || prev.pincode,
                state: def.state || prev.state,
                addressTag: def.label
              }));
            }
          }
        } catch (e) {}
      }
    };

    if (showModal) {
      fetchUserAddresses();
    }
  }, [showModal]);

  if (!showModal) return null;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setError('Please fill your name, phone number, and delivery address');
      return;
    }

    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      // 1. If Cash on Delivery, check anti-fraud serviceability first
      if (formData.paymentMethod === 'cod') {
        const pinCheckRes = await fetch(`${API_URL}/api/v1/checkout/pincode/${formData.pincode}?amount=${grandTotal}`, {
          headers: authHeaders
        });
        const pinCheck = await pinCheckRes.json();
        if (!pinCheck.codEligible) {
          setError(pinCheck.reason || 'Cash on Delivery is unavailable for this order. Please select Online Payment.');
          setIsLoading(false);
          return;
        }

        // Place COD order
        const orderPayload = {
          customer_name: formData.name,
          phone_number: formData.phone,
          email: formData.email,
          shipping_address: {
            address: `${formData.addressTag}: ${formData.address}`,
            pincode: formData.pincode,
            state: formData.state
          },
          items: items.map(it => ({
            variant_id: it.variantId,
            quantity: it.quantity
          })),
          coupon_code: appliedCoupon?.code,
          coupon_discount: couponDiscount,
          payment_method: 'cod'
        };

        const res = await fetch(`${API_URL}/api/v1/checkout/order`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(orderPayload)
        });

        const data = await res.json();
        if (res.ok) {
          setOrderSuccess(data);
          clearCart();
        } else {
          setError(data.error || 'Failed to place COD order');
        }
        setIsLoading(false);
        return;
      }

      // 2. Razorpay / Online Payment Flow
      const createOrderRes = await fetch(`${API_URL}/api/v1/checkout/razorpay/create-order`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          items: items.map(it => ({
            variant_id: it.variantId,
            quantity: it.quantity
          })),
          destination_state: formData.state,
          coupon_discount: couponDiscount
        })
      });

      const orderData = await createOrderRes.json();
      if (!createOrderRes.ok) {
        setError(orderData.error || 'Failed to initialize payment gateway');
        setIsLoading(false);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      const hasLiveRazorpay = isLoaded && window.Razorpay && orderData.mode === 'live';

      if (hasLiveRazorpay) {
        // Open live Razorpay popup
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'FreshCart Supermarket',
          description: `Order #${orderData.orderId}`,
          order_id: orderData.orderId,
          prefill: {
            name: formData.name,
            contact: formData.phone,
            email: formData.email
          },
          theme: {
            color: '#00B074'
          },
          handler: async (response) => {
            // Verify HMAC signature server-side
            try {
              const verifyRes = await fetch(`${API_URL}/api/v1/checkout/razorpay/verify`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  customer_name: formData.name,
                  phone_number: formData.phone,
                  email: formData.email,
                  shipping_address: {
                    address: `${formData.addressTag}: ${formData.address}`,
                    pincode: formData.pincode,
                    state: formData.state
                  },
                  items: items.map(it => ({
                    variant_id: it.variantId,
                    quantity: it.quantity
                  })),
                  coupon_code: appliedCoupon?.code,
                  coupon_discount: couponDiscount
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                setOrderSuccess(verifyData.order);
                clearCart();
              } else {
                setError(verifyData.error || 'Payment verification failed');
              }
            } catch (vErr) {
              setError('Error during payment verification: ' + vErr.message);
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // High-Fidelity Mock Mode (until live Razorpay API keys are entered in .env)
        const verifyRes = await fetch(`${API_URL}/api/v1/checkout/razorpay/verify`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'verified_sandbox_signature',
            customer_name: formData.name,
            phone_number: formData.phone,
            email: formData.email,
            shipping_address: {
              address: `${formData.addressTag}: ${formData.address}`,
              pincode: formData.pincode,
              state: formData.state
            },
            items: items.map(it => ({
              variant_id: it.variantId,
              quantity: it.quantity
            })),
            coupon_code: appliedCoupon?.code,
            coupon_discount: couponDiscount
          })
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          setOrderSuccess(verifyData.order);
          clearCart();
        } else {
          setError(verifyData.error || 'Order placement failed');
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Connection error with checkout server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200">
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>

          {/* SUCCESS SCREEN */}
          {orderSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#00B074] flex items-center justify-center mx-auto text-2xl shadow-md shadow-[#00B074]/20 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900">Order Placed Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Order Number: <strong className="text-slate-900 font-mono">{orderSuccess.orderNumber || '#FC-' + Date.now().toString().slice(-6)}</strong>
                </p>
                {orderSuccess.shippingLogistics?.awbCode && (
                  <p className="text-[11px] font-mono text-[#00B074] font-bold mt-0.5">
                    AWB Tracking: {orderSuccess.shippingLogistics.awbCode}
                  </p>
                )}
              </div>

              <div className="p-4 bg-[#F8FDFB] border border-emerald-100 rounded-2xl text-xs space-y-1.5 text-slate-600 max-w-sm mx-auto text-left">
                <div className="flex justify-between font-bold">
                  <span>Amount Paid / Payable:</span>
                  <span className="text-slate-900 font-black">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="uppercase font-bold text-slate-700">{orderSuccess.paymentMethod || 'Online'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fleet:</span>
                  <span className="text-[#00B074] font-black">⚡ FreshCart Express (15 Mins)</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivering to:</span>
                  <span className="truncate max-w-[180px]">{formData.address}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/orders');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
                >
                  Track Order Live
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/shop');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <span className="text-xs font-black text-[#00B074] uppercase tracking-wider">Fast Checkout</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  Confirm Delivery & Payment
                </h3>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Saved addresses shortcut */}
              {savedAddresses.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Saved Address:</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {savedAddresses.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          name: a.fullName,
                          phone: a.phoneNumber,
                          address: `${a.streetAddress}, ${a.city} - ${a.postalCode}`,
                          pincode: a.postalCode || '201014',
                          state: a.state || 'Uttar Pradesh',
                          addressTag: a.label
                        })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition ${
                          formData.address.includes(a.streetAddress)
                            ? 'bg-[#E8F8F0] border-[#00B074] text-[#00B074]'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {a.label} ({a.city})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery Address & Pincode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="House/Flat number, building name, landmark, city"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="6-digit pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State (e.g. Maharashtra)"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Method:</label>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                      formData.paymentMethod === 'razorpay'
                        ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard size={18} className="shrink-0 text-[#00B074]" />
                    <div>
                      <span className="block font-black leading-tight">Online (UPI / Cards)</span>
                      <span className="text-[10px] opacity-75 font-normal">Razorpay Secure</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Banknote size={18} className="shrink-0 text-amber-600" />
                    <div>
                      <span className="block font-black leading-tight">Cash on Delivery</span>
                      <span className="text-[10px] opacity-75 font-normal">Pay at Doorstep</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Amount Summary */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Payable Amount:</span>
                  <p className="text-xl font-black text-slate-900">₹{grandTotal.toFixed(2)}</p>
                </div>
                {appliedCoupon && (
                  <span className="text-[10px] font-black text-[#00B074] bg-[#E8F8F0] px-2 py-0.5 rounded-md">
                    Coupon: {appliedCoupon.code} (-₹{couponDiscount.toFixed(0)})
                  </span>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl font-black text-xs transition shadow-lg shadow-[#00B074]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay ₹{grandTotal.toFixed(2)}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
