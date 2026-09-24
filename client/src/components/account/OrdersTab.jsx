import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';

const OrdersTab = ({ orders = [] }) => {
  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 size={13} className="text-emerald-600" />,
          label: 'Delivered'
        };
      case 'shipped':
      case 'out for delivery':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Truck size={13} className="text-blue-600" />,
          label: 'Out for Delivery'
        };
      case 'cancelled':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertCircle size={13} className="text-rose-600" />,
          label: 'Cancelled'
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock size={13} className="text-amber-600" />,
          label: status || 'Placed'
        };
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={18} />
          </span>
          <span>My Orders ({orders.length})</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Review past quick-commerce orders, track deliveries in real-time, or download invoices.
        </p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <Package size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Your cart is waiting! Explore fresh fruits, vegetables, dairy, and household essentials delivered in 10 minutes.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
          >
            <span>Start Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const badge = getStatusBadge(ord.orderStatus || ord.status);
            const items = ord.items || [];
            const orderDate = ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Recent Order';

            return (
              <div
                key={ord._id || ord.orderNumber}
                className="p-5 sm:p-6 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 tracking-tight">
                        Order #{ord.orderNumber || (ord._id ? ord._id.slice(-8).toUpperCase() : 'FC')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Placed on {orderDate}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Total Paid</span>
                    <span className="text-base font-black text-slate-900">
                      ₹{(ord.pricing?.finalTotal || ord.totalAmount || ord.total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                    {items.slice(0, 5).map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1 shrink-0 flex items-center justify-center overflow-hidden"
                        title={`${item.title || item.name} (x${item.quantity || 1})`}
                      >
                        {item.image || item.imageUrl ? (
                          <img
                            src={item.image || item.imageUrl}
                            alt={item.title || 'Product'}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package size={20} className="text-slate-300" />
                        )}
                      </div>
                    ))}
                    {items.length > 5 && (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                        +{items.length - 5}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {items.length} {items.length === 1 ? 'item' : 'items'} • Payment: <span className="uppercase font-bold">{ord.paymentMethod || 'COD / Online'}</span>
                  </p>
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Delivery: {ord.deliveryAddress?.city || ord.deliveryAddress?.label || 'Direct Address'}
                  </span>
                  <Link
                    to={`/track-order?id=${ord._id || ord.orderNumber}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-[#00B074] hover:text-white text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    <span>Track Order</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default OrdersTab;
