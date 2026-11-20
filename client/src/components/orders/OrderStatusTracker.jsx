import React from 'react';
import { Check, Circle, PackageCheck, Truck, XCircle } from 'lucide-react';

export const ORDER_TRACKING_STEPS = [
  { key: 'pending', label: 'Order placed' },
  { key: 'processing', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' }
];

export const normalizeOrderStatus = (value) => {
  const status = String(value || 'pending').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (status === 'placed' || status === 'new') return 'pending';
  if (status === 'confirmed') return 'processing';
  if (status === 'shipped' || status === 'in_transit' || status === 'out_for_delivery') return 'out_for_delivery';
  return status;
};

export const getOrderStatusLabel = (value) => {
  const status = normalizeOrderStatus(value);
  if (status === 'cancelled') return 'Cancelled';
  return ORDER_TRACKING_STEPS.find((step) => step.key === status)?.label || 'Order placed';
};

const OrderStatusTracker = ({ status, compact = false }) => {
  const normalizedStatus = normalizeOrderStatus(status);
  const isCancelled = normalizedStatus === 'cancelled';
  const currentIndex = Math.max(0, ORDER_TRACKING_STEPS.findIndex((step) => step.key === normalizedStatus));

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
        <XCircle size={20} />
        <div>
          <p className="text-sm font-black">Order cancelled</p>
          <p className="text-xs font-medium text-rose-600">This order will not move to the next delivery stage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'py-2' : 'py-4'} aria-label={`Order status: ${getOrderStatusLabel(status)}`}>
      <div className="relative">
        <div className="absolute left-[10%] right-[10%] top-4 h-1 bg-slate-200" />
        <div
          className="absolute left-[10%] top-4 h-1 bg-[#635BFF] transition-all duration-500"
          style={{ width: `${(currentIndex / (ORDER_TRACKING_STEPS.length - 1)) * 80}%` }}
        />
        <ol className="relative grid grid-cols-5 gap-1">
          {ORDER_TRACKING_STEPS.map((step, index) => {
            const complete = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li key={step.key} className="flex min-w-0 flex-col items-center text-center">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${complete || current ? 'border-[#635BFF] bg-[#635BFF] text-white' : 'border-slate-200 bg-white text-slate-300'}`}>
                  {complete ? <Check size={17} strokeWidth={3} /> : current ? (step.key === 'out_for_delivery' ? <Truck size={17} /> : <PackageCheck size={17} />) : <Circle size={10} fill="currentColor" />}
                </span>
                <span className={`mt-2 text-[9px] font-bold leading-tight sm:text-[11px] ${current ? 'text-[#635BFF]' : complete ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default OrderStatusTracker;
