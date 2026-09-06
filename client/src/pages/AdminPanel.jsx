import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  BarChart3, 
  IndianRupee, 
  Users, 
  Package, 
  Layers, 
  Upload, 
  AlertTriangle, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Bike, 
  Trash2, 
  RefreshCw, 
  Search, 
  PlusCircle, 
  ShoppingBag, 
  ExternalLink, 
  LogOut, 
  Sparkles, 
  SlidersHorizontal, 
  Wheat, 
  FileText, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Building,
  Radio,
  Activity,
  PhoneCall,
  Flame,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import { API_URL } from '../config';

const PARENT_CATEGORIES = [
  { id: 100, slug: 'staples-and-grains', name: 'Staples & Grains', icon: Wheat },
  { id: 200, slug: 'packaged-foods-snacks', name: 'Packaged Foods & Snacks', icon: Package },
  { id: 300, slug: 'beverages-drinks', name: 'Beverages & Drinks', icon: Activity },
  { id: 400, slug: 'personal-care-hygiene', name: 'Personal Care & Hygiene', icon: Sparkles },
  { id: 500, slug: 'home-cleaning-pooja', name: 'Home Cleaning & Pooja', icon: Flame },
  { id: 600, slug: 'household-kitchenware', name: 'Household & Kitchenware', icon: Building },
  { id: 700, slug: 'packaging-disposables', name: 'Packaging & Disposables', icon: Layers },
  { id: 800, slug: 'electricals-hardware', name: 'Electricals & Hardware', icon: Radio }
];

const AdminPanel = () => {
  const navigate = useNavigate();

  // Primary Data State
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({
    adminName: localStorage.getItem('fullName') || 'Harsh Srivastava',
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalCategories: 0,
    pendingOrders: 0,
    packedOrders: 0,
    deliveredOrders: 0,
    activeDispatches: 0,
    lowStockCount: 0
  });

  const adminDisplayName = metrics.adminName || localStorage.getItem('fullName') || 'Harsh Srivastava';
  const adminInitials = adminDisplayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'HS';

  // Navigation State (Exact hierarchy from reference image)
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'category-upload' | 'catalog' | 'taxonomy' | 'orders' | 'customers' | 'csv' | 'alerts' | 'ledger'
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedParentFilter, setSelectedParentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Category-Wise Product Upload Form State
  const [selectedParentCategory, setSelectedParentCategory] = useState('staples-and-grains');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [productForm, setProductForm] = useState({
    title: '',
    brand: '',
    slug: '',
    description: '',
    base_price: '',
    tax_rate: '5',
    unit: 'kg',
    image_url: '',
    variants: [
      {
        sku: '',
        barcode: '',
        pack_size: '1 kg Pack',
        price: '',
        compare_at_price: '',
        cost_price: '',
        stock_quantity: 50,
        safety_stock: 5
      }
    ]
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Quick Restock State
  const [restockModal, setRestockModal] = useState({ isOpen: false, variantId: null, currentStock: 0, newStock: 50, title: '' });

  // New Category Creation State
  const [newCatModal, setNewCatModal] = useState({ isOpen: false, name: '', parentId: 100, description: '' });

  // CSV Ingestion State
  const [csvFile, setCsvFile] = useState(null);
  const [csvJob, setCsvJob] = useState(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadAllAdminData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchMetrics(),
      fetchOrders(),
      fetchCustomers(),
      fetchCatalog(),
      fetchCategoriesList(),
      fetchAlerts()
    ]);
    setIsLoading(false);
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/metrics`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {}
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/customers`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {}
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`${API_URL}/api/catalog/search?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
      }
    } catch (e) {}
  };

  const fetchCategoriesList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/catalog/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
        if (data.length > 0 && !selectedSubCategory) {
          const firstSub = data.find(c => c.parent || c.parentId);
          if (firstSub) setSelectedSubCategory(firstSub.slug);
        }
      }
    } catch (e) {}
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/alerts`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {}
  };

  // Subcategories available for selected parent category
  const availableSubCategories = useMemo(() => {
    const parent = categoriesList.find(c => c.slug === selectedParentCategory);
    if (!parent) return [];
    return categoriesList.filter(c => 
      (c.parent && (c.parent._id === parent._id || c.parent.slug === parent.slug)) ||
      (c.parentId && parent.categoryId && c.parentId === parent.categoryId)
    );
  }, [categoriesList, selectedParentCategory]);

  // Set default subcategory when parent changes
  useEffect(() => {
    if (availableSubCategories.length > 0) {
      setSelectedSubCategory(availableSubCategories[0].slug);
    }
  }, [availableSubCategories]);

  // Handle Variant Row Changes
  const handleVariantChange = (index, field, value) => {
    const updated = [...productForm.variants];
    updated[index][field] = value;
    setProductForm({ ...productForm, variants: updated });
  };

  const addVariantRow = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: '',
          barcode: '',
          pack_size: 'Bulk Pack',
          price: '',
          compare_at_price: '',
          cost_price: '',
          stock_quantity: 25,
          safety_stock: 5
        }
      ]
    }));
  };

  const removeVariantRow = (index) => {
    if (productForm.variants.length === 1) return;
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Submit Category-Wise Product
  const handleCreateCategoryProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.base_price) {
      alert('Product Title and Base Wholesale Price are required');
      return;
    }

    const firstSku = productForm.variants[0]?.sku;
    if (!firstSku) {
      alert('At least one Variant with SKU is required');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      // Find subcategory doc
      const targetCat = categoriesList.find(c => c.slug === selectedSubCategory) || 
                        categoriesList.find(c => c.slug === selectedParentCategory);

      const payload = {
        title: productForm.title,
        brand: productForm.brand,
        slug: productForm.slug || productForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: productForm.description,
        base_price: Number(productForm.base_price),
        category_id: targetCat ? targetCat._id : null,
        category_name: targetCat ? targetCat.name : 'Staples & Grains',
        images: productForm.image_url ? [productForm.image_url] : [],
        variants: productForm.variants.map(v => ({
          sku: (v.sku || `${productForm.title.substring(0, 3)}-${v.pack_size}`).toUpperCase().replace(/\s+/g, '-'),
          barcode: v.barcode,
          price: Number(v.price || productForm.base_price),
          compare_at_price: Number(v.compare_at_price || 0),
          cost_price: Number(v.cost_price || 0),
          stock_quantity: Number(v.stock_quantity || 0),
          safety_stock: Number(v.safety_stock || 5),
          attributes: { pack: v.pack_size, unit: productForm.unit }
        }))
      };

      const res = await fetch(`${API_URL}/api/catalog/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Product with Category & SKUs published live!');
        setProductForm({
          title: '',
          brand: '',
          slug: '',
          description: '',
          base_price: '',
          tax_rate: '5',
          unit: 'kg',
          image_url: '',
          variants: [
            {
              sku: '',
              barcode: '',
              pack_size: '1 kg Pack',
              price: '',
              compare_at_price: '',
              cost_price: '',
              stock_quantity: 50,
              safety_stock: 5
            }
          ]
        });
        await fetchCatalog();
        await fetchMetrics();
        setActiveTab('catalog');
      } else {
        const err = await res.json();
        alert(`Failed to add product: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`Error creating product: ${err.message}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Quick Restock execution
  const handleQuickRestockSubmit = async () => {
    if (!restockModal.variantId) return;
    try {
      const res = await fetch(`${API_URL}/api/catalog/variants/${restockModal.variantId}/stock`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ stockQuantity: Number(restockModal.newStock) })
      });
      if (res.ok) {
        alert('Inventory restocked successfully!');
        setRestockModal({ isOpen: false, variantId: null, currentStock: 0, newStock: 50, title: '' });
        await fetchCatalog();
        await fetchAlerts();
        await fetchMetrics();
      } else {
        alert('Failed to restock');
      }
    } catch (e) {
      alert('Error updating stock');
    }
  };

  // Add Custom Category/Subcategory
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatModal.name) return;
    try {
      const res = await fetch(`${API_URL}/api/catalog/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newCatModal.name,
          parentId: Number(newCatModal.parentId),
          description: newCatModal.description
        })
      });
      if (res.ok) {
        alert('Category added to taxonomy!');
        setNewCatModal({ isOpen: false, name: '', parentId: 100, description: '' });
        await fetchCategoriesList();
      }
    } catch (e) {
      alert('Error creating category');
    }
  };

  // 1-Click Order Status Update
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchOrders();
        await fetchMetrics();
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product and all associated variant SKUs?')) return;
    try {
      const res = await fetch(`${API_URL}/api/catalog/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        await fetchCatalog();
        await fetchMetrics();
      }
    } catch (e) {
      alert('Error deleting product');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Remove customer profile?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/customers/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        await fetchCustomers();
        await fetchMetrics();
      }
    } catch (e) {
      alert('Error deleting customer');
    }
  };

  // Filtered Products for Catalog view
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.variants && p.variants.some(v => v.sku.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCategory = selectedParentFilter === 'all' || 
        (p.category && (p.category.slug === selectedParentFilter || p.categoryName === selectedParentFilter)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(selectedParentFilter.replace(/-/g, ' ')));

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedParentFilter]);

  // Formatting currency helper in ₹
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1D2939] flex font-sans antialiased">
      {/* 1. LEFT ENTERPRISE SIDEBAR (Exact hierarchy from Reference Image) */}
      <aside className="w-64 bg-white border-r border-[#EAECF0] flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand Header */}
          <div className="h-16 border-b border-[#EAECF0] px-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-sm font-black text-sm">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h1 className="text-xs font-black tracking-tight text-gray-900 uppercase">QuickShop Console</h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    SUPERADMIN
                  </span>
                </div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* Nav Group 1: OVERVIEW */}
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Overview</p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold shadow-xs border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'orders'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bike size={16} />
                  <span>Live Fulfillment</span>
                </div>
                {metrics.pendingOrders > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {metrics.pendingOrders}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'customers'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users size={16} />
                <span>Kirana Buyers & Users</span>
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'ledger'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <IndianRupee size={16} />
                <span>Financial Ledger</span>
              </button>
            </nav>

            {/* Nav Group 2: CATALOG & TAXONOMY (Expanded as requested!) */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2 px-2">Catalog & Wholesale</p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('category-upload')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'category-upload'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Upload size={16} className="text-amber-600" />
                  <span>Category-Wise Upload</span>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                  NEW
                </span>
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'catalog'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package size={16} />
                  <span>Product Catalog</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{products.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('taxonomy')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'taxonomy'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={16} />
                  <span>Category Taxonomy</span>
                </div>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 rounded-full">
                  {categoriesList.length || 44}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'alerts'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className={alerts.length > 0 ? 'text-amber-500' : ''} />
                  <span>Stock & Safety Alerts</span>
                </div>
                {alerts.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('csv')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'csv'
                    ? 'bg-[#FDF8E8] text-[#B45309] font-bold border border-amber-200/60'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FileText size={16} />
                <span>Bulk CSV Ingestion</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Profile Widget (Matches reference screenshot avatar) */}
        <div className="p-4 border-t border-[#EAECF0]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {adminInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-900 truncate">{adminDisplayName}</p>
                <p className="text-[10px] text-amber-700 font-bold uppercase">SUPERADMIN</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                navigate('/login');
              }}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#EAECF0] px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-gray-900">SuperAdmin Dashboard</h2>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Platform-wide metrics, wholesale catalogs and controls</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              <ExternalLink size={13} />
              <span>Open Storefront</span>
            </button>
            <button
              onClick={() => setActiveTab('category-upload')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
            >
              <PlusCircle size={14} />
              <span>Category-Wise Upload</span>
            </button>
            <button
              onClick={loadAllAdminData}
              title="Refresh Live Data"
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Content View Routing */}
        <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE DASHBOARD (EXACT VISUAL MATCH WITH REFERENCE IMAGE)      */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Split: Executive Control Room + Board Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Cols: Executive Control Room */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs relative overflow-hidden">
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                      <Sparkles size={11} className="text-amber-600" />
                      <span>EXECUTIVE CONTROL ROOM</span>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">ANNUAL RUN RATE</p>
                        <p className="text-base font-extrabold text-gray-900">{formatINR(metrics.totalRevenue * 12)}</p>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">ACTIVE DISPATCHES</p>
                        <p className="text-base font-extrabold text-gray-900">{metrics.activeDispatches || metrics.pendingOrders || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-black tracking-tight text-gray-900 leading-tight">
                    Platform growth<br />and health insights.
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 mb-6">
                    Monitor performance, wholesale catalog pipelines, and quick-commerce operations in one place.
                  </p>

                  {/* 4 Metric Cards Row (Clean rounded cards with soft pastel indicators) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Revenue Ledger */}
                    <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-100/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
                          <IndianRupee size={14} />
                        </div>
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1 rounded">
                          {metrics.totalOrders} Orders
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REVENUE LEDGER</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{formatINR(metrics.totalRevenue)}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{formatINR(Math.round(metrics.totalRevenue / 12 || metrics.totalRevenue))} MRR</p>
                    </div>

                    {/* Card 2: Active Accounts */}
                    <div className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-100/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center text-sky-700">
                          <Building size={14} />
                        </div>
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1 rounded">
                          Live DB
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ACTIVE ACCOUNTS</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{metrics.totalCustomers.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{metrics.totalCustomers} Registered Buyers</p>
                    </div>

                    {/* Card 3: Operator Footprint */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
                          <Users size={14} />
                        </div>
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1 rounded">
                          {metrics.totalCategories} Trees
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CATALOG ITEMS</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{metrics.totalProducts.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{metrics.totalCategories} categories active</p>
                    </div>

                    {/* Card 4: Live Call / Dispatch Surface */}
                    <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center text-rose-700">
                          <PhoneCall size={14} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-1.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                          LIVE
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">LIVE SURFACE</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{metrics.pendingOrders}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{metrics.packedOrders} Packed Orders</p>
                    </div>
                  </div>

                  {/* Secondary Bottom Metrics Row */}
                  <div className="grid grid-cols-3 gap-4 pt-5 mt-5 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900">{metrics.totalOrders} Orders</p>
                        <p className="text-[11px] text-gray-400">Wholesale order pipeline</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900">{metrics.deliveredOrders} Dispatched</p>
                        <p className="text-[11px] text-gray-400">Scheduled wholesale drops</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <Activity size={16} />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900">{metrics.totalCustomers} Active Buyers</p>
                        <p className="text-[11px] text-gray-400">Registered Kirana partners</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Board Summary */}
                <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-3">
                      <FileText size={11} />
                      <span>BOARD SUMMARY</span>
                    </div>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REVENUE STORY</p>
                    <p className="text-xl font-black text-gray-900 mt-1">{formatINR(metrics.totalRevenue)} Total GMV</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.totalOrders} wholesale orders placed across {metrics.totalCustomers} registered buyers.
                    </p>

                    {/* Progress Bar 1 */}
                    <div className="mt-6 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500 text-[11px] uppercase">BUYER ACCOUNTS</span>
                        <span className="text-gray-900">{metrics.totalCustomers > 0 ? 100 : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: metrics.totalCustomers > 0 ? '100%' : '0%' }}></div>
                      </div>
                      <p className="text-[10px] text-gray-400">{metrics.totalCustomers} customer accounts registered</p>
                    </div>

                    {/* Progress Bar 2 */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500 text-[11px] uppercase">CATALOG PIPELINE</span>
                        <span className="text-gray-900">{metrics.totalProducts > 0 ? 100 : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: metrics.totalProducts > 0 ? '100%' : '0%' }}></div>
                      </div>
                      <p className="text-[10px] text-gray-400">{metrics.totalProducts} active SKUs across {metrics.totalCategories} categories</p>
                    </div>

                    {/* Progress Bar 3 */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500 text-[11px] uppercase">FULFILLMENT RATE</span>
                        <span className="text-gray-900">{metrics.totalOrders > 0 ? Math.round((metrics.deliveredOrders / metrics.totalOrders) * 100) : 100}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${metrics.totalOrders > 0 ? Math.round((metrics.deliveredOrders / metrics.totalOrders) * 100) : 100}%` }}></div>
                      </div>
                      <p className="text-[10px] text-gray-400">{metrics.deliveredOrders} delivered of {metrics.totalOrders} total orders</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Blinkit Speed SLA</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      8-10 Mins
                    </span>
                  </div>
                </div>
              </div>

              {/* Lower Deck: Financial Pulse Waveform + Circular Distribution Gauges */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Cols: Financial Pulse Waveform Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">FINANCIAL PULSE</p>
                      <h4 className="text-base font-extrabold text-gray-900 mt-0.5">Revenue trend and annual projection</h4>
                      <p className="text-xs text-gray-500">A clean read on wholesale grocery recurring strength.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">ANNUAL ESTIMATE</span>
                      <span className="text-base font-black text-gray-900">{formatINR(metrics.totalRevenue * 12)}</span>
                    </div>
                  </div>

                  {/* SVG Waveform Area Chart (Stylized like the reference design!) */}
                  <div className="h-44 w-full relative mt-4 flex items-end">
                    <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,130 C40,110 60,30 90,20 C120,10 140,120 170,120 C200,120 220,40 250,30 C280,20 300,130 330,130 C360,130 390,70 420,60 C450,50 480,120 500,120 L500,150 L0,150 Z"
                        fill="url(#waveGradient)"
                      />
                      <path
                        d="M0,130 C40,110 60,30 90,20 C120,10 140,120 170,120 C200,120 220,40 250,30 C280,20 300,130 330,130 C360,130 390,70 420,60 C450,50 480,120 500,120"
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="2.5"
                      />
                      {/* Peak Dots */}
                      <circle cx="90" cy="20" r="4" fill="#D97706" />
                      <circle cx="250" cy="30" r="4" fill="#D97706" />
                      <circle cx="420" cy="60" r="4" fill="#D97706" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mt-2 px-1 border-t border-gray-100 pt-2">
                    <span>Q1 (Staples)</span>
                    <span>Q2 (Snacks)</span>
                    <span>Q3 (Beverages)</span>
                    <span>Q4 (Festival Kirana)</span>
                  </div>
                </div>

                {/* Right 1 Col: Distribution Circular Gauges (Matching reference design) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Circular Meter 1: User Status */}
                  <div className="bg-white rounded-2xl border border-[#EAECF0] p-4 shadow-xs flex flex-col items-center justify-between text-center">
                    <div className="w-full text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">DISTRIBUTION</p>
                      <h5 className="text-xs font-extrabold text-gray-900 mt-0.5">User Status</h5>
                    </div>

                    {/* SVG Circular Donut Ring */}
                    <div className="relative w-24 h-24 my-2 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-100"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray={`${metrics.totalCustomers > 0 ? 100 : 0}, 100`}
                          strokeWidth="4"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-sm font-black text-gray-900">{metrics.totalCustomers > 0 ? 100 : 0}%</span>
                        <span className="block text-[8px] font-bold text-gray-400">ACTIVE</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">{metrics.totalCustomers} Active buyers</p>
                  </div>

                  {/* Circular Meter 2: Catalog Status */}
                  <div className="bg-white rounded-2xl border border-[#EAECF0] p-4 shadow-xs flex flex-col items-center justify-between text-center">
                    <div className="w-full text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">DISTRIBUTION</p>
                      <h5 className="text-xs font-extrabold text-gray-900 mt-0.5">Catalog Live</h5>
                    </div>

                    {/* SVG Circular Donut Ring */}
                    <div className="relative w-24 h-24 my-2 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-100"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-sky-500"
                          strokeDasharray={`${metrics.totalProducts > 0 ? 100 : 0}, 100`}
                          strokeWidth="4"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-sm font-black text-gray-900">{metrics.totalProducts > 0 ? 100 : 0}%</span>
                        <span className="block text-[8px] font-bold text-gray-400">CATALOG</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">{metrics.totalProducts} Live commodities</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CATEGORY-WISE PRODUCT UPLOAD ("category wise wo upload kr ske")    */}
          {/* ========================================================================= */}
          {activeTab === 'category-upload' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">
                    <Upload size={12} className="text-amber-600" />
                    <span>WHOLESALE COMMODITY ONBOARDING</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Category-Wise Product & SKU Uploader</h3>
                  <p className="text-xs text-gray-500">
                    Select Indian Wholesale parent category and subcategory, then publish multi-variant wholesale commodities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  View Live Catalog
                </button>
              </div>

              <form onSubmit={handleCreateCategoryProduct} className="space-y-6">
                {/* STEP 1: Two-Tier Category Selection */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Select Hierarchy: Parent Category & Granular Subcategory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Top-Level Parent Category *</label>
                      <select
                        value={selectedParentCategory}
                        onChange={(e) => setSelectedParentCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                      >
                        {PARENT_CATEGORIES.map(cat => (
                          <option key={cat.slug} value={cat.slug}>
                            📁 {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Granular Subcategory *</label>
                      <select
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                      >
                        {availableSubCategories.length > 0 ? (
                          availableSubCategories.map(sub => (
                            <option key={sub.slug} value={sub.slug}>
                              ↳ {sub.name} ({sub.description || sub.slug})
                            </option>
                          ))
                        ) : (
                          <option value={selectedParentCategory}>Standard {selectedParentCategory}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* STEP 2: Basic Product Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-gray-800 uppercase">
                    <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Product Master Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-gray-700 block mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fortune Pure Kachi Ghani Mustard Oil"
                        value={productForm.title}
                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Brand / Manufacturer *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fortune, Aashirvaad, Tata"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Base Wholesale Price (₹) *</label>
                      <input
                        type="number"
                        required
                        placeholder="145"
                        value={productForm.base_price}
                        onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Unit of Measure</label>
                      <select
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      >
                        <option value="kg">kg (Kilogram)</option>
                        <option value="g">g (Gram)</option>
                        <option value="L">L (Litre)</option>
                        <option value="ml">ml (Millilitre)</option>
                        <option value="pack">Pack / Box</option>
                        <option value="sack">Sack (25kg/50kg)</option>
                        <option value="pcs">Pieces</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">GST Rate (%)</label>
                      <select
                        value={productForm.tax_rate}
                        onChange={(e) => setProductForm({ ...productForm, tax_rate: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      >
                        <option value="0">0% (Nil / Exempted Staples)</option>
                        <option value="5">5% (Edible Oils, Grains)</option>
                        <option value="12">12% (Processed FMCG)</option>
                        <option value="18">18% (Personal & Home Care)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Product Image URL</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Description & Market Usage</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. 100% pure kachi ghani cold pressed mustard oil for wholesale distribution."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* STEP 3: Multi-Variant SKUs Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-gray-800 uppercase">
                      <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px]">3</span>
                      <span>Wholesale Variant SKUs & Pack Sizes</span>
                    </div>
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg transition"
                    >
                      <PlusCircle size={13} />
                      <span>Add Another Pack SKU</span>
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                        <tr>
                          <th className="p-2.5">SKU Code *</th>
                          <th className="p-2.5">Pack Size / Spec *</th>
                          <th className="p-2.5">Wholesale (₹) *</th>
                          <th className="p-2.5">MRP (₹)</th>
                          <th className="p-2.5">Cost (₹)</th>
                          <th className="p-2.5">Stock</th>
                          <th className="p-2.5">Safety Stock</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productForm.variants.map((v, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/60">
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                placeholder="FORT-OIL-1L"
                                value={v.sku}
                                onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                                className="w-28 p-1.5 uppercase font-mono font-bold bg-white border border-gray-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="1 Litre Pouch"
                                value={v.pack_size}
                                onChange={(e) => handleVariantChange(idx, 'pack_size', e.target.value)}
                                className="w-28 p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                placeholder="145"
                                value={v.price}
                                onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                                className="w-20 p-1.5 font-bold bg-white border border-gray-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                placeholder="170"
                                value={v.compare_at_price}
                                onChange={(e) => handleVariantChange(idx, 'compare_at_price', e.target.value)}
                                className="w-20 p-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                placeholder="125"
                                value={v.cost_price}
                                onChange={(e) => handleVariantChange(idx, 'cost_price', e.target.value)}
                                className="w-20 p-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                placeholder="50"
                                value={v.stock_quantity}
                                onChange={(e) => handleVariantChange(idx, 'stock_quantity', e.target.value)}
                                className="w-16 p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                placeholder="5"
                                value={v.safety_stock}
                                onChange={(e) => handleVariantChange(idx, 'safety_stock', e.target.value)}
                                className="w-16 p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeVariantRow(idx)}
                                disabled={productForm.variants.length === 1}
                                className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    <span>{isSubmittingProduct ? 'Publishing...' : 'Publish Product to Storefront'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PRODUCT CATALOG (FILTERABLE BY PARENT & SUB-CATEGORY)             */}
          {/* ========================================================================= */}
          {activeTab === 'catalog' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-gray-900">Wholesale Product Catalog</h3>
                  <p className="text-xs text-gray-500">Live products, inventory levels, and variant SKUs.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search title, brand, SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs w-64 focus:outline-none focus:bg-white"
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab('category-upload')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
                  >
                    <PlusCircle size={14} />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills Rail */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-100">
                <button
                  onClick={() => setSelectedParentFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedParentFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {PARENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedParentFilter(cat.slug)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                      selectedParentFilter === cat.slug
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Products Table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <tr>
                      <th className="p-3">Product / Brand</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3">Variant SKUs</th>
                      <th className="p-3">Total Stock</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map(p => {
                      const totalStock = p.variants ? p.variants.reduce((acc, v) => acc + v.stockQuantity, 0) : 0;
                      return (
                        <tr key={p._id} className="hover:bg-gray-50/50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {p.images && p.images[0] ? (
                                <img src={p.images[0].imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                                  📦
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-gray-900 line-clamp-1">{p.title}</p>
                                <p className="text-[11px] text-gray-400">{p.brand || 'Wholesale'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                              {p.categoryName || 'General'}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-gray-900">
                            {formatINR(p.basePrice)}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {p.variants && p.variants.map((v, i) => (
                                <span
                                  key={i}
                                  title={`SKU: ${v.sku} | Stock: ${v.stockQuantity}`}
                                  className="bg-gray-100 text-gray-700 text-[10px] font-mono px-1.5 py-0.5 rounded"
                                >
                                  {v.sku} ({formatINR(v.price)})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              totalStock <= 10 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {totalStock} units
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.variants && p.variants[0] && (
                                <button
                                  onClick={() => setRestockModal({
                                    isOpen: true,
                                    variantId: p.variants[0]._id,
                                    currentStock: p.variants[0].stockQuantity,
                                    newStock: p.variants[0].stockQuantity + 50,
                                    title: `${p.title} (${p.variants[0].sku})`
                                  })}
                                  title="Quick Restock"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  <RefreshCw size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteProduct(p._id)}
                                title="Delete Product"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CATEGORY TAXONOMY EXPLORER (ALL 44 INDIAN WHOLESALE CATEGORIES)    */}
          {/* ========================================================================= */}
          {activeTab === 'taxonomy' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1">
                    <Layers size={12} className="text-blue-600" />
                    <span>WHOLESALE KIRANA TAXONOMY</span>
                  </div>
                  <h3 className="text-base font-black text-gray-900">Standardized Indian Wholesale Category Tree</h3>
                  <p className="text-xs text-gray-500">8 Parent Categories with 36 Granular Subcategories.</p>
                </div>
                <button
                  onClick={() => setNewCatModal({ isOpen: true, name: '', parentId: 100, description: '' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition"
                >
                  <PlusCircle size={14} />
                  <span>Add Subcategory</span>
                </button>
              </div>

              {/* Taxonomy Grid of 8 Parent Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PARENT_CATEGORIES.map(parent => {
                  const Icon = parent.icon;
                  const children = categoriesList.filter(c => 
                    (c.parent && c.parent.slug === parent.slug) ||
                    (c.parentId && c.parentId === parent.id)
                  );

                  return (
                    <div key={parent.slug} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                            <Icon size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-gray-900">
                              [{parent.id}] {parent.name}
                            </h4>
                            <p className="text-[10px] text-gray-400">{children.length} subcategories attached</p>
                          </div>
                        </div>
                        <span className="bg-white text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                          {parent.slug}
                        </span>
                      </div>

                      {/* Subcategories list */}
                      <div className="space-y-1 pl-4 border-l-2 border-amber-300">
                        {children.map(sub => (
                          <div key={sub._id} className="flex items-center justify-between py-1 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-300 font-mono text-[10px]">↳</span>
                              <span className="font-semibold text-gray-800">{sub.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{sub.slug}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: LIVE ORDERS & FULFILLMENT PIPELINE                                */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900">Live Orders & Rider Dispatch</h3>
                  <p className="text-xs text-gray-500">Advance order states across the 8-10 minute quick-delivery pipeline.</p>
                </div>
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                  ● {metrics.pendingOrders} Pending Action
                </span>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <tr>
                      <th className="p-3">Order Number</th>
                      <th className="p-3">Customer & Phone</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Dispatch Pipeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(o => {
                      const st = o.status || o.orderStatus || 'pending';
                      return (
                        <tr key={o._id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono font-bold text-gray-900">
                            {o.orderNumber || o._id.substring(0, 8)}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-gray-900">{o.customerName || 'Kirana Buyer'}</p>
                            <p className="text-[10px] text-gray-400">{o.phoneNumber}</p>
                          </td>
                          <td className="p-3 text-gray-500 max-w-xs truncate">
                            {o.address || 'Local Delivery'}
                          </td>
                          <td className="p-3 font-black text-gray-900">
                            {formatINR(o.totalAmount || o.subtotal)}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              st === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                              st === 'out_for_delivery' ? 'bg-sky-100 text-sky-800' :
                              st === 'packed' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {st.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {st === 'pending' && (
                                <button
                                  onClick={() => updateOrderStatus(o._id, 'packed')}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold"
                                >
                                  Pack & Bag
                                </button>
                              )}
                              {st === 'packed' && (
                                <button
                                  onClick={() => updateOrderStatus(o._id, 'out_for_delivery')}
                                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold"
                                >
                                  Hand to Rider
                                </button>
                              )}
                              {st === 'out_for_delivery' && (
                                <button
                                  onClick={() => updateOrderStatus(o._id, 'delivered')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                                >
                                  Mark Delivered
                                </button>
                              )}
                              {st === 'delivered' && (
                                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                  <Check size={12} /> Fulfilled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CUSTOMERS & USERS REGISTRY                                        */}
          {/* ========================================================================= */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-base font-black text-gray-900">Kirana Buyers & Customer Accounts</h3>
                <p className="text-xs text-gray-500">Registered multi-user shopping accounts, order counts, and lifetime spend in ₹.</p>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Mobile Number</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Orders Count</th>
                      <th className="p-3">Lifetime GMV</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map(c => (
                      <tr key={c._id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-gray-900">{c.fullName || 'Customer'}</td>
                        <td className="p-3 font-mono text-gray-600">{c.phone}</td>
                        <td className="p-3">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                            {c.role}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-gray-700">{c.ordersCount || 0}</td>
                        <td className="p-3 font-black text-gray-900">{formatINR(c.totalSpend || 0)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteCustomer(c._id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: STOCK & SAFETY ALERTS                                              */}
          {/* ========================================================================= */}
          {activeTab === 'alerts' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-base font-black text-gray-900">Inventory Safety Stock Warnings</h3>
                <p className="text-xs text-gray-500">Real-time alerts when wholesale commodities dip below safety threshold.</p>
              </div>

              {alerts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-gray-600">All inventory variants are currently healthy.</p>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                      <tr>
                        <th className="p-3">Product Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Current Stock</th>
                        <th className="p-3">Safety Threshold</th>
                        <th className="p-3 text-right">Restock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alerts.map((al, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-bold text-gray-900">{al.productTitle}</td>
                          <td className="p-3">{al.category}</td>
                          <td className="p-3 font-mono font-bold text-amber-700">{al.sku}</td>
                          <td className="p-3 font-bold text-rose-600">{al.stockQuantity} units</td>
                          <td className="p-3 text-gray-500">{al.safetyStock} units</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setRestockModal({
                                isOpen: true,
                                variantId: al.variantId,
                                currentStock: al.stockQuantity,
                                newStock: al.stockQuantity + 50,
                                title: `${al.productTitle} (${al.sku})`
                              })}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                            >
                              + Restock 50 Units
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: BULK CSV INGESTION                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'csv' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-base font-black text-gray-900">Bulk Catalog CSV Ingestion</h3>
                <p className="text-xs text-gray-500">Asynchronous 500-row chunked stream upload mapped to MongoDB taxonomy.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 flex flex-col items-center justify-center text-center space-y-3">
                  <Upload size={32} className="text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Select Kirana Catalog CSV File</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Supports title, brand, category_slug, sku, price, stock</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                  />
                  {csvFile && (
                    <button
                      onClick={async () => {
                        if (!csvFile) return;
                        setIsUploadingCsv(true);
                        const formData = new FormData();
                        formData.append('file', csvFile);
                        try {
                          const res = await fetch(`${API_URL}/api/catalog/bulk-upload`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                            body: formData
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setCsvJob(data);
                            alert('Bulk upload queued successfully!');
                            await fetchCatalog();
                          }
                        } catch (e) {
                          alert('Error during upload');
                        } finally {
                          setIsUploadingCsv(false);
                        }
                      }}
                      disabled={isUploadingCsv}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      {isUploadingCsv ? 'Uploading...' : 'Start Ingestion'}
                    </button>
                  )}
                </div>

                <div className="p-6 rounded-2xl border border-gray-200 bg-white space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider">Download Category Template</h4>
                  <p className="text-xs text-gray-500">
                    Use our pre-formatted CSV template pre-populated with standard Indian Wholesale category slugs.
                  </p>
                  <button
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," + 
                        "title,brand,category_slug,base_price,sku,pack_size,price,stock_quantity,safety_stock\n" +
                        "Aashirvaad Shudh Chakki Atta,Aashirvaad,flours-atta-sooji,225,AASH-ATTA-5KG,5 kg Bag,225,100,10\n" +
                        "Fortune Mustard Oil,Fortune,edible-oils-ghee,145,FORT-OIL-1L,1 Litre Pouch,145,150,15\n" +
                        "India Gate Basmati Rice,India Gate,rice-paddy,380,IG-RICE-5KG,5 kg Pack,380,80,10\n" +
                        "Tata Tea Premium,Tata Tea,tea-chai-patti,140,TATA-TEA-250G,250g Pack,140,200,20\n";
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "kirana_catalog_template.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition"
                  >
                    <FileText size={14} />
                    <span>Download Kirana CSV Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: FINANCIAL LEDGER & TRANSACTIONS                                    */}
          {/* ========================================================================= */}
          {activeTab === 'ledger' && (
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-base font-black text-gray-900">Financial Ledger & Idempotent Transactions</h3>
                <p className="text-xs text-gray-500">Immutable ledger records protecting against double-billing.</p>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <tr>
                      <th className="p-3">Reference / Idempotency Key</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Amount (₹)</th>
                      <th className="p-3">Ledger Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(o => (
                      <tr key={o._id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-mono text-[11px] text-gray-500">
                          {`PAY-IDEM-${o._id.substring(0, 12).toUpperCase()}`}
                        </td>
                        <td className="p-3 font-bold text-gray-800">{o.customerName || 'Kirana Customer'}</td>
                        <td className="p-3 font-mono text-gray-600 uppercase">{o.paymentMethod || 'COD'}</td>
                        <td className="p-3 font-black text-gray-900">{formatINR(o.totalAmount || o.subtotal)}</td>
                        <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            SETTLED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* QUICK RESTOCK MODAL */}
      {restockModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-gray-100">
            <h4 className="text-sm font-black text-gray-900">Quick Inventory Restock</h4>
            <p className="text-xs text-gray-500">{restockModal.title}</p>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">New Total Physical Stock</label>
              <input
                type="number"
                value={restockModal.newStock}
                onChange={(e) => setRestockModal({ ...restockModal, newStock: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRestockModal({ isOpen: false, variantId: null, currentStock: 0, newStock: 50, title: '' })}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickRestockSubmit}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Save Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUBCATEGORY MODAL */}
      {newCatModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-100">
            <h4 className="text-sm font-black text-gray-900">Add New Subcategory to Taxonomy</h4>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Parent Category</label>
                <select
                  value={newCatModal.parentId}
                  onChange={(e) => setNewCatModal({ ...newCatModal, parentId: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  {PARENT_CATEGORIES.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Millet Flour"
                  value={newCatModal.name}
                  onChange={(e) => setNewCatModal({ ...newCatModal, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Ragi, Jowar, and Bajra gluten-free grains"
                  value={newCatModal.description}
                  onChange={(e) => setNewCatModal({ ...newCatModal, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCatModal({ isOpen: false, name: '', parentId: 100, description: '' })}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;