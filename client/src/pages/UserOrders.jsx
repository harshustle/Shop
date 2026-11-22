import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock3, MapPin, Package, RefreshCw, ShoppingBag } from 'lucide-react';
import OrderStatusTracker, { getOrderStatusLabel, normalizeOrderStatus } from '../components/orders/OrderStatusTracker';
import { API_URL } from '../config';

const formatDate = (value) => value
  ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : 'Not available';

const UserOrders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(searchParams.get('id') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const phone = localStorage.getItem('userPhone') || '';

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!phone) {
      setError('Please sign in to view your orders.');
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/orders/user/${encodeURIComponent(phone)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Could not load your orders');
      const data = await response.json();
      const nextOrders = Array.isArray(data) ? data : [];
      setOrders(nextOrders);
      setError('');
      setSelectedOrderId((current) => current || nextOrders[0]?._id || nextOrders[0]?.orderNumber || '');
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load your orders');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    fetchOrders();
    const interval = window.setInterval(() => fetchOrders({ silent: true }), 20000);
    return () => window.clearInterval(interval);
  }, [fetchOrders]);

  const activeOrder = useMemo(() => orders.find((order) =>
    order._id === selectedOrderId || order.orderNumber === selectedOrderId
  ) || orders[0], [orders, selectedOrderId]);
  const status = activeOrder?.orderStatus || activeOrder?.status || 'pending';
  const normalizedStatus = normalizeOrderStatus(status);
  const products = activeOrder?.items?.length ? activeOrder.items : (activeOrder?.products || []);
  const address = activeOrder?.address || activeOrder?.deliveryAddress;
  const addressText = typeof address === 'string' ? address : [address?.street, address?.city, address?.state, address?.pincode].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen bg-[#F6F7FB] px-4 py-4 text-slate-900 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white" aria-label="Go back"><ArrowLeft size={18} /></button>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">Track your order</h1>
              <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500 sm:text-xs">Status refreshes automatically every 20 seconds.</p>
            </div>
          </div>
          <button onClick={() => fetchOrders()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white" aria-label="Refresh orders"><RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} /></button>
        </header>

        {error && <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
        {!isLoading && !error && orders.length === 0 && (
          <section className="border border-slate-200 bg-white p-10 text-center">
            <ShoppingBag className="mx-auto mb-3 text-slate-300" size={36} />
            <h2 className="font-black">No orders yet</h2>
            <p className="mt-1 text-sm text-slate-500">Your placed orders will appear here.</p>
            <button onClick={() => navigate('/shop')} className="mt-5 bg-[#635BFF] px-5 py-2.5 text-sm font-bold text-white">Start shopping</button>
          </section>
        )}

        {activeOrder && (
          <>
            {orders.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {orders.map((order) => {
                  const id = order._id || order.orderNumber;
                  return <button key={id} onClick={() => setSelectedOrderId(id)} className={`shrink-0 border px-4 py-2 text-xs font-bold ${id === (activeOrder._id || activeOrder.orderNumber) ? 'border-[#635BFF] bg-[#635BFF] text-white' : 'border-slate-200 bg-white'}`}>{order.orderNumber || `Order ${String(id).slice(-6)}`}</button>;
                })}
              </div>
            )}

            <section className="border border-slate-200 bg-white p-4 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order number</p>
                  <h2 className="mt-1 text-lg font-black">{activeOrder.orderNumber || String(activeOrder._id).slice(-8).toUpperCase()}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={13} /> Updated {formatDate(activeOrder.updatedAt)}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-black ${normalizedStatus === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-[#EFEBFF] text-[#635BFF]'}`}>{getOrderStatusLabel(status)}</span>
              </div>

              <div className="py-5"><OrderStatusTracker status={status} /></div>
              <div className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                <div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Current status</p><p className="mt-1 text-sm font-black">{getOrderStatusLabel(status)}</p></div>
                <div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Order total</p><p className="mt-1 text-sm font-black">₹{Number(activeOrder.totalAmount || activeOrder.pricing?.finalTotal || 0).toLocaleString('en-IN')}</p></div>
                <div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Items</p><p className="mt-1 text-sm font-black">{products.length} product{products.length === 1 ? '' : 's'}</p></div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="border border-slate-200 bg-white p-5">
                <h3 className="flex items-center gap-2 font-black"><Package size={18} /> Order items</h3>
                <div className="mt-4 space-y-3">
                  {products.map((item, index) => <div key={item._id || index} className="flex justify-between gap-3 border-b border-slate-100 pb-3 text-sm last:border-0"><span className="font-semibold">{item.productTitleSnapshot || item.productName || item.title || item.name || 'Product'}</span><span className="shrink-0 text-slate-500">× {item.quantity || 1}</span></div>)}
                </div>
              </div>
              <div className="border border-slate-200 bg-white p-5">
                <h3 className="flex items-center gap-2 font-black"><MapPin size={18} /> Delivery address</h3>
                <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{addressText || 'Delivery address is saved with your order.'}</p>
                {activeOrder.trackingNumber && <p className="mt-4 text-xs font-bold text-slate-500">Tracking: {activeOrder.trackingNumber}</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default UserOrders;
