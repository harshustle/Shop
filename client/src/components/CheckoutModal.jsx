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
  ArrowLeft,
  Repeat,
  Package,
  ShoppingBag,
  ChevronDown,
  Check,
  MapPin,
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
    selectedLocation,
    openLocationModal
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

  // Keep formData address synchronized with selected location from map
  useEffect(() => {
    if (selectedLocation?.address) {
      setFormData(prev => ({
        ...prev,
        address: selectedLocation.address,
        addressTag: selectedLocation.tag || prev.addressTag,
        pincode: selectedLocation.postalCode || prev.pincode
      }));
    }
  }, [selectedLocation]);

  if (!showModal) return null;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setError('Please fill your name, phone number, and delivery address');
      return;
    }

    if (selectedLocation?.isDeliverable === false) {
      setError('Your selected delivery location is outside our 5.0 km delivery geofence. Please change your delivery pin to a serviceable zone.');
      return;
    }

    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    if (selectedLocation && selectedLocation.isDeliverable === false) {
      setError('Selected address is outside our delivery zone. Please choose an address within our delivery polygon.');
      setIsLoading(false);
      return;
    }

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

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-md bg-[#FBFBFE] rounded-[32px] shadow-2xl border border-slate-100 p-5 sm:p-6 z-10 animate-in zoom-in-95 duration-200">
          
          {/* SUCCESS SCREEN */}
          {orderSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EFEBFF] text-[#635BFF] flex items-center justify-center mx-auto text-2xl shadow-lg shadow-[#635BFF]/20 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900">Order Placed Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Order Number: <strong className="text-slate-900 font-mono">{orderSuccess.orderNumber || '#FC-' + Date.now().toString().slice(-6)}</strong>
                </p>
                {orderSuccess.shippingLogistics?.awbCode && (
                  <p className="text-[11px] font-mono text-[#635BFF] font-bold mt-0.5">
                    AWB Tracking: {orderSuccess.shippingLogistics.awbCode}
                  </p>
                )}
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-2xl text-xs space-y-2 text-slate-600 max-w-sm mx-auto text-left shadow-2xs">
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
                  <span className="text-[#635BFF] font-black">⚡ FreshCart Express (15 Mins)</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivering to:</span>
                  <span className="truncate max-w-[180px]">{formData.address}</span>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/orders');
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#635BFF] hover:bg-[#5248EE] text-white rounded-full text-xs font-black transition shadow-lg shadow-[#635BFF]/30"
                >
                  Track Order Live
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/shop');
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* SCREEN 1 CHECKOUT FORM */
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              
              {/* Top Header: Circular Back Button & Title */}
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200/70 flex items-center justify-center text-slate-800 shadow-2xs hover:bg-slate-50 transition active:scale-95 shrink-0"
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Product Items List (Matching Screen 1 Cards) */}
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {items && items.length > 0 ? (
                  items.map((item, idx) => (
                    <div 
                      key={item.id || item._id || idx}
                      className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Soft pastel product thumbnail container */}
                        <div className="w-14 h-14 bg-[#F4F4F8] rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200'}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200';
                            }}
                          />
                        </div>

                        {/* Title, attributes, price */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              Color: <span className="w-2.5 h-2.5 rounded-full bg-[#635BFF] inline-block"></span>
                            </span>
                            <span>•</span>
                            <span>Size: {item.unit || item.size || 'Standard'}</span>
                          </div>
                          <p className="text-xs font-black text-slate-900 mt-1">
                            ₹{item.price} <span className="text-[10px] text-slate-400 font-normal">× {item.quantity}</span>
                          </p>
                        </div>
                      </div>

                      {/* Dropdown / Quantity badge */}
                      <div className="w-8 h-8 rounded-full bg-[#F6F7FB] flex items-center justify-center text-slate-600 shrink-0">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    Your bag is empty
                  </div>
                )}
              </div>

              {/* Delivery Row & Address Pill */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
                  <span>Delivery</span>
                  <span className="text-slate-900 font-black">₹{deliveryFee || 15}</span>
                </div>

                {/* Delivery Pill Card matching Screenshot */}
                <div className="bg-[#F4F4F8] p-3 rounded-2xl flex items-center justify-between text-xs font-medium text-slate-800">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Truck size={16} className="text-slate-800 shrink-0" />
                    <span className="truncate text-xs font-bold">
                      Order: {formData.address || 'Street Golden 23/21, 7760'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLocationModal && openLocationModal()}
                    title="Change location"
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition shrink-0"
                  >
                    <Repeat size={14} className="hover:rotate-180 transition duration-300" />
                  </button>
                </div>
              </div>

              {/* Saved addresses shortcut if user has multiple */}
              {savedAddresses.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5">
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
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 transition ${
                        formData.address.includes(a.streetAddress)
                          ? 'bg-[#EFEBFF] border-[#635BFF] text-[#635BFF]'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Payment Card (VISA style matching Screen 1) */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                      formData.paymentMethod === 'razorpay'
                        ? 'bg-white border-slate-200 shadow-2xs text-slate-900 ring-2 ring-[#635BFF]/30'
                        : 'bg-[#F4F4F8] border-transparent text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black italic tracking-wider text-base text-[#1A1F71]">VISA</span>
                      <span className="text-[10px] font-bold text-slate-400">/ UPI</span>
                    </div>
                    <span className="font-black text-xs text-slate-900">₹{grandTotal.toFixed(0)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                      formData.paymentMethod === 'cod'
                        ? 'bg-white border-slate-200 shadow-2xs text-slate-900 ring-2 ring-[#635BFF]/30'
                        : 'bg-[#F4F4F8] border-transparent text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Banknote size={16} className="text-amber-600 shrink-0" />
                      <span className="font-bold text-[11px]">Cash</span>
                    </div>
                    <span className="font-black text-xs text-slate-900">₹{grandTotal.toFixed(0)}</span>
                  </button>
                </div>
              </div>

              {/* Contact Details (Clean compact inputs) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  required
                  placeholder="Your Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F4F8] border-0 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="10-digit phone *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F4F4F8] border-0 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                />
              </div>

              {/* Price Breakdown with Bag & Package icons (Matching Screen 1) */}
              <div className="space-y-1.5 pt-2 text-xs font-bold text-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShoppingBag size={14} className="text-slate-400" />
                    <span>Subtotal:</span>
                  </div>
                  <span className="text-slate-900 font-black">₹{itemTotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Package size={14} className="text-slate-400" />
                    <span>Shipping:</span>
                  </div>
                  <span className="text-slate-900 font-black">₹{(deliveryFee || 15).toFixed(2)}</span>
                </div>
              </div>

              {/* Royal Purple Pill PAY CTA Button (Screen 1) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#635BFF] hover:bg-[#5248EE] active:scale-[0.99] text-white rounded-full font-black text-sm uppercase tracking-wide transition shadow-xl shadow-[#635BFF]/30 flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>PAY</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
