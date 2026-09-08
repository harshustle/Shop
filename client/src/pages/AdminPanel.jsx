import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  X, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Lock, 
  Save, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Layers,
  Building,
  Radio,
  Wheat,
  Activity,
  Flame,
  UserCheck,
  Tag,
  MessageSquare,
  Image as ImageIcon,
  Star
} from 'lucide-react';
import { API_URL } from '../config';

const AdminPanel = () => {
  const navigate = useNavigate();

  // Active navigation tab
  // 'dashboard' | 'orders' | 'inventory' | 'customers' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Global search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Dropdown selectors in dashboard
  const [splineTimeframe, setSplineTimeframe] = useState('Weekly');
  const [donutTimeframe, setDonutTimeframe] = useState('Monthly');
  const [topProductsTimeframe, setTopProductsTimeframe] = useState('Monthly');

  // Backend Data States
  const [metrics, setMetrics] = useState({
    adminName: localStorage.getItem('fullName') || 'Harsh Srivastava',
    adminEmail: localStorage.getItem('adminEmail') || 'admin@freshcart.com',
    adminPhone: localStorage.getItem('adminPhone') || localStorage.getItem('userPhone') || '9161955178',
    adminRole: 'Super Admin',
    totalRevenue: 24582,
    revenueGrowth: '18.2% this week',
    totalOrders: 3842,
    ordersGrowth: '12.5% this week',
    totalProducts: 1247,
    productsGrowth: '2.3% this week',
    totalCustomers: 8234,
    customersGrowth: '24.6% this week',
    pendingOrders: 0,
    packedOrders: 0,
    deliveredOrders: 0,
    activeDispatches: 0,
    lowStockCount: 0,
    weeklySalesTotal: '$18,200.82',
    weeklyGrowth: '8.24%',
    weeklySpline: [
      { day: 'MON', value: 4380, label: '$4,380' },
      { day: 'TUE', value: 4490, label: '$4,490' },
      { day: 'WED', value: 4560, label: '$4,560' },
      { day: 'THU', value: 4520, label: '$4,520' },
      { day: 'FRI', value: 4645.80, label: '$4,645.80', isPeak: true },
      { day: 'SAT', value: 4480, label: '$4,480' },
      { day: 'SUN', value: 4510, label: '$4,510' }
    ],
    donutScore: '16,100',
    donutGrowth: '+45%',
    donutTotalSales: '3,40,0031',
    categoryDistribution: {
      dairy: { name: 'Dairy', count: 25500, color: '#3B82F6', percent: 25 },
      fruits: { name: 'Fruits', count: 34000, color: '#00B074', percent: 33 },
      vegetables: { name: 'Vegetables', count: 25600, color: '#10B981', percent: 25 },
      meat: { name: 'Meat', count: 17000, color: '#94A3B8', percent: 17 }
    },
    topProducts: [
      { title: 'Fresh Milk', soldCount: 342, revenue: 684.00, image: '🥛' },
      { title: 'Wheat Bread', soldCount: 256, revenue: 512.00, image: '🍞' },
      { title: 'Emerald Velvet', soldCount: 189, revenue: 355.90, image: '🍏' },
      { title: 'Rang Eggs', soldCount: 172, revenue: 298.40, image: '🥚' },
      { title: 'Organic Broccoli', soldCount: 145, revenue: 210.30, image: '🥦' }
    ],
    recentOrders: [
      { id: '1', orderNumber: '#1001', productName: 'Fresh Dairy', date: 'May 5', status: 'Received', price: '145.80', customer: 'M-Starlight', image: '🥛' },
      { id: '2', orderNumber: '#1002', productName: 'Vegetables', date: 'May 4', status: 'Received', price: '210.30', customer: 'Serene W', image: '🥦' },
      { id: '3', orderNumber: '#1003', productName: 'Rang Eggs', date: 'May 3', status: 'Received', price: '298.40', customer: 'James D', image: '🥚' }
    ]
  });

  const [ordersList, setOrdersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [alertsList, setAlertsList] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [bannersList, setBannersList] = useState([]);

  // Modals
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 299,
    maxDiscountAmount: 150,
    usageLimit: 100,
    description: ''
  });

  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [newBannerForm, setNewBannerForm] = useState({
    title: '',
    subtitle: '',
    badgeText: 'Limited Offer',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    backgroundColor: '#00B074'
  });

  // Dynamic Avatar Initials Generator
  const getInitials = (name) => {
    if (!name || name === 'Super Admin') return 'SA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Profile / Settings form
  const [profileForm, setProfileForm] = useState(() => ({
    fullName: localStorage.getItem('fullName') || 'Harsh Srivastava',
    email: localStorage.getItem('adminEmail') || 'admin@freshcart.com',
    phone: localStorage.getItem('adminPhone') || localStorage.getItem('userPhone') || '9161955178',
    currentPassword: '',
    newPassword: ''
  }));
  const [settingsNotice, setSettingsNotice] = useState({ type: '', text: '' });

  // Add product form
  const [newProduct, setNewProduct] = useState({
    title: '',
    brand: '',
    categoryName: 'Fresh Produce',
    basePrice: '',
    stockQuantity: 50,
    description: ''
  });

  // Token helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch initial dashboard & table data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Aggregated Metrics
      const metricsRes = await fetch(`${API_URL}/api/admin/metrics`, {
        headers: getAuthHeaders()
      });
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(prev => ({
          ...prev,
          ...metricsData
        }));
        if (metricsData.adminName) localStorage.setItem('fullName', metricsData.adminName);
        if (metricsData.adminEmail) {
          localStorage.setItem('adminEmail', metricsData.adminEmail);
          localStorage.setItem('userEmail', metricsData.adminEmail);
        }
        if (metricsData.adminPhone) {
          localStorage.setItem('adminPhone', metricsData.adminPhone);
          localStorage.setItem('userPhone', metricsData.adminPhone);
        }
        setProfileForm(p => ({
          ...p,
          fullName: metricsData.adminName || localStorage.getItem('fullName') || 'Harsh Srivastava',
          email: metricsData.adminEmail || localStorage.getItem('adminEmail') || 'admin@freshcart.com',
          phone: metricsData.adminPhone || localStorage.getItem('userPhone') || '9161955178'
        }));
      }

      // 2. Fetch Orders
      const ordersRes = await fetch(`${API_URL}/api/orders`, {
        headers: getAuthHeaders()
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrdersList(Array.isArray(ordersData) ? ordersData : []);
      }

      // 3. Fetch Products
      const productsRes = await fetch(`${API_URL}/api/catalog/search?limit=100`, {
        headers: getAuthHeaders()
      });
      if (productsRes.ok) {
        const prodData = await productsRes.json();
        setProductsList(prodData.products || []);
      }

      // 4. Fetch Customers
      const custRes = await fetch(`${API_URL}/api/admin/customers`, {
        headers: getAuthHeaders()
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomersList(Array.isArray(custData) ? custData : []);
      }

      // 5. Fetch Inventory Low Stock Alerts
      const alertsRes = await fetch(`${API_URL}/api/inventory/alerts`, {
        headers: getAuthHeaders()
      });
      if (alertsRes.ok) {
        const alertData = await alertsRes.json();
        setAlertsList(Array.isArray(alertData) ? alertData : []);
      }

      // 6. Fetch Coupons
      const couponsRes = await fetch(`${API_URL}/api/coupons/admin`, {
        headers: getAuthHeaders()
      });
      if (couponsRes.ok) {
        const cData = await couponsRes.json();
        setCouponsList(Array.isArray(cData) ? cData : []);
      }

      // 7. Fetch Reviews
      const reviewsRes = await fetch(`${API_URL}/api/reviews/admin`, {
        headers: getAuthHeaders()
      });
      if (reviewsRes.ok) {
        const rData = await reviewsRes.json();
        setReviewsList(Array.isArray(rData) ? rData : []);
      }

      // 8. Fetch Banners
      const bannersRes = await fetch(`${API_URL}/api/banners/admin`, {
        headers: getAuthHeaders()
      });
      if (bannersRes.ok) {
        const bData = await bannersRes.json();
        setBannersList(Array.isArray(bData) ? bData : []);
      }

    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUserSync = () => {
      const storedName = localStorage.getItem('fullName');
      const storedEmail = localStorage.getItem('adminEmail') || localStorage.getItem('userEmail');
      const storedPhone = localStorage.getItem('adminPhone') || localStorage.getItem('userPhone');
      if (storedName || storedEmail) {
        setMetrics(m => ({
          ...m,
          adminName: storedName || m.adminName,
          adminEmail: storedEmail || m.adminEmail,
          adminPhone: storedPhone || m.adminPhone
        }));
      }
    };
    window.addEventListener('storage', handleUserSync);
    window.addEventListener('freshcart-user-updated', handleUserSync);
    return () => {
      window.removeEventListener('storage', handleUserSync);
      window.removeEventListener('freshcart-user-updated', handleUserSync);
    };
  }, []);

  // Secure Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminPhone');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('freshcart-user-updated'));
    navigate('/login', { replace: true });
  };

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  // 1-Click In-House Delivery Fleet Dispatch
  const handleDispatchFleet = async (orderId) => {
    const rider = prompt('Enter Delivery Fleet Rider Name:', 'Express Rider');
    if (!rider) return;
    const vehicle = prompt('Enter Vehicle / Bike Number:', 'Fleet Van 01') || 'Fleet Van 01';

    try {
      const res = await fetch(`${API_URL}/api/v1/logistics/dispatch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          orderId,
          riderName: rider,
          vehicleNumber: vehicle
        })
      });
      if (res.ok) {
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Dispatch failed');
      }
    } catch (err) {
      console.error('Dispatch error', err);
    }
  };

  // Open Printable Shipping Slip for Rider
  const handlePrintLabel = (orderId) => {
    window.open(`${API_URL}/api/v1/logistics/label/${orderId}`, '_blank', 'width=450,height=650');
  };

  // Quick Restock Handler
  const handleQuickRestock = async (variantId, addedQty = 50) => {
    try {
      const res = await fetch(`${API_URL}/api/catalog/variants/${variantId}/stock`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ addedQuantity: addedQty })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Restock error', err);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to remove this user account?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setCustomersList(prev => prev.filter(c => c._id !== customerId));
      }
    } catch (err) {
      console.error('Delete customer error', err);
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/coupons/admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCouponForm)
      });
      if (res.ok) {
        setShowAddCouponModal(false);
        setNewCouponForm({
          code: '',
          discountType: 'percentage',
          discountValue: 20,
          minOrderAmount: 299,
          maxDiscountAmount: 150,
          usageLimit: 100,
          description: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error('Create coupon error:', err);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`${API_URL}/api/coupons/admin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Delete coupon error:', err);
    }
  };

  // Review Moderation Handlers
  const handleUpdateReviewStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/admin/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Update review error:', err);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this customer review permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/admin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  // Banner Handlers
  const handleCreateBanner = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/banners/admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newBannerForm)
      });
      if (res.ok) {
        setShowAddBannerModal(false);
        setNewBannerForm({
          title: '',
          subtitle: '',
          badgeText: 'Limited Offer',
          ctaText: 'Shop Now',
          ctaLink: '/shop',
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
          backgroundColor: '#00B074'
        });
        fetchData();
      }
    } catch (err) {
      console.error('Create banner error:', err);
    }
  };

  const handleToggleBanner = async (id, isActive) => {
    try {
      const res = await fetch(`${API_URL}/api/banners/admin/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !isActive })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Toggle banner error:', err);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this banner from storefront?')) return;
    try {
      const res = await fetch(`${API_URL}/api/banners/admin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Delete banner error:', err);
    }
  };

  // Update Profile & Password
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsNotice({ type: '', text: '' });
    try {
      // Update Info
      const res = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email,
          phone: profileForm.phone
        })
      });

      // Update Password if filled
      if (profileForm.newPassword) {
        const passRes = await fetch(`${API_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            currentPassword: profileForm.currentPassword,
            newPassword: profileForm.newPassword
          })
        });
        if (!passRes.ok) {
          const passData = await passRes.json();
          setSettingsNotice({ type: 'error', text: passData.error || 'Failed to change password' });
          return;
        }
      }

      if (res.ok) {
        let updatedName = profileForm.fullName;
        let updatedEmail = profileForm.email;
        let updatedPhone = profileForm.phone;
        try {
          const data = await res.json();
          if (data.user) {
            updatedName = data.user.fullName || updatedName;
            updatedEmail = data.user.email || updatedEmail;
            updatedPhone = data.user.phone || updatedPhone;
          }
        } catch (e) {}

        setSettingsNotice({ type: 'success', text: 'Super Admin profile updated successfully!' });
        localStorage.setItem('fullName', updatedName);
        localStorage.setItem('adminEmail', updatedEmail);
        localStorage.setItem('userEmail', updatedEmail);
        localStorage.setItem('adminPhone', updatedPhone);
        localStorage.setItem('userPhone', updatedPhone);

        setMetrics(m => ({
          ...m,
          adminName: updatedName,
          adminEmail: updatedEmail,
          adminPhone: updatedPhone
        }));

        setProfileForm(p => ({
          ...p,
          fullName: updatedName,
          email: updatedEmail,
          phone: updatedPhone,
          currentPassword: '',
          newPassword: ''
        }));

        // Broadcast to all application listeners & tabs
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('freshcart-user-updated', {
          detail: { fullName: updatedName, email: updatedEmail, phone: updatedPhone }
        }));
      } else {
        const errData = await res.json().catch(() => ({}));
        setSettingsNotice({ type: 'error', text: errData.error || 'Failed to update profile' });
      }
    } catch (err) {
      setSettingsNotice({ type: 'error', text: 'Server communication failed' });
    }
  };

  // Create Product Handler
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const slug = newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await fetch(`${API_URL}/api/catalog/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newProduct.title,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          brand: newProduct.brand || 'FreshCart Select',
          categoryName: newProduct.categoryName,
          basePrice: Number(newProduct.basePrice) || 99,
          description: newProduct.description,
          variants: [
            {
              sku: `FC-${Date.now().toString().slice(-6)}`,
              price: Number(newProduct.basePrice) || 99,
              stockQuantity: Number(newProduct.stockQuantity) || 50
            }
          ]
        })
      });

      if (res.ok) {
        setShowAddProductModal(false);
        setNewProduct({
          title: '',
          brand: '',
          categoryName: 'Fresh Produce',
          basePrice: '',
          stockQuantity: 50,
          description: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error('Create product error', err);
    }
  };

  // Filtered orders and products based on topbar search
  const filteredOrders = useMemo(() => {
    return ordersList.filter(o => {
      const matchSearch = searchQuery === '' || 
        (o.orderNumber && o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.phoneNumber && o.phoneNumber.includes(searchQuery));
      const matchStatus = orderStatusFilter === 'all' || (o.status || o.orderStatus) === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [ordersList, searchQuery, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      return searchQuery === '' ||
        (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [productsList, searchQuery]);

  const filteredCustomers = useMemo(() => {
    return customersList.filter(c => {
      return searchQuery === '' ||
        (c.fullName && c.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [customersList, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 flex font-sans antialiased">

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (FreshCart Brand & Navigation)                             */}
      {/* ========================================================================= */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-5 shrink-0 select-none">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#00B074] flex items-center justify-center text-white shadow-md shadow-[#00B074]/30">
              <ShoppingBag size={22} strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">FreshCart</h1>
              <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase mt-1 inline-block">
                Super Admin
              </span>
            </div>
          </div>

          {/* Group 1: MAIN */}
          <div className="mb-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main</p>
            <nav className="space-y-1">
              {/* Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'dashboard' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                  <LayoutDashboard size={18} />
                </div>
                <span>Dashboard</span>
              </button>

              {/* Orders */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'orders' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                    <ShoppingCart size={18} />
                  </div>
                  <span>Orders</span>
                </div>
                {metrics.pendingOrders > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-black bg-rose-500 text-white rounded-full">
                    {metrics.pendingOrders}
                  </span>
                )}
              </button>

              {/* Inventory */}
              <button
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'inventory'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'inventory' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                    <Package size={18} />
                  </div>
                  <span>Inventory</span>
                </div>
                {metrics.lowStockCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-black bg-amber-500 text-white rounded-full">
                    {metrics.lowStockCount}
                  </span>
                )}
              </button>

              {/* Customers */}
              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'customers'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'customers' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                  <Users size={18} />
                </div>
                <span>Customers</span>
              </button>

              {/* Coupons & Promo Codes */}
              <button
                onClick={() => setActiveTab('coupons')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'coupons'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'coupons' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                    <Tag size={18} />
                  </div>
                  <span>Coupons & Promo</span>
                </div>
                {couponsList.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-[#E8F8F0] text-[#00B074] rounded-full">
                    {couponsList.length}
                  </span>
                )}
              </button>

              {/* Reviews & Ratings */}
              <button
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'reviews' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                    <MessageSquare size={18} />
                  </div>
                  <span>Customer Reviews</span>
                </div>
                {reviewsList.filter(r => r.status === 'pending').length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full">
                    {reviewsList.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Store Banners */}
              <button
                onClick={() => setActiveTab('banners')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'banners'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'banners' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                  <ImageIcon size={18} />
                </div>
                <span>Hero Banners</span>
              </button>

              {/* Reports & Analytics */}
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'reports'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'reports' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                  <BarChart3 size={18} />
                </div>
                <span>Reports & Analytics</span>
              </button>
            </nav>
          </div>

          {/* Group 2: OTHER */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Other</p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'settings' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                  <Settings size={18} />
                </div>
                <span>Settings</span>
              </button>

              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <div className="w-5 h-5 flex items-center justify-center text-slate-400">
                  <HelpCircle size={18} />
                </div>
                <span>Help/Support</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
              >
                <div className="w-5 h-5 flex items-center justify-center text-rose-500">
                  <LogOut size={18} />
                </div>
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Promo Card: "Need Help? Contact support team" */}
        <div className="mt-6 p-4 rounded-3xl bg-gradient-to-br from-[#E2F7ED] via-[#D1F2E2] to-[#B9ECCE] border border-[#A5E5C4] relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-[#00B074]/10 blur-md pointer-events-none" />
          <h4 className="text-sm font-black text-slate-900 leading-snug">Need Help?</h4>
          <p className="text-xs text-slate-600 font-medium mt-0.5 mb-3.5 leading-relaxed">
            Contact support team
          </p>
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="w-full py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>Get Support</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* TOP BAR HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Dashboard Overview</h2>
            <p className="text-xs text-slate-500 font-medium">Welcome back! Your grocery store's performance view</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, orders, products..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
              >
                <Bell size={18} />
                {(metrics.lowStockCount > 0 || metrics.pendingOrders > 0) && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDrawer && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900">Notifications & Alerts</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {metrics.lowStockCount > 0 ? (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">{metrics.lowStockCount} Products Low on Stock</p>
                          <p className="text-[11px] text-amber-700">Safety thresholds breached in inventory</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-emerald-900">All inventory levels healthy</p>
                      </div>
                    )}

                    {metrics.pendingOrders > 0 && (
                      <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-2.5">
                        <Clock size={15} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-rose-900">{metrics.pendingOrders} Orders Awaiting Packing</p>
                          <p className="text-[11px] text-rose-700">Fulfill now for on-time delivery</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile User Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-tight">
                  {getInitials(metrics.adminName || localStorage.getItem('fullName') || 'Super Admin')}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {metrics.adminName || localStorage.getItem('fullName') || 'Super Admin'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {metrics.adminEmail || localStorage.getItem('adminEmail') || 'admin@freshcart.com'}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400 ml-1" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {metrics.adminName || localStorage.getItem('fullName') || 'Super Admin'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {metrics.adminEmail || localStorage.getItem('adminEmail') || metrics.adminPhone || 'admin@freshcart.com'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={14} />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => { setShowSupportModal(true); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <HelpCircle size={14} />
                    <span>Support Desk</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ===================================================================== */}
        {/* VIEW 1: FRESH CART DASHBOARD OVERVIEW (Exact replica of screenshot)     */}
        {/* ===================================================================== */}
        {activeTab === 'dashboard' && (
          <main className="p-8 space-y-6">

            {/* TOP 4 METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Total Revenue (Featured Green Card) */}
              <div className="bg-[#00B074] text-white p-5 rounded-3xl shadow-lg shadow-[#00B074]/20 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white text-[#00B074] flex items-center justify-center font-black text-sm">
                        $
                      </div>
                      <span className="text-xs font-bold text-white/90">Total Revenue</span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">
                    ${Number(metrics.totalRevenue).toLocaleString()}
                  </h3>
                </div>

                {/* White Sparkline Wave SVG */}
                <div className="my-3 h-8">
                  <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                    <path
                      d="M 0,25 Q 30,10 60,25 T 120,20 T 160,8 T 200,18"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <p className="text-[11px] font-bold text-emerald-100 flex items-center gap-1">
                  <span>↑ 18.2% this week</span>
                </p>
              </div>

              {/* Card 2: Total Orders */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShoppingCart size={15} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">Total Orders</span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {Number(metrics.totalOrders).toLocaleString()}
                  </h3>
                </div>

                {/* Blue Sparkline Wave */}
                <div className="my-3 h-8">
                  <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                    <path
                      d="M 0,30 Q 30,20 70,30 T 130,15 T 170,25 T 200,10"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <p className="text-[11px] font-bold text-[#00B074] flex items-center gap-1">
                  <span>↑ 12.5% this week</span>
                </p>
              </div>

              {/* Card 3: Total Product */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Package size={15} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">Total Product</span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {Number(metrics.totalProducts).toLocaleString()}
                  </h3>
                </div>

                {/* Purple Sparkline Wave */}
                <div className="my-3 h-8">
                  <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                    <path
                      d="M 0,15 Q 40,32 80,18 T 140,28 T 170,10 T 200,22"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <span>↓ 2.3% this week</span>
                </p>
              </div>

              {/* Card 4: Active Customers */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Users size={15} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">Active Customers</span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {Number(metrics.totalCustomers).toLocaleString()}
                  </h3>
                </div>

                {/* Emerald Sparkline Wave */}
                <div className="my-3 h-8">
                  <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                    <path
                      d="M 0,28 Q 30,12 70,25 T 130,22 T 160,8 T 200,16"
                      fill="none"
                      stroke="#00B074"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <p className="text-[11px] font-bold text-[#00B074] flex items-center gap-1">
                  <span>↑ 24.6% this week</span>
                </p>
              </div>

            </div>

            {/* MIDDLE SECTION: CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Chart: Sales By Category Spline Wave Area Chart */}
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Sales By Category</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-black text-slate-900">{metrics.weeklySalesTotal}</span>
                      <span className="px-2 py-0.5 bg-[#E8F8F0] text-[#00B074] text-xs font-black rounded-full flex items-center gap-0.5">
                        <TrendingUp size={12} />
                        <span>{metrics.weeklyGrowth}</span>
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={splineTimeframe}
                      onChange={(e) => setSplineTimeframe(e.target.value)}
                      className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
                    >
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                    </select>
                  </div>
                </div>

                {/* Interactive SVG Spline Area Chart with Friday Highlight */}
                <div className="relative h-64 w-full pt-4">
                  {/* Grid Lines & Ticks */}
                  <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-semibold">
                    <div className="border-b border-dashed border-slate-100 pb-1">$4,700</div>
                    <div className="border-b border-dashed border-slate-100 pb-1">$4,600</div>
                    <div className="border-b border-dashed border-slate-100 pb-1">$4,500</div>
                    <div className="border-b border-dashed border-slate-100 pb-1">$4,400</div>
                    <div className="border-b border-slate-100 pb-1">$0</div>
                  </div>

                  {/* Friday Highlight Pillar */}
                  <div className="absolute left-[62%] top-6 bottom-8 w-16 bg-gradient-to-t from-[#00B074] to-[#00B074]/30 rounded-2xl flex flex-col justify-between items-center py-2 pointer-events-none shadow-sm shadow-[#00B074]/20">
                    <div className="bg-[#00B074] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md whitespace-nowrap -mt-6">
                      $4,645.80
                    </div>
                    <span className="text-white text-[10px] font-black uppercase">FRI</span>
                  </div>

                  {/* Bezier Area Graph */}
                  <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="splineGreenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00B074" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00B074" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fill */}
                    <path
                      d="M 20,160 Q 100,140 180,110 T 350,90 T 460,50 T 570,120 T 680,100 L 680,190 L 20,190 Z"
                      fill="url(#splineGreenGrad)"
                    />

                    {/* Spline Line */}
                    <path
                      d="M 20,160 Q 100,140 180,110 T 350,90 T 460,50 T 570,120 T 680,100"
                      fill="none"
                      stroke="#00B074"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Peak Marker Dot */}
                    <circle cx="460" cy="50" r="6" fill="#00B074" stroke="white" strokeWidth="3" />
                  </svg>

                  {/* X-Axis Days */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between px-4 text-[11px] font-bold text-slate-400">
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WEB</span>
                    <span>THU</span>
                    <span className="text-[#00B074] font-black">FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>
                  </div>
                </div>
              </div>

              {/* Right Chart: Sales By Category Donut Ring Chart */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-slate-900">Sales By Category</h4>
                  <select
                    value={donutTimeframe}
                    onChange={(e) => setDonutTimeframe(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
                  >
                    <option>Monthly</option>
                    <option>Weekly</option>
                  </select>
                </div>

                {/* Donut Graphic */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-48 h-48 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Segment 1: Fruits 35% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#00B074"
                        strokeWidth="12"
                        strokeDasharray="83 238"
                        strokeDashoffset="0"
                      />
                      {/* Segment 2: Dairy 25% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#34D399"
                        strokeWidth="12"
                        strokeDasharray="60 238"
                        strokeDashoffset="-88"
                      />
                      {/* Segment 3: Vegetables 25% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#6EE7B7"
                        strokeWidth="12"
                        strokeDasharray="55 238"
                        strokeDashoffset="-152"
                      />
                      {/* Segment 4: Meat 15% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#E2E8F0"
                        strokeWidth="12"
                        strokeDasharray="30 238"
                        strokeDashoffset="-210"
                      />
                    </svg>

                    {/* Center Ring Badge */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-slate-900 leading-none">{metrics.donutScore}</span>
                      <span className="mt-1 px-2 py-0.5 bg-[#E8F8F0] text-[#00B074] text-[10px] font-black rounded-full">
                        {metrics.donutGrowth}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown Items */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="font-semibold text-slate-600">Dairy</span>
                    </div>
                    <span className="font-black text-slate-900">25,500</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00B074]" />
                      <span className="font-semibold text-slate-600">Fruits</span>
                    </div>
                    <span className="font-black text-slate-900">34,000</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                      <span className="font-semibold text-slate-600">Vegetables</span>
                    </div>
                    <span className="font-black text-slate-900">25,600</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="font-semibold text-slate-600">Meat</span>
                    </div>
                    <span className="font-black text-slate-900">17,000</span>
                  </div>
                </div>

                {/* Total Number of Sales Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Number of Sales</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{metrics.donutTotalSales}</p>
                </div>
              </div>

            </div>

            {/* BOTTOM SECTION: TOP PRODUCTS & RECENT ORDERS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: Top Products List */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-slate-900">Top Products</h4>
                  <select
                    value={topProductsTimeframe}
                    onChange={(e) => setTopProductsTimeframe(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
                  >
                    <option>Monthly</option>
                    <option>Weekly</option>
                    <option>All Time</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {metrics.topProducts.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
                          {prod.image || '🛒'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{prod.title}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{prod.soldCount} sold</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        ${Number(prod.revenue).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Recent Order Table */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-slate-900">Recent Order</h4>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"
                  >
                    <Filter size={13} />
                    <span>Filter</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                        <th className="pb-3 font-bold">#</th>
                        <th className="pb-3 font-bold">Product</th>
                        <th className="pb-3 font-bold">Date</th>
                        <th className="pb-3 font-bold">Status</th>
                        <th className="pb-3 font-bold">Price</th>
                        <th className="pb-3 font-bold">Customer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {metrics.recentOrders.map((ord, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-2.5 font-bold text-slate-900">
                              <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-sm">
                                {ord.image || '🛍️'}
                              </span>
                              <span>{ord.productName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-500 font-medium">{ord.date}</td>
                          <td className="py-3.5">
                            <span className="px-2.5 py-1 bg-[#E8F8F0] text-[#00B074] rounded-full font-black text-[10px]">
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 font-black text-slate-900">${ord.price}</td>
                          <td className="py-3.5 text-slate-600 font-semibold">{ord.customer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: FULL ORDERS MANAGEMENT VIEW                                   */}
        {/* ===================================================================== */}
        {activeTab === 'orders' && (
          <main className="p-8 space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Live Order Fulfillment</h3>
                <p className="text-xs text-slate-500 font-medium">Manage pending dispatches and customer shipments</p>
              </div>

              <div className="flex items-center gap-2">
                {['all', 'pending', 'packed', 'delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      orderStatusFilter === st
                        ? 'bg-[#00B074] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">Order #</th>
                      <th className="p-4">Customer & Phone</th>
                      <th className="p-4">Items Summary</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                          No orders match the current filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord._id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-black text-slate-900">
                            <div>{ord.orderNumber}</div>
                            {ord.shippingLogistics?.awbCode && (
                              <span className="text-[10px] font-mono text-[#00B074] bg-[#E8F8F0] px-1.5 py-0.5 rounded font-bold">
                                {ord.shippingLogistics.awbCode}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{ord.customerName}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{ord.phoneNumber}</p>
                            {ord.shippingLogistics?.riderName && (
                              <p className="text-[10px] text-slate-500 font-medium">
                                🛵 {ord.shippingLogistics.riderName}
                              </p>
                            )}
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            {ord.items && ord.items.length > 0
                              ? `${ord.items[0].productTitleSnapshot} ${ord.items.length > 1 ? `(+${ord.items.length - 1} more)` : ''}`
                              : (ord.products && ord.products.length > 0 ? ord.products[0].productName : 'Grocery items')}
                          </td>
                          <td className="p-4 font-black text-slate-900">
                            ₹{Number(ord.totalAmount || ord.subtotal || 0).toFixed(2)}
                            <span className="block text-[10px] uppercase font-bold text-slate-400">
                              {ord.paymentMethod || 'COD'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              (ord.status || ord.orderStatus) === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : (ord.status || ord.orderStatus) === 'packed'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {ord.status || ord.orderStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                              <button
                                onClick={() => handlePrintLabel(ord._id)}
                                title="Print Rider Shipping Slip"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] transition"
                              >
                                🖨️ Label
                              </button>

                              {(ord.status || ord.orderStatus) !== 'delivered' && (
                                <button
                                  onClick={() => handleDispatchFleet(ord._id)}
                                  title="Assign in-house delivery rider"
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px] transition"
                                >
                                  🛵 Dispatch
                                </button>
                              )}

                              {(ord.status || ord.orderStatus) === 'pending' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord._id, 'packed')}
                                  className="px-2.5 py-1 bg-[#00B074] hover:bg-[#009663] text-white rounded-lg font-bold text-[11px] transition"
                                >
                                  Mark Packed
                                </button>
                              )}
                              {(ord.status || ord.orderStatus) === 'packed' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord._id, 'delivered')}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition"
                                >
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 3: INVENTORY & CATALOG VIEW                                      */}
        {/* ===================================================================== */}
        {activeTab === 'inventory' && (
          <main className="p-8 space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Inventory & Catalog</h3>
                <p className="text-xs text-slate-500 font-medium">Manage grocery products, stock quotas, and low-inventory alerts</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Low stock alerts banner */}
            {alertsList.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-600" />
                  <div>
                    <h5 className="text-xs font-black text-amber-900">Low Stock Warning</h5>
                    <p className="text-[11px] text-amber-700">{alertsList.length} items require immediate restocking.</p>
                  </div>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold"
                >
                  Refresh Alerts
                </button>
              </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">Product Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                          No products found in catalog. Click "Add New Product" to populate items.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const variant = (p.variants && p.variants[0]) || {};
                        const stock = variant.stockQuantity !== undefined ? variant.stockQuantity : 45;
                        const isLow = stock < (variant.safetyStock || 10);
                        return (
                          <tr key={p._id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-bold text-slate-900">
                              <p>{p.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{variant.sku || 'SKU-GEN'}</span>
                            </td>
                            <td className="p-4 text-slate-600 font-medium">{p.categoryName || 'General'}</td>
                            <td className="p-4 font-black text-slate-900">₹{p.basePrice || variant.price || 0}</td>
                            <td className="p-4">
                              <span className={`font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                                {stock} units
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isLow ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {isLow ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {variant._id && (
                                <button
                                  onClick={() => handleQuickRestock(variant._id, 50)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-[#00B074] rounded-lg font-bold text-[11px] transition text-slate-600 inline-flex items-center gap-1"
                                >
                                  <RefreshCw size={12} />
                                  <span>+50 Qty</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 4: CUSTOMERS MANAGEMENT VIEW                                     */}
        {/* ===================================================================== */}
        {activeTab === 'customers' && (
          <main className="p-8 space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Customer & Buyer Accounts</h3>
                <p className="text-xs text-slate-500 font-medium">Inspect registered users, spend metrics, and accounts</p>
              </div>
              <span className="px-3 py-1.5 bg-[#E8F8F0] text-[#00B074] text-xs font-black rounded-xl">
                {customersList.length} Active Buyers
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4">Lifetime Spend</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust._id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                {cust.fullName ? cust.fullName[0] : 'U'}
                              </div>
                              <span>{cust.fullName}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-600">{cust.phone}</td>
                          <td className="p-4 font-medium text-slate-500">{cust.email}</td>
                          <td className="p-4 font-bold text-slate-900">{cust.ordersCount || 0}</td>
                          <td className="p-4 font-black text-slate-900">₹{Number(cust.totalSpend || 0).toFixed(2)}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteCustomer(cust._id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Remove customer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW: COUPONS & DISCOUNTS MANAGEMENT                                  */}
        {/* ===================================================================== */}
        {activeTab === 'coupons' && (
          <main className="p-8 space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Promotions & Coupon Vouchers</h3>
                <p className="text-xs text-slate-500 font-medium">Create and manage percentage or fixed discounts, minimum cart values, and limits</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCouponModal(true)}
                className="px-4 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Create New Coupon</span>
              </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">Coupon Code</th>
                      <th className="p-4">Discount Value</th>
                      <th className="p-4">Min Order</th>
                      <th className="p-4">Max Cap</th>
                      <th className="p-4">Usage / Limit</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {couponsList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                          No coupons created yet. Click "Create New Coupon" to add discount vouchers.
                        </td>
                      </tr>
                    ) : (
                      couponsList.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-emerald-50 text-[#00B074] font-mono font-black rounded-lg border border-emerald-200">
                                {coupon.code}
                              </span>
                              {coupon.description && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                  {coupon.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-black text-slate-900">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} FLAT`}
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            ₹{coupon.minOrderAmount || 0}
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            {coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount}` : 'No cap'}
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            <span className="font-bold text-slate-900">{coupon.usedCount || 0}</span>
                            <span className="text-slate-400"> / {coupon.usageLimit || '∞'}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              coupon.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(coupon._id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Delete coupon"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW: REVIEWS & MODERATION MANAGEMENT                                 */}
        {/* ===================================================================== */}
        {activeTab === 'reviews' && (
          <main className="p-8 space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Customer Ratings & Reviews</h3>
                <p className="text-xs text-slate-500 font-medium">Moderate customer feedback, approve ratings, and manage public testimonials</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-[#E8F8F0] text-[#00B074] text-xs font-black rounded-xl">
                  {reviewsList.length} Total Reviews
                </span>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsList.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-xs text-slate-400">
                  <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">No reviews submitted yet</p>
                  <p className="text-xs text-slate-400 mt-1">Customer reviews submitted on product pages will appear here for moderation.</p>
                </div>
              ) : (
                reviewsList.map((rev) => (
                  <div key={rev._id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-xs text-slate-900">{rev.title || 'Review'}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                            <ShieldCheck size={11} /> Verified Buyer
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                          rev.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rev.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {rev.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">{rev.comment}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span>By {rev.user?.fullName || 'Anonymous Customer'}</span>
                        <span>•</span>
                        <span>Product: {rev.product?.title || rev.product?.slug || 'Catalog Item'}</span>
                        <span>•</span>
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Moderation Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {rev.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateReviewStatus(rev._id, 'approved')}
                          className="px-3 py-1.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve</span>
                        </button>
                      )}

                      {rev.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateReviewStatus(rev._id, 'rejected')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                        title="Delete review"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW: HERO BANNERS MANAGEMENT                                         */}
        {/* ===================================================================== */}
        {activeTab === 'banners' && (
          <main className="p-8 space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900">Storefront Hero Banners</h3>
                <p className="text-xs text-slate-500 font-medium">Control homepage carousel banners, promotional badges, and action buttons</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddBannerModal(true)}
                className="px-4 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Add Hero Banner</span>
              </button>
            </div>

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bannersList.length === 0 ? (
                <div className="col-span-2 bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-xs text-slate-400">
                  <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">No banners created</p>
                  <p className="text-xs text-slate-400 mt-1">Create hero banners to highlight sales, organic produce, or new arrivals.</p>
                </div>
              ) : (
                bannersList.map((banner) => (
                  <div key={banner._id} className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between">
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-[#00B074] text-white text-[10px] font-black rounded-full shadow-sm">
                          {banner.badgeText || 'Special Offer'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h4 className="font-black text-lg leading-tight">{banner.title}</h4>
                        <p className="text-xs text-white/90 line-clamp-1 mt-0.5">{banner.subtitle}</p>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between bg-white border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                          banner.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {banner.isActive ? 'Live on Store' : 'Hidden'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">Link: {banner.ctaLink}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleBanner(banner._id, banner.isActive)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                            banner.isActive
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {banner.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                          title="Delete banner"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 5: REPORTS & ANALYTICS VIEW                                      */}
        {/* ===================================================================== */}
        {activeTab === 'reports' && (
          <main className="p-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <h3 className="text-xl font-black text-slate-900">Sales & Financial Analytics</h3>
              <p className="text-xs text-slate-500 font-medium">Deep-dive financial breakdown across categories and products</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">Average Order Value</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">₹425.50</h4>
                <p className="text-xs font-bold text-[#00B074] mt-2">↑ 6.4% from last month</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">Order Fulfillment Rate</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">98.2%</h4>
                <p className="text-xs font-bold text-[#00B074] mt-2">↑ 1.2% improvement</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Inventory Value</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">₹1,24,500</h4>
                <p className="text-xs font-bold text-slate-500 mt-2">Across 1,247 products</p>
              </div>
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 6: SETTINGS & SUPER ADMIN AUTH MANAGEMENT                         */}
        {/* ===================================================================== */}
        {activeTab === 'settings' && (
          <main className="p-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <h3 className="text-xl font-black text-slate-900">Super Admin Profile & Security</h3>
              <p className="text-xs text-slate-500 font-medium">Manage credentials, security parameters, and administrator privileges</p>
            </div>

            {settingsNotice.text && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                settingsNotice.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {settingsNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{settingsNotice.text}</span>
              </div>
            )}

            <div className="max-w-2xl bg-white p-8 rounded-3xl border border-slate-100 shadow-xs">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Super Admin Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
                    <Lock size={14} className="text-[#00B074]" />
                    <span>Change Admin Password (Optional)</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        placeholder="Current password"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="Min 4 characters"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-md shadow-[#00B074]/20 flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </main>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS & POPUPS                                                        */}
      {/* ========================================================================= */}

      {/* Help & Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] text-[#00B074] flex items-center justify-center">
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">FreshCart Support Desk</h3>
                <p className="text-xs text-slate-500 font-medium">Direct Technical & Operations Hotline</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-[#00B074]" />
                <span className="font-bold text-slate-900">+91 9161955178 (24x7 Hotline)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-[#00B074]" />
                <span className="font-bold text-slate-900">admin@freshcart.com</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert('Support request submitted! The engineering desk will reach out shortly.');
                setShowSupportModal(false);
              }}
              className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
            >
              Submit Priority Ticket
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Add New Grocery Product</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Create product with initial stock and pricing</p>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Cow Milk 1L"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProduct.categoryName}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  >
                    <option>Dairy & Breakfast</option>
                    <option>Fruits & Vegetables</option>
                    <option>Bakery & Snacks</option>
                    <option>Staples & Grains</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="FreshCart Organic"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="99"
                    value={newProduct.basePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock (Qty) *</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={newProduct.stockQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Farm-fresh organic grocery item..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
              >
                Publish to Storefront
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW COUPON */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Create New Coupon Voucher</h3>
              <button
                onClick={() => setShowAddCouponModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE25"
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={newCouponForm.discountType}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={newCouponForm.discountValue}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="299"
                    value={newCouponForm.minOrderAmount}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={newCouponForm.maxDiscountAmount}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, maxDiscountAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Usage Limit (Max Redeems)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={newCouponForm.usageLimit}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, usageLimit: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 25% off on all organic fresh vegetables"
                  value={newCouponForm.description}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
              >
                Create Coupon Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD HERO BANNER */}
      {showAddBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Create Storefront Banner</h3>
              <button
                onClick={() => setShowAddBannerModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Mango Fest"
                  value={newBannerForm.title}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Hand-picked Ratnagiri Alphonso at 20% off"
                  value={newBannerForm.subtitle}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Super Deal"
                    value={newBannerForm.badgeText}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, badgeText: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    value={newBannerForm.ctaText}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, ctaText: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action Link (Route / URL)</label>
                <input
                  type="text"
                  placeholder="/shop?category=fresh-fruits"
                  value={newBannerForm.ctaLink}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, ctaLink: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newBannerForm.imageUrl}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
              >
                Save & Display Banner
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;