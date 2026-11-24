import React from 'react';
import { ChevronRight, PackageCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ActiveOrderBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recentOrder, dismissRecentOrder, setIsCartOpen } = useCart();

  const hiddenRoute = location.pathname.startsWith('/admin')
    || location.pathname === '/login'
    || location.pathname === '/register'
    || location.pathname.startsWith('/track');

  if (!recentOrder || hiddenRoute) return null;

  const orderId = recentOrder.id || recentOrder.orderNumber;

  return (
    <aside className="fixed bottom-[76px] left-3 right-3 z-[45] mx-auto max-w-md border border-black bg-white text-slate-950 sm:bottom-5 sm:left-auto sm:right-5" aria-label="Active order">
      <button
        type="button"
        onClick={() => {
          setIsCartOpen(false);
          navigate(`/track-order${orderId ? `?id=${encodeURIComponent(orderId)}` : ''}`);
        }}
        className="flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#FFD400] text-black"><PackageCheck size={20} /></span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-black">Order {recentOrder.orderNumber || 'placed successfully'}</strong>
          <small className="mt-0.5 block text-[11px] font-semibold text-slate-600">Track packing and delivery status</small>
        </span>
        <ChevronRight size={18} className="shrink-0" />
      </button>
      <button
        type="button"
        onClick={dismissRecentOrder}
        aria-label="Dismiss order tracker"
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center border border-black bg-white"
      >
        <X size={13} />
      </button>
    </aside>
  );
};

export default ActiveOrderBar;
