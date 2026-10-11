import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  Package, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Phone, 
  MapPin, 
  ChevronRight, 
  Maximize2,
  RefreshCw,
  Truck,
  Car
} from 'lucide-react';
import { API_URL } from '../config';

const UserOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phone, setPhone] = useState(localStorage.getItem('userPhone') || '');
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [phone]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      if (phone) {
        const res = await fetch(`${API_URL}/api/orders/user/${phone}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
            setIsLoading(false);
            return;
          }
        }
      }

      // Check localStorage for latest order
      const latest = localStorage.getItem('latestOrder');
      if (latest) {
        const parsed = JSON.parse(latest);
        setOrders([parsed]);
      } else {
        // Fallback demo order matching the reference UI
        setOrders([
          {
            orderNumber: 'ORD-20261011-8921',
            status: 'In Transit',
            orderStatus: 'shipped',
            totalAmount: 352,
            courierName: 'Liar Savehasalim',
            courierPhone: '+91 98765 43210',
            address: 'Street Golden 23/21, 7760',
            updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            products: [
              { productName: 'Air Max 270 React', price: 150, quantity: 1, color: 'Purple', size: 'M' },
              { productName: 'Hoodie Fleece Classic', price: 150, quantity: 1, color: 'Beige', size: 'M' }
            ]
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeOrder = orders[selectedOrderIndex] || orders[0] || {
    orderNumber: 'ORD-8921',
    status: 'In Transit',
    totalAmount: 352,
    courierName: 'Liar Savehasalim',
    address: 'Street Golden 23/21, 7760'
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-800 font-sans pb-28 pt-4 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-5">
        
        {/* Top Header: Back button + Title */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Order Tracking
            </h1>
          </div>

          <button
            onClick={fetchOrders}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
            title="Refresh status"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Horizontal Step Progress Bar */}
        <div className="pt-2 px-2">
          <div className="relative flex items-center justify-between">
            {/* Background track line */}
            <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-200 z-0" />
            {/* Active filled line */}
            <div className="absolute top-3 left-4 right-1/3 h-0.5 bg-[#635BFF] z-0 transition-all duration-500" />

            {/* Step 1: Order placed */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-xs">
                <Check size={13} strokeWidth={3} />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-2 tracking-tight">
                Order places
              </span>
            </div>

            {/* Step 2: Packed */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-xs">
                <Check size={13} strokeWidth={3} />
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-2 tracking-tight">
                Packed
              </span>
            </div>

            {/* Step 3: Shipped */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center border-2 border-white">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 mt-2 tracking-tight">
                Shippen
              </span>
            </div>
          </div>
        </div>

        {/* Stylized Vector Route Map Card */}
        <div className="relative w-full h-56 bg-[#F3F1FD] rounded-[28px] overflow-hidden border border-slate-100 shadow-sm">
          {/* Subtle Vector Street Grid (SVG) */}
          <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="street-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#D7D3F8" strokeWidth="2" />
                <path d="M 30 0 L 30 60 M 0 30 L 60 30" fill="none" stroke="#E4E1FC" strokeWidth="1" strokeDasharray="4 4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#street-grid)" />
            
            {/* Stylized Delivery Route Line */}
            <path 
              d="M 50 160 L 50 100 L 110 100 L 110 50 L 190 50 L 250 80 L 310 80" 
              fill="none" 
              stroke="#635BFF" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>

          {/* Destination Pin (Pink) */}
          <div className="absolute left-[42px] top-[148px] z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 rounded-full bg-[#EC4899] text-white flex items-center justify-center shadow-md animate-pulse">
              <MapPin size={13} strokeWidth={2.5} />
            </div>
          </div>

          {/* Delivery Car Marker Along Route (Magenta/Purple) */}
          <div className="absolute left-[180px] top-[40px] z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="px-2 py-1 rounded-md bg-[#EC4899] text-white shadow-md flex items-center gap-1 border border-white">
              <Car size={13} strokeWidth={2.5} />
            </div>
          </div>

          {/* Origin/Hub Marker */}
          <div className="absolute right-[45px] top-[75px] z-10">
            <div className="w-3.5 h-3.5 rounded-full bg-[#A855F7] border-2 border-white shadow-xs animate-ping" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#A855F7] border-2 border-white shadow-xs -mt-3.5" />
          </div>

          {/* Expand / Maximize map button on bottom right */}
          <button 
            onClick={() => navigate('/legacy')}
            className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-600 hover:text-slate-900 shadow-md flex items-center justify-center transition active:scale-95"
            title="Expand Map"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* 3 Status Metric Badges */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Status */}
          <div className="bg-white rounded-[24px] p-3.5 border border-slate-100/90 shadow-xs flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#D1FAE5] text-[#059669] flex items-center justify-center mb-2 shadow-2xs">
              <Package size={20} />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Status</span>
            <span className="text-xs font-black text-slate-900 mt-0.5 tracking-tight truncate w-full">
              In Transit
            </span>
          </div>

          {/* Card 2: Delivery Date */}
          <div className="bg-white rounded-[24px] p-3.5 border border-slate-100/90 shadow-xs flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-2 shadow-2xs">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Delivery date</span>
            <span className="text-xs font-black text-slate-900 mt-0.5 tracking-tight truncate w-full">
              In Transit
            </span>
          </div>

          {/* Card 3: Updated */}
          <div className="bg-white rounded-[24px] p-3.5 border border-slate-100/90 shadow-xs flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mb-2 shadow-2xs">
              <Clock size={20} />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Updated</span>
            <span className="text-xs font-black text-slate-900 mt-0.5 tracking-tight truncate w-full">
              2 min ago
            </span>
          </div>
        </div>

        {/* Courier Driver Card */}
        <div className="bg-[#F3F4F8] rounded-[24px] p-3.5 flex items-center justify-between border border-slate-100/80 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Courier Avatar */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Courier Driver"
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            <div>
              <p className="text-[11px] text-slate-400 font-bold">Your courier</p>
              <h4 className="text-xs font-black text-slate-900 tracking-tight">
                {activeOrder.courierName || 'Liar Savehasalim'}
              </h4>
            </div>
          </div>

          {/* Action Buttons: Message and Phone */}
          <div className="flex items-center gap-2">
            <a
              href={`sms:${activeOrder.courierPhone || '9876543210'}`}
              className="w-8 h-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center hover:bg-slate-900 transition active:scale-95 shadow-xs"
              title="Send Message"
            >
              <MessageSquare size={13} fill="white" />
            </a>
            <a
              href={`tel:${activeOrder.courierPhone || '9876543210'}`}
              className="w-8 h-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center hover:bg-slate-900 transition active:scale-95 shadow-xs"
              title="Call Courier"
            >
              <Phone size={13} fill="white" />
            </a>
          </div>
        </div>

        {/* Live Location Order Footer Pill */}
        <div 
          onClick={() => navigate('/shop')}
          className="bg-white rounded-full px-5 py-3.5 border border-slate-100/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#635BFF]/30 transition group"
        >
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-slate-900" />
            <span className="text-xs font-bold text-slate-900">
              Live Location <span className="text-[#635BFF] underline underline-offset-2">Order</span>
            </span>
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-[#635BFF] group-hover:text-white transition">
            <ChevronRight size={15} strokeWidth={2.5} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserOrders;
