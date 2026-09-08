import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Banknote, 
  Sparkles, 
  Loader2, 
  QrCode, 
  Truck,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

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
    address: selectedLocation?.address || 'Flat 402, Royal Residency, Gomti Nagar, Lucknow',
    addressTag: selectedLocation?.tag || 'Home',
    deliveryMethod: 'instant', // 'instant' | 'scheduled'
    paymentMethod: 'cod' // 'cod' | 'upi' | 'card'
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

    try {
      const token = localStorage.getItem('token');
      const orderPayload = {
        customerName: formData.name,
        phoneNumber: formData.phone,
        email: formData.email || undefined,
        address: `${formData.addressTag}: ${formData.address}`,
        products: items.map(it => ({
          productName: it.title,
          quantity: it.quantity,
          price: it.price
        })),
        items: items.map(it => ({
          variantId: it.variantId,
          skuSnapshot: it.sku || 'SKU-DIRECT',
          productTitleSnapshot: it.title,
          unitPriceSnapshot: it.price,
          quantity: it.quantity,
          totalLinePrice: it.price * it.quantity
        })),
        subtotal: itemTotal,
        discountAmount: couponDiscount,
        couponCode: appliedCoupon?.code,
        shippingFee: deliveryFee,
        totalAmount: grandTotal,
        paymentStatus: formData.paymentMethod === 'cod' ? 'unpaid' : 'paid',
        paymentMethod: formData.paymentMethod
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(data);
        clearCart();
      } else {
        setError(data.error || 'Failed to place order. Please verify cart items.');
      }
    } catch (err) {
      setError('Could not connect to order processing server.');
    } finally {
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
              </div>

              <div className="p-4 bg-[#F8FDFB] border border-emerald-100 rounded-2xl text-xs space-y-1 text-slate-600 max-w-sm mx-auto">
                <div className="flex justify-between font-bold">
                  <span>Amount Paid / Payable:</span>
                  <span className="text-slate-900 font-black">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery:</span>
                  <span className="text-[#00B074] font-black">⚡ In 15 Minutes</span>
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
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              <div>
                <span className="text-xs font-black text-[#00B074] uppercase tracking-wider">Fast Checkout</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  Confirm Delivery & Payment
                </h3>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
                  {error}
                </div>
              )}

              {/* Saved addresses shortcut */}
              {savedAddresses.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select from Saved Addresses:</label>
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

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="House/Flat number, building name, landmark, city"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              {/* Delivery Speed Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Delivery Speed:</label>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <div 
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'instant' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                      formData.deliveryMethod === 'instant'
                        ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Clock size={16} className="shrink-0" />
                    <div>
                      <p className="leading-tight">Instant Delivery</p>
                      <span className="text-[10px] opacity-75">Within 15 Mins</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'scheduled' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                      formData.deliveryMethod === 'scheduled'
                        ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Truck size={16} className="shrink-0" />
                    <div>
                      <p className="leading-tight">Morning Slot</p>
                      <span className="text-[10px] opacity-75">7:00 AM - 9:00 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Method:</label>
                <div className="grid grid-cols-3 gap-2.5 text-xs font-bold">
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Banknote size={16} className="mx-auto mb-1" />
                    <span className="text-[11px] block">Cash on Delivery</span>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition ${
                      formData.paymentMethod === 'upi'
                        ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <QrCode size={16} className="mx-auto mb-1" />
                    <span className="text-[11px] block">Instant UPI QR</span>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                    className={`p-2.5 rounded-2xl border text-center cursor-pointer transition ${
                      formData.paymentMethod === 'card'
                        ? 'border-[#00B074] bg-[#E8F8F0] text-[#00B074]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard size={16} className="mx-auto mb-1" />
                    <span className="text-[11px] block">Credit / Debit</span>
                  </div>
                </div>
              </div>

              {/* UPI Simulated QR Code view */}
              {formData.paymentMethod === 'upi' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <div className="w-20 h-20 mx-auto bg-white border border-slate-300 p-1 rounded-xl flex items-center justify-center">
                    <QrCode size={64} className="text-slate-800" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700">Scan via GPay, PhonePe, Paytm or BHIM</p>
                  <p className="text-[10px] text-slate-400">UPI ID: freshcart@icici</p>
                </div>
              )}

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
                    <span>Placing Your Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order (₹{grandTotal.toFixed(2)})</span>
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
