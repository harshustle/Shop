import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, Bike, Clock, ChevronRight, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import QuickHeader from '../components/QuickHeader';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import { API_URL } from '../config';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Received by store partner' },
  { key: 'packed', label: 'Order Packed', desc: 'Quality checked & bagged' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is 3 mins away' },
  { key: 'delivered', label: 'Delivered', desc: 'Handed over at doorstep' }
];

const getStepIndex = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 0;
    case 'processing': return 0;
    case 'packed': return 1;
    case 'out_for_delivery': return 2;
    case 'shipped': return 2;
    case 'delivered': return 3;
    default: return 0;
  }
};

const UserOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phone, setPhone] = useState(localStorage.getItem('userPhone') || '');

  useEffect(() => {
    fetchOrders();
  }, [phone]);

  const fetchOrders = async () => {
    if (!phone) {
      // Check if latest order exists in localStorage
      const latest = localStorage.getItem('latestOrder');
      if (latest) {
        try {
          const parsed = JSON.parse(latest);
          setOrders([parsed]);
          if (parsed.phoneNumber) setPhone(parsed.phoneNumber);
        } catch (e) {}
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/user/${phone}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col">
      <QuickHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        
        {/* Back Link & Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-900">Your Orders & Live Tracking</h2>
              <p className="text-xs text-gray-500 font-medium">Tracking deliveries for {phone || 'Recent Purchases'}</p>
            </div>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 animate-pulse space-y-4">
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-16 bg-gray-50 rounded-2xl"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-[#0C831F] flex items-center justify-center text-2xl mb-4">
              🛵
            </div>
            <h3 className="font-black text-lg text-gray-900">No orders placed yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Your instant deliveries and past order history will appear here with live tracking.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 bg-[#0C831F] text-white rounded-xl font-black text-xs hover:bg-[#0A6E1A] transition"
            >
              Explore Storefront
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => {
              const currentStep = getStepIndex(order.status || order.orderStatus);
              const isDelivered = currentStep === 3;
              const products = order.products || [];

              return (
                <div key={order._id || order.orderNumber || idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
                  
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">
                          Order #{order.orderNumber || order._id?.slice(-8) || 'ORD-8921'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {order.status || 'Processing'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString()} at {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-500">Total Paid</span>
                      <p className="text-base font-black text-gray-900">₹{order.totalAmount || order.subtotal || 799}</p>
                    </div>
                  </div>

                  {/* Live Delivery Timeline Progress */}
                  <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0C831F] flex items-center justify-center">
                          <Bike size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">
                            {isDelivered ? 'Order Delivered Successfully' : 'Arriving in 8 to 10 Minutes'}
                          </p>
                          <p className="text-[11px] text-gray-500">{order.address}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#0C831F]">
                        {isDelivered ? 'COMPLETED' : 'LIVE'}
                      </span>
                    </div>

                    {/* Progress Track Bar */}
                    <div className="relative flex justify-between items-center mt-6">
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                      <div 
                        className="absolute top-1/2 left-0 h-1 bg-[#0C831F] -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                      ></div>

                      {STATUS_STEPS.map((step, sIdx) => {
                        const isPassed = sIdx <= currentStep;
                        const isCurrent = sIdx === currentStep;

                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                              isPassed 
                                ? 'bg-[#0C831F] text-white shadow-xs' 
                                : 'bg-white border-2 border-gray-300 text-gray-400'
                            }`}>
                              {isPassed ? <CheckCircle2 size={16} /> : sIdx + 1}
                            </div>
                            <span className={`text-[10px] font-bold mt-2 text-center max-w-[70px] ${
                              isCurrent ? 'text-[#0C831F]' : isPassed ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Items in this Delivery</h4>
                    <div className="divide-y divide-gray-100">
                      {products.map((item, pIdx) => (
                        <div key={pIdx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-[10px]">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-gray-900">{item.productName}</span>
                          </div>
                          <span className="font-bold text-gray-700">₹{item.price ? item.price * item.quantity : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      <CartDrawer />
      <CheckoutModal />
    </div>
  );
};

export default UserOrders;
