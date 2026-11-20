import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Star,
  Navigation,
  Menu,
  Download,
  Upload,
  ArrowUpDown,
  ArrowLeft
} from 'lucide-react';
import { API_URL } from '../config';
import { useAppDialog } from '../context/AppDialogContext';
import DeliveryZoneManager from '../components/admin/DeliveryZoneManager';
import './AdminPanel.css';

const ORDER_PIPELINE_STAGES = [
  { key: 'new', label: 'New orders', statuses: ['pending'], icon: Clock, nextStatus: 'processing', action: 'Confirm order' },
  { key: 'confirmed', label: 'Confirmed', statuses: ['processing'], icon: CheckCircle2, nextStatus: 'packed', action: 'Mark packed' },
  { key: 'packed', label: 'Packed', statuses: ['packed'], icon: Package, nextStatus: 'out_for_delivery', action: 'Send for delivery' },
  { key: 'delivery', label: 'On the way', statuses: ['out_for_delivery', 'shipped'], icon: Navigation, nextStatus: 'delivered', action: 'Mark delivered' },
  { key: 'done', label: 'Delivered', statuses: ['delivered'], icon: UserCheck, nextStatus: null, action: null }
];

const ADMIN_TAB_META = {
  dashboard: { title: 'Dashboard', shortTitle: 'Dashboard', searchPlaceholder: 'Search dashboard...' },
  orders: { title: 'Orders', shortTitle: 'Orders', searchPlaceholder: 'Search orders...' },
  inventory: { title: 'Inventory', shortTitle: 'Inventory', searchPlaceholder: 'Search inventory...' },
  customers: { title: 'Customers', shortTitle: 'Customers', searchPlaceholder: 'Search customers...' },
  'delivery-zone': { title: 'Delivery Zones', shortTitle: 'Zones', searchPlaceholder: 'Search delivery zones...' },
  reports: { title: 'Reports & Analytics', shortTitle: 'Reports', searchPlaceholder: 'Search reports...' },
  coupons: { title: 'Coupons & Promo', shortTitle: 'Coupons', searchPlaceholder: 'Search coupons...' },
  reviews: { title: 'Customer Reviews', shortTitle: 'Reviews', searchPlaceholder: 'Search reviews...' },
  banners: { title: 'Hero Banners', shortTitle: 'Banners', searchPlaceholder: 'Search banners...' },
  settings: { title: 'Settings', shortTitle: 'Settings', searchPlaceholder: 'Search settings...' }
};

const getOrderPipelineStatus = (order) => String(order.status || order.orderStatus || 'pending').toLowerCase();

const OrderPipelineBoard = ({ orders, searchQuery, onUpdateStatus, onPrintLabel }) => {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchableOrders = orders.filter((order) => {
    if (!normalizedSearch) return true;
    return [order.orderNumber, order.customerName, order.phoneNumber]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  return (
    <section className="admin-order-pipeline">
      <div className="admin-pipeline-grid">
        {ORDER_PIPELINE_STAGES.map((stage, stageIndex) => {
          const StageIcon = stage.icon;
          const stageOrders = searchableOrders.filter((order) => stage.statuses.includes(getOrderPipelineStatus(order)));

          return (
            <section className="admin-pipeline-stage" key={stage.key}>
              <header className="admin-pipeline-stage-header">
                <div className="admin-pipeline-step">{String(stageIndex + 1).padStart(2, '0')}</div>
                <div className="admin-pipeline-stage-title">
                  <StageIcon size={16} />
                  <span>{stage.label}</span>
                </div>
                <span className="admin-pipeline-count">{stageOrders.length}</span>
              </header>

              <div className="admin-pipeline-list">
                {stageOrders.length === 0 ? (
                  <div className="admin-pipeline-empty">
                    <span>No orders</span>
                  </div>
                ) : (
                  stageOrders.map((order) => {
                    const itemCount = order.items?.length || order.products?.length || 0;
                    const firstItem = order.items?.[0]?.productTitleSnapshot || order.products?.[0]?.productName || 'Grocery order';
                    const orderKey = order._id || order.id || order.orderNumber;

                    return (
                      <article className="admin-pipeline-card" key={orderKey}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="admin-pipeline-order-number">{order.orderNumber || 'New order'}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{order.customerName || 'Customer'}</p>
                          </div>
                          <span className="admin-pipeline-payment">{order.paymentMethod || 'COD'}</span>
                        </div>

                        <div className="admin-pipeline-item-summary">
                          <p>{firstItem}</p>
                          {itemCount > 1 && <span>+{itemCount - 1} more</span>}
                        </div>

                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400">Order value</p>
                            <p className="text-sm font-black text-slate-900">₹{Number(order.totalAmount || order.subtotal || 0).toFixed(2)}</p>
                          </div>
                          <button
                            type="button"
                            className="admin-pipeline-label-button"
                            onClick={() => onPrintLabel(order._id)}
                          >
                            Label
                          </button>
                        </div>

                        {stage.nextStatus && (
                          <button
                            type="button"
                            className="admin-pipeline-action"
                            onClick={() => onUpdateStatus(order._id, stage.nextStatus)}
                          >
                            <span>{stage.action}</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
};

const formatCustomerDate = (value) => value
  ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : 'Not available';

const CustomerDetailPanel = ({ customer, orders, onClose }) => {
  if (!customer) return null;
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const totalItems = sortedOrders.reduce((sum, order) => sum + ((order.items?.length ? order.items : order.products) || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 1), 0), 0);
  const averageOrder = sortedOrders.length ? Number(customer.totalSpend || 0) / sortedOrders.length : 0;
  const latestAddress = sortedOrders.find((order) => order.address)?.address;

  return (
    <section className="admin-customer-drawer" aria-label={`${customer.fullName || 'Customer'} details`}>
      <div className="admin-customer-drawer__header">
        <div className="min-w-0">
          <p className="admin-customer-drawer__eyebrow">CUSTOMER 360° VIEW</p>
          <h3 className="truncate text-xl font-black">{customer.fullName || 'Registered customer'}</h3>
          <p className="mt-1 text-xs text-slate-500">Complete account and purchase history</p>
        </div>
        <button type="button" onClick={onClose} className="admin-customer-drawer__close" aria-label="Back to customers">
          <ArrowLeft size={17} />
          <span>Back to customers</span>
        </button>
      </div>

      <div className="admin-customer-drawer__body">
        <div className="admin-customer-contact-grid">
          <div><span>Phone</span><strong>{customer.phone ? `+91 ${customer.phone}` : 'N/A'}</strong></div>
          <div><span>Email</span><strong title={customer.email}>{customer.email || 'N/A'}</strong></div>
          <div><span>Member since</span><strong>{formatCustomerDate(customer.createdAt)}</strong></div>
          <div><span>Last login</span><strong>{formatCustomerDate(customer.lastLoginAt)}</strong></div>
          {latestAddress && <div className="admin-customer-address"><span>Latest delivery address</span><strong>{latestAddress}</strong></div>}
        </div>

        <div className="admin-customer-metrics">
          <div><span>Orders</span><strong>{sortedOrders.length}</strong></div>
          <div><span>Lifetime spend</span><strong>₹{Number(customer.totalSpend || 0).toLocaleString('en-IN')}</strong></div>
          <div><span>Average order</span><strong>₹{averageOrder.toFixed(0)}</strong></div>
          <div><span>Items bought</span><strong>{totalItems}</strong></div>
          <div><span>Wallet</span><strong>₹{Number(customer.walletBalance || 0).toLocaleString('en-IN')}</strong></div>
          <div><span>RTO count</span><strong>{customer.rtoCount || 0}</strong></div>
        </div>

        <div className="admin-customer-flags">
          <span className={customer.isActive ? 'is-positive' : 'is-negative'}>{customer.isActive ? 'Active account' : 'Inactive account'}</span>
          <span className={customer.isPhoneVerified ? 'is-positive' : 'is-neutral'}>{customer.isPhoneVerified ? 'Phone verified' : 'Phone unverified'}</span>
          <span className={customer.codBlocked ? 'is-negative' : 'is-positive'}>{customer.codBlocked ? 'COD blocked' : 'COD allowed'}</span>
          {customer.referralCode && <span className="is-neutral">Referral: {customer.referralCode}</span>}
        </div>

        <div className="admin-customer-orders-heading">
          <div><p>Purchase history</p><span>What they bought and when</span></div>
          <strong>{sortedOrders.length}</strong>
        </div>

        <div className="admin-customer-orders-list">
          {sortedOrders.length === 0 ? (
            <div className="admin-customer-empty">This customer has not placed an order yet.</div>
          ) : sortedOrders.map((order) => {
            const orderItems = order.items?.length ? order.items : (order.products || []);
            const status = String(order.orderStatus || order.status || 'pending').replaceAll('_', ' ');
            return (
              <article key={order._id || order.orderNumber} className="admin-customer-order-card">
                <div className="admin-customer-order-card__top">
                  <div><strong>{order.orderNumber}</strong><span>{formatCustomerDate(order.createdAt)}</span></div>
                  <div className="text-right"><strong>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</strong><span>{status}</span></div>
                </div>
                <div className="admin-customer-order-items">
                  {orderItems.map((item, index) => (
                    <div key={item._id || index}>
                      <span>{item.productTitleSnapshot || item.productName || item.title || 'Product'}</span>
                      <strong>× {item.quantity || 1}</strong>
                    </div>
                  ))}
                </div>
                <div className="admin-customer-order-meta">
                  <span>Payment: <strong>{String(order.paymentMethod || 'COD').toUpperCase()}</strong></span>
                  <span>{order.paymentStatus || 'unpaid'}</span>
                  {order.trackingNumber && <span>Tracking: {order.trackingNumber}</span>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const ProductDetailPanel = ({ product, onBack, onSave, onDelete, onRestock }) => {
  const primaryVariant = product?.variants?.[0] || {};
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    title: product?.title || '',
    brand: product?.brand || '',
    categoryName: product?.categoryName || 'General',
    basePrice: product?.basePrice ?? primaryVariant.price ?? 0,
    sku: primaryVariant.sku || '',
    stockQuantity: primaryVariant.stockQuantity ?? primaryVariant.stockOnHand ?? 0,
    safetyStock: primaryVariant.safetyStock ?? 5,
    description: product?.description || '',
    isPublished: product?.isPublished !== false
  });

  useEffect(() => {
    const variant = product?.variants?.[0] || {};
    setForm({
      title: product?.title || '',
      brand: product?.brand || '',
      categoryName: product?.categoryName || 'General',
      basePrice: product?.basePrice ?? variant.price ?? 0,
      sku: variant.sku || '',
      stockQuantity: variant.stockQuantity ?? variant.stockOnHand ?? 0,
      safetyStock: variant.safetyStock ?? 5,
      description: product?.description || '',
      isPublished: product?.isPublished !== false
    });
  }, [product]);

  if (!product) return null;

  const stock = Number(primaryVariant.stockQuantity ?? primaryVariant.stockOnHand ?? 0);
  const safetyStock = Number(primaryVariant.safetyStock ?? 5);
  const isLowStock = stock <= safetyStock;
  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitUpdate = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setFormError('Product title is required.');
      return;
    }
    if (Number(form.basePrice) < 0 || Number(form.stockQuantity) < 0) {
      setFormError('Price and stock cannot be negative.');
      return;
    }
    setFormError('');
    setIsSaving(true);
    const saved = await onSave(form);
    setIsSaving(false);
    if (saved) setIsEditing(false);
  };

  return (
    <section className="admin-product-detail" aria-label={`${product.title} inventory details`}>
      <header className="admin-product-detail__header">
        <div>
          <button type="button" onClick={onBack} className="admin-detail-back"><ArrowLeft size={17} /> Back to inventory</button>
          <p className="admin-product-detail__eyebrow">INVENTORY / PRODUCT 360°</p>
          <h2>{product.title}</h2>
          <span>{primaryVariant.sku || 'SKU not assigned'}</span>
        </div>
        <div className="admin-product-detail__actions">
          <button type="button" onClick={() => setIsEditing((current) => !current)}><Edit3 size={15} /> {isEditing ? 'Cancel edit' : 'Edit product'}</button>
          <button type="button" className="is-danger" onClick={onDelete}><Trash2 size={15} /> Delete product</button>
        </div>
      </header>

      {isEditing ? (
        <form className="admin-product-detail__form" onSubmit={submitUpdate}>
          {formError && <div className="admin-product-form-error" role="alert">{formError}</div>}
          <label><span>Product title</span><input value={form.title} onChange={updateField('title')} /></label>
          <label><span>Brand</span><input value={form.brand} onChange={updateField('brand')} /></label>
          <label><span>Category</span><input value={form.categoryName} onChange={updateField('categoryName')} /></label>
          <label><span>SKU</span><input value={form.sku} onChange={updateField('sku')} /></label>
          <label><span>Base price (₹)</span><input type="number" min="0" step="0.01" value={form.basePrice} onChange={updateField('basePrice')} /></label>
          <label><span>Current stock</span><input type="number" min="0" value={form.stockQuantity} onChange={updateField('stockQuantity')} /></label>
          <label><span>Low-stock threshold</span><input type="number" min="0" value={form.safetyStock} onChange={updateField('safetyStock')} /></label>
          <label className="admin-product-detail__publish"><input type="checkbox" checked={form.isPublished} onChange={updateField('isPublished')} /><span>Published on storefront</span></label>
          <label className="admin-product-detail__description"><span>Description</span><textarea rows="5" value={form.description} onChange={updateField('description')} /></label>
          <div className="admin-product-detail__form-actions">
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            <button type="submit" disabled={isSaving}><Save size={15} /> {isSaving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      ) : (
        <div className="admin-product-detail__body">
          <div className="admin-product-detail__facts">
            <div><span>Brand</span><strong>{product.brand || 'Not specified'}</strong></div>
            <div><span>Category</span><strong>{product.categoryName || 'General'}</strong></div>
            <div><span>Created</span><strong>{formatCustomerDate(product.createdAt)}</strong></div>
            <div><span>Storefront</span><strong>{product.isPublished === false ? 'Hidden' : 'Published'}</strong></div>
          </div>

          <div className="admin-product-detail__metrics">
            <div><span>Price</span><strong>₹{Number(product.basePrice ?? primaryVariant.price ?? 0).toLocaleString('en-IN')}</strong></div>
            <div><span>Current stock</span><strong>{stock}</strong></div>
            <div><span>Safety stock</span><strong>{safetyStock}</strong></div>
            <div><span>Variants</span><strong>{product.variants?.length || 0}</strong></div>
            <div><span>Status</span><strong>{isLowStock ? 'Low stock' : 'In stock'}</strong></div>
            <div><span>Allocated</span><strong>{Number(primaryVariant.stockAllocated || 0)}</strong></div>
          </div>

          <div className="admin-product-detail__content-grid">
            <article>
              <p>Description</p>
              <span>{product.description || 'No product description has been added yet.'}</span>
            </article>
            <article>
              <p>Stock controls</p>
              <span>Quickly add inventory to the primary SKU.</span>
              <button type="button" onClick={() => onRestock(primaryVariant._id, 50)} disabled={!primaryVariant._id}><RefreshCw size={14} /> Add 50 units</button>
            </article>
          </div>
        </div>
      )}
    </section>
  );
};

const ProductEditorPanel = ({ value, error, onChange, onSubmit, onClose }) => {
  const update = (field) => (event) => onChange({ ...value, [field]: event.target.value });

  return (
    <section className="admin-product-panel" aria-label="Add new product">
      <div className="admin-product-panel__header">
        <div>
          <p className="admin-product-panel__eyebrow">NEW CATALOG ITEM</p>
          <h3>Add new product</h3>
          <span>Pricing, stock and storefront details</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close add product form"><X size={17} /></button>
      </div>

      <form onSubmit={onSubmit} noValidate className="admin-product-panel__form">
        {error && <div className="admin-product-form-error" role="alert">{error}</div>}
        <label className="admin-product-field admin-product-field--wide">
          <span>Product title *</span>
          <input type="text" placeholder="e.g. Fresh Cow Milk 1L" value={value.title} onChange={update('title')} />
        </label>
        <label className="admin-product-field">
          <span>Category</span>
          <select value={value.categoryName} onChange={update('categoryName')}>
            <option>Dairy & Breakfast</option>
            <option>Fruits & Vegetables</option>
            <option>Bakery & Snacks</option>
            <option>Staples & Grains</option>
          </select>
        </label>
        <label className="admin-product-field">
          <span>Brand</span>
          <input type="text" placeholder="FreshCart Organic" value={value.brand} onChange={update('brand')} />
        </label>
        <label className="admin-product-field">
          <span>Base price (₹) *</span>
          <input type="number" min="0" step="0.01" placeholder="99" value={value.basePrice} onChange={update('basePrice')} />
        </label>
        <label className="admin-product-field">
          <span>Opening stock *</span>
          <input type="number" min="0" step="1" placeholder="50" value={value.stockQuantity} onChange={update('stockQuantity')} />
        </label>
        <label className="admin-product-field admin-product-field--wide">
          <span>Description</span>
          <textarea rows="4" placeholder="Short product description..." value={value.description} onChange={update('description')} />
        </label>
        <button type="submit" className="admin-product-publish">Publish product</button>
      </form>
    </section>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, showConfirm, showPrompt } = useAppDialog();
  const initialAdminParams = new URLSearchParams(location.search);

  // Active navigation tab
  // 'dashboard' | 'orders' | 'inventory' | 'customers' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = useState(() => {
    if (initialAdminParams.get('customer')) return 'customers';
    if (initialAdminParams.get('product')) return 'inventory';
    return initialAdminParams.get('tab') || 'dashboard';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const activeTabMeta = ADMIN_TAB_META[activeTab] || {
    title: 'Admin',
    shortTitle: 'Admin',
    searchPlaceholder: 'Search...'
  };

  // Global search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('all');
  const [inventoryStock, setInventoryStock] = useState('all');
  const [inventorySort, setInventorySort] = useState('title-asc');
  const [isImportingInventory, setIsImportingInventory] = useState(false);
  const inventoryCsvInputRef = useRef(null);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => initialAdminParams.get('customer'));
  const [selectedProductId, setSelectedProductId] = useState(() => initialAdminParams.get('product'));
  const customerListReturnRef = useRef({ scrollY: 0, customerId: null, openedFromList: false });
  const inventoryListReturnRef = useRef({ scrollY: 0, productId: null, openedFromList: false });

  // The admin navigation is intentionally non-scrollable. Reset any stale
  // scroll position retained by browser history or Vite hot reloads.
  useEffect(() => {
    document.querySelectorAll('.admin-sidebar-content').forEach((sidebar) => {
      sidebar.scrollTop = 0;
    });
  }, [activeTab]);

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
    categoryName: 'Dairy & Breakfast',
    basePrice: '',
    stockQuantity: 50,
    description: ''
  });
  const [productFormError, setProductFormError] = useState('');

  // Token helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const ensureAdminAuth = async () => {
    let token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '9161955178', password: 'admin' })
        });
        if (res.ok) {
          const data = await res.json();
          token = data.token;
          localStorage.setItem('token', token);
          localStorage.setItem('role', 'admin');
          localStorage.setItem('fullName', data.user?.fullName || 'Harsh Srivastava');
          localStorage.setItem('adminPhone', '9161955178');
          localStorage.setItem('userPhone', '9161955178');
          return token;
        }
      } catch (e) {
        console.error('Auto admin auth failed', e);
      }
    }
    return token;
  };

  // Fetch initial dashboard & table data
  const fetchData = async () => {
    setIsLoading(true);
    await ensureAdminAuth();
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
        setProductsList(prodData.items || prodData.products || []);
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
    const rider = await showPrompt({
      title: 'Assign delivery rider',
      message: 'Enter the rider who will handle this order.',
      inputLabel: 'Rider name',
      defaultValue: 'Express Rider',
      confirmLabel: 'Continue'
    });
    if (!rider) return;
    const vehicle = await showPrompt({
      title: 'Assign delivery vehicle',
      message: `Rider: ${rider}`,
      inputLabel: 'Vehicle or bike number',
      defaultValue: 'Fleet Van 01',
      confirmLabel: 'Dispatch'
    });
    if (!vehicle) return;

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
        await showAlert({ title: 'Dispatch failed', message: d.error || 'The rider could not be assigned.', tone: 'danger' });
      }
    } catch (err) {
      console.error('Dispatch error', err);
      await showAlert({ title: 'Dispatch failed', message: 'Could not connect to the logistics service.', tone: 'danger' });
    }
  };

  // Open Printable Shipping Slip for Rider
  const handlePrintLabel = (orderId) => {
    window.open(`${API_URL}/api/v1/logistics/label/${orderId}`, '_blank', 'width=450,height=650');
  };

  // Quick Restock Handler
  const handleQuickRestock = async (variantId, addedQty = 50) => {
    if (!variantId) return;
    try {
      const res = await fetch(`${API_URL}/api/catalog/variants/${variantId}/stock`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ addedQuantity: addedQty })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.product?._id) {
          setProductsList((current) => current.map((product) => product._id === data.product._id ? data.product : product));
        } else {
          await fetchData();
        }
        await showAlert({
          title: 'Stock updated',
          message: `${addedQty} units were added successfully. New stock: ${data.stockQuantity ?? 'updated'}.`,
          tone: 'success'
        });
      } else {
        await showAlert({ title: 'Restock failed', message: data.error || 'Stock could not be updated.', tone: 'danger' });
      }
    } catch (err) {
      console.error('Restock error', err);
      await showAlert({ title: 'Network error', message: 'Could not connect to the inventory service.', tone: 'danger' });
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (customerId) => {
    const confirmed = await showConfirm({
      title: 'Remove customer account?',
      message: 'This customer and their account access will be permanently removed. This action cannot be undone.',
      confirmLabel: 'Remove customer',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await ensureAdminAuth();
      const res = await fetch(`${API_URL}/api/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setCustomersList(prev => prev.filter(c => c._id !== customerId));
        await showAlert({ title: 'Customer removed', message: 'The customer account was removed successfully.', tone: 'success' });
      } else {
        const errData = await res.json().catch(() => ({}));
        await showAlert({ title: 'Could not remove customer', message: errData.error || 'Please try again.', tone: 'danger' });
      }
    } catch (err) {
      console.error('Delete customer error', err);
      await showAlert({ title: 'Network error', message: 'Could not remove the customer. Please check the backend connection.', tone: 'danger' });
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
    const confirmed = await showConfirm({
      title: 'Delete coupon?',
      message: 'Customers will no longer be able to apply this coupon.',
      confirmLabel: 'Delete coupon',
      tone: 'danger'
    });
    if (!confirmed) return;
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
    const confirmed = await showConfirm({
      title: 'Delete customer review?',
      message: 'This review will be permanently removed from the storefront.',
      confirmLabel: 'Delete review',
      tone: 'danger'
    });
    if (!confirmed) return;
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
    const confirmed = await showConfirm({
      title: 'Delete storefront banner?',
      message: 'This banner will be removed from the customer storefront.',
      confirmLabel: 'Delete banner',
      tone: 'danger'
    });
    if (!confirmed) return;
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
    const title = newProduct.title.trim();
    const price = Number(newProduct.basePrice);
    const stock = Number(newProduct.stockQuantity);

    if (!title) {
      setProductFormError('Enter a product title to continue.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setProductFormError('Enter a valid price greater than ₹0.');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setProductFormError('Initial stock cannot be negative.');
      return;
    }

    setProductFormError('');
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await fetch(`${API_URL}/api/catalog/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          brand: newProduct.brand || 'FreshCart Select',
          category_name: newProduct.categoryName,
          base_price: price,
          description: newProduct.description,
          variants: [
            {
              sku: `FC-${Date.now().toString().slice(-6)}`,
              price,
              stock_quantity: stock
            }
          ]
        })
      });

      if (res.ok) {
        setShowAddProductModal(false);
        setNewProduct({
          title: '',
          brand: '',
          categoryName: 'Dairy & Breakfast',
          basePrice: '',
          stockQuantity: 50,
          description: ''
        });
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        setProductFormError(data.error || 'Product could not be created. Please try again.');
      }
    } catch (err) {
      console.error('Create product error', err);
      setProductFormError('Server connection failed. Please try again.');
    }
  };

  const handleUpdateProduct = async (product, values) => {
    const currentVariants = product.variants || [];
    const updatedVariants = currentVariants.length > 0
      ? currentVariants.map((variant, index) => index === 0 ? {
          ...variant,
          sku: values.sku.trim().toUpperCase(),
          price: Number(values.basePrice),
          stockQuantity: Number(values.stockQuantity),
          stockOnHand: Number(values.stockQuantity),
          safetyStock: Number(values.safetyStock)
        } : variant)
      : [{
          sku: values.sku.trim().toUpperCase() || `FC-${Date.now().toString().slice(-6)}`,
          price: Number(values.basePrice),
          stockQuantity: Number(values.stockQuantity),
          stockOnHand: Number(values.stockQuantity),
          safetyStock: Number(values.safetyStock),
          isActive: true
        }];

    try {
      const res = await fetch(`${API_URL}/api/catalog/products/${product._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: values.title.trim(),
          brand: values.brand.trim(),
          categoryName: values.categoryName.trim() || 'General',
          basePrice: Number(values.basePrice),
          description: values.description.trim(),
          isPublished: values.isPublished,
          variants: updatedVariants
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await showAlert({ title: 'Update failed', message: data.error || 'Product could not be updated.', tone: 'danger' });
        return false;
      }
      setProductsList((current) => current.map((item) => item._id === product._id ? data : item));
      await showAlert({ title: 'Product updated', message: 'Inventory and storefront details were saved.', tone: 'success' });
      return true;
    } catch (error) {
      await showAlert({ title: 'Network error', message: 'Could not update this product.', tone: 'danger' });
      return false;
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = await showConfirm({
      title: 'Delete product?',
      message: `${product.title} will be permanently removed from inventory and the storefront.`,
      confirmLabel: 'Delete product',
      tone: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/catalog/products/${product._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await showAlert({ title: 'Delete failed', message: data.error || 'Product could not be deleted.', tone: 'danger' });
        return;
      }
      setProductsList((current) => current.filter((item) => item._id !== product._id));
      setSelectedProductId(null);
      inventoryListReturnRef.current.openedFromList = false;
      navigate('/admin?tab=inventory', { replace: true });
      await showAlert({ title: 'Product deleted', message: 'The product was removed successfully.', tone: 'success' });
    } catch (error) {
      await showAlert({ title: 'Network error', message: 'Could not delete this product.', tone: 'danger' });
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
    const query = `${searchQuery} ${inventorySearch}`.trim().toLowerCase();
    const result = productsList.filter((product) => {
      const variant = product.variants?.[0] || {};
      const stock = Number(variant.stockQuantity ?? variant.stockOnHand ?? 0);
      const safetyStock = Number(variant.safetyStock ?? 10);
      const matchesSearch = !query || [product.title, product.categoryName, product.brand, variant.sku]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesCategory = inventoryCategory === 'all' || product.categoryName === inventoryCategory;
      const matchesStock = inventoryStock === 'all'
        || (inventoryStock === 'in-stock' && stock > safetyStock)
        || (inventoryStock === 'low-stock' && stock > 0 && stock <= safetyStock)
        || (inventoryStock === 'out-of-stock' && stock <= 0);
      return matchesSearch && matchesCategory && matchesStock;
    });

    return result.sort((a, b) => {
      const aVariant = a.variants?.[0] || {};
      const bVariant = b.variants?.[0] || {};
      if (inventorySort === 'title-desc') return String(b.title).localeCompare(String(a.title));
      if (inventorySort === 'price-low') return Number(a.basePrice || aVariant.price || 0) - Number(b.basePrice || bVariant.price || 0);
      if (inventorySort === 'price-high') return Number(b.basePrice || bVariant.price || 0) - Number(a.basePrice || aVariant.price || 0);
      if (inventorySort === 'stock-low') return Number(aVariant.stockQuantity || 0) - Number(bVariant.stockQuantity || 0);
      if (inventorySort === 'stock-high') return Number(bVariant.stockQuantity || 0) - Number(aVariant.stockQuantity || 0);
      if (inventorySort === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return String(a.title).localeCompare(String(b.title));
    });
  }, [productsList, searchQuery, inventorySearch, inventoryCategory, inventoryStock, inventorySort]);

  const inventoryCategories = useMemo(
    () => [...new Set(productsList.map((product) => product.categoryName).filter(Boolean))].sort(),
    [productsList]
  );

  const resetInventoryControls = () => {
    setInventorySearch('');
    setInventoryCategory('all');
    setInventoryStock('all');
    setInventorySort('title-asc');
  };

  const exportInventoryCsv = () => {
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = filteredProducts.map((product) => {
      const variant = product.variants?.[0] || {};
      const stock = Number(variant.stockQuantity ?? variant.stockOnHand ?? 0);
      return [product.title, variant.sku, product.categoryName, product.brand, product.basePrice || variant.price || 0, stock, stock <= Number(variant.safetyStock ?? 10) ? 'Low stock' : 'In stock'];
    });
    const csv = [
      ['Product Title', 'SKU', 'Category', 'Brand', 'Price', 'Current Stock', 'Status'],
      ...rows
    ].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `freshcart-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleInventoryCsvImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      await showAlert({ title: 'Invalid file', message: 'Please choose a CSV file exported from FreshCart.', tone: 'danger' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      await showAlert({ title: 'File too large', message: 'CSV files must be smaller than 10 MB.', tone: 'danger' });
      return;
    }

    setIsImportingInventory(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const uploadResponse = await fetch(`${API_URL}/api/catalog/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadData.jobId) {
        throw new Error(uploadData.error || 'CSV upload could not be started.');
      }

      let job = null;
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 750));
        const statusResponse = await fetch(`${API_URL}/api/catalog/bulk-upload/${uploadData.jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        job = await statusResponse.json().catch(() => ({}));
        if (!statusResponse.ok) throw new Error(job.error || 'Could not read import progress.');
        if (job.status === 'completed' || job.status === 'failed') break;
      }

      if (!job || (job.status !== 'completed' && job.status !== 'failed')) {
        throw new Error('Import is taking longer than expected. Please refresh inventory shortly.');
      }
      if (job.status === 'failed') {
        throw new Error(job.errors?.[0]?.general || 'CSV import failed.');
      }

      await fetchData();
      const failedText = job.failedRows ? ` ${job.failedRows} row(s) failed validation.` : '';
      await showAlert({
        title: 'CSV import complete',
        message: `${job.processedRows || 0} product row(s) imported successfully.${failedText}`,
        tone: job.failedRows ? 'danger' : 'success'
      });
    } catch (error) {
      await showAlert({ title: 'Import failed', message: error.message || 'Could not import this CSV file.', tone: 'danger' });
    } finally {
      setIsImportingInventory(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customersList.filter(c => {
      return searchQuery === '' ||
        (c.fullName && c.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [customersList, searchQuery]);

  const selectedCustomer = useMemo(
    () => customersList.find((customer) => customer._id === selectedCustomerId) || null,
    [customersList, selectedCustomerId]
  );

  const selectedCustomerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return ordersList.filter((order) => {
      const orderCustomerId = order.customerId?._id || order.customerId;
      return String(orderCustomerId || '') === String(selectedCustomer._id) || order.phoneNumber === selectedCustomer.phone;
    });
  }, [ordersList, selectedCustomer]);

  const selectedProduct = useMemo(
    () => productsList.find((product) => product._id === selectedProductId) || null,
    [productsList, selectedProductId]
  );

  const openProductDetails = (productId) => {
    inventoryListReturnRef.current = {
      scrollY: window.scrollY,
      productId,
      openedFromList: true
    };
    navigate(`/admin?tab=inventory&product=${encodeURIComponent(productId)}`);
  };

  const closeProductDetails = () => {
    if (inventoryListReturnRef.current.openedFromList) {
      navigate(-1);
      return;
    }
    navigate('/admin?tab=inventory', { replace: true });
  };

  const openCustomerDetails = (customerId) => {
    customerListReturnRef.current = {
      scrollY: window.scrollY,
      customerId,
      openedFromList: true
    };
    navigate(`/admin?tab=customers&customer=${encodeURIComponent(customerId)}`);
  };

  const closeCustomerDetails = () => {
    if (customerListReturnRef.current.openedFromList) {
      navigate(-1);
      return;
    }
    navigate('/admin?tab=customers', { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const customerId = params.get('customer');
    const productId = params.get('product');
    const requestedTab = params.get('tab');

    if (customerId) {
      setActiveTab('customers');
      setSelectedCustomerId(customerId);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    if (productId) {
      setActiveTab('inventory');
      setSelectedProductId(productId);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    if (requestedTab) setActiveTab(requestedTab);

    if (selectedCustomerId) {
      const returnTarget = customerListReturnRef.current;
      setSelectedCustomerId(null);
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: returnTarget.scrollY, behavior: 'auto' });
        window.setTimeout(() => {
          const row = document.querySelector(`[data-customer-id="${returnTarget.customerId}"]`);
          row?.focus({ preventScroll: true });
          if (row) {
            const rect = row.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) row.scrollIntoView({ block: 'center', behavior: 'auto' });
          }
        }, 0);
      });
    }

    if (selectedProductId) {
      const returnTarget = inventoryListReturnRef.current;
      setSelectedProductId(null);
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: returnTarget.scrollY, behavior: 'auto' });
        window.setTimeout(() => {
          const row = document.querySelector(`[data-product-id="${returnTarget.productId}"]`);
          row?.focus({ preventScroll: true });
          if (row) {
            const rect = row.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) row.scrollIntoView({ block: 'center', behavior: 'auto' });
          }
        }, 0);
      });
    }
  }, [location.search]);

  // Render Sidebar Navigation Content (Shared between Desktop & Mobile Off-canvas Drawer)
  const renderSidebarContent = (isMobile = false) => (
    <div className="admin-sidebar-content flex flex-col justify-between h-full overflow-y-auto">
      <div>
        {/* Logo & Mobile Close */}
        <div className="admin-brand flex items-center justify-between px-2 py-3 mb-4 sm:mb-6">
          <div className="admin-brand-lockup flex items-center gap-3">
            <div className="admin-brand-mark w-10 h-10 rounded-2xl bg-[#00B074] flex items-center justify-center text-white shadow-md shadow-[#00B074]/30">
              <ShoppingBag size={22} strokeWidth={2.4} />
            </div>
            <div className="admin-brand-copy">
              <h1 className="admin-brand-name text-xl font-black text-slate-900 tracking-tight leading-none">FreshCart</h1>
              <span className="admin-brand-role text-[10px] font-bold text-emerald-600 tracking-wider uppercase mt-1 inline-block">
                Super Admin
              </span>
            </div>
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition lg:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Group 1: MAIN */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main</p>
          <nav className="space-y-1">
            {/* Dashboard */}
            <button
              onClick={() => { setActiveTab('dashboard'); if (isMobile) setIsMobileNavOpen(false); }}
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
              onClick={() => { setActiveTab('orders'); if (isMobile) setIsMobileNavOpen(false); }}
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
              onClick={() => {
                setActiveTab('inventory');
                setSelectedProductId(null);
                navigate('/admin?tab=inventory');
                if (isMobile) setIsMobileNavOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('customers');
                setSelectedCustomerId(null);
                navigate('/admin?tab=customers');
                if (isMobile) setIsMobileNavOpen(false);
              }}
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

            {/* Delivery Geofence Zones */}
            <button
              onClick={() => { setActiveTab('delivery-zone'); if (isMobile) setIsMobileNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'delivery-zone'
                  ? 'bg-[#E8F8F0] text-[#00B074] font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`w-5 h-5 flex items-center justify-center ${activeTab === 'delivery-zone' ? 'text-[#00B074]' : 'text-slate-400'}`}>
                <Navigation size={18} />
              </div>
              <span>Delivery Zones</span>
            </button>

            {/* Reports & Analytics */}
            <button
              onClick={() => { setActiveTab('reports'); if (isMobile) setIsMobileNavOpen(false); }}
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

            {/* Coupons & Promo Codes */}
            <button
              onClick={() => { setActiveTab('coupons'); if (isMobile) setIsMobileNavOpen(false); }}
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
              onClick={() => { setActiveTab('reviews'); if (isMobile) setIsMobileNavOpen(false); }}
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
              onClick={() => { setActiveTab('banners'); if (isMobile) setIsMobileNavOpen(false); }}
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

          </nav>
        </div>

        {/* Group 2: OTHER */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Other</p>
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('settings'); if (isMobile) setIsMobileNavOpen(false); }}
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
              onClick={() => { setShowSupportModal(true); if (isMobile) setIsMobileNavOpen(false); }}
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
      <div className="admin-sidebar-promo mt-6 p-4 rounded-3xl bg-gradient-to-br from-[#E2F7ED] via-[#D1F2E2] to-[#B9ECCE] border border-[#A5E5C4] relative overflow-hidden shadow-sm shrink-0">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-[#00B074]/10 blur-md pointer-events-none" />
        <h4 className="text-sm font-black text-slate-900 leading-snug">Need Help?</h4>
        <p className="text-xs text-slate-600 font-medium mt-0.5 mb-3.5 leading-relaxed">
          Contact support team
        </p>
        <button
          type="button"
          onClick={() => { setShowSupportModal(true); if (isMobile) setIsMobileNavOpen(false); }}
          className="w-full py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
        >
          <span>Get Support</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell min-h-screen bg-[#F4F7FB] text-slate-800 flex font-sans antialiased overflow-x-hidden">

      {/* ========================================================================= */}
      {/* 1. MOBILE NAVIGATION DRAWER (Off-canvas overlay for tablets & smartphones) */}
      {/* ========================================================================= */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 p-4 sm:p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* ========================================================================= */}
      {/* 2. DESKTOP PERMANENT SIDEBAR                                              */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex lg:w-64 bg-white border-r border-slate-100 flex-col justify-between p-5 shrink-0 select-none">
        {renderSidebarContent(false)}
      </aside>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT AREA                                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden overflow-y-auto">

        {/* TOP BAR HEADER */}
        <header className="admin-topbar bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 sticky top-0 transition-all max-w-full overflow-visible">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                <span className="sm:hidden">{activeTabMeta.shortTitle}</span>
                <span className="hidden sm:inline">{activeTabMeta.title} Overview</span>
              </h2>
              <p className="hidden md:block text-xs text-slate-500 font-medium truncate">
                Live store operations and controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="sm:hidden w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle Search"
            >
              <Search size={16} />
            </button>

            {/* Desktop / Tablet Search Bar */}
            <div className="relative hidden sm:block w-36 md:w-56 lg:w-80 transition-all">
              <Search size={15} className="absolute left-3.5 top-2.5 sm:top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTabMeta.searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
              />
            </div>

            {/* Notification Bell */}
            <div className="admin-notification-anchor relative">
              <button
                type="button"
                onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
                aria-label="Notifications"
              >
                <Bell size={17} />
                {(metrics.lowStockCount > 0 || metrics.pendingOrders > 0) && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDrawer && (
                <div className="admin-notification-menu absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4">
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

            {/* Admin identity only. Settings, support and logout live in the sidebar. */}
            <div className="admin-profile-identity flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-1.5 sm:pr-3 py-1 sm:py-1.5 border border-slate-200">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-tight shrink-0">
                  {getInitials(metrics.adminName || localStorage.getItem('fullName') || 'Super Admin')}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px] md:max-w-[140px]">
                    {metrics.adminName || localStorage.getItem('fullName') || 'Super Admin'}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[100px] md:max-w-[140px]">
                    {metrics.adminEmail || localStorage.getItem('adminEmail') || 'admin@freshcart.com'}
                  </p>
                </div>
            </div>

          </div>
        </header>

        {/* Expandable Mobile Search Bar */}
        {showMobileSearch && (
          <div className="sm:hidden px-3.5 py-2.5 bg-white border-b border-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, orders, products..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 1: FRESH CART DASHBOARD OVERVIEW (Exact replica of screenshot)     */}
        {/* ===================================================================== */}
        {activeTab === 'dashboard' && (
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">

            {/* TOP 4 METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              
              {/* Card 1: Total Revenue (Featured Green Card) */}
              <div className="admin-metric-card admin-metric-card--accent bg-[#00B074] text-white p-5 rounded-3xl shadow-lg shadow-[#00B074]/20 relative overflow-hidden flex flex-col justify-between">
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
              <div className="admin-metric-card bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
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
              <div className="admin-metric-card bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
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
              <div className="admin-metric-card bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
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
              <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
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
              <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between overflow-hidden">
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
                    <svg viewBox="0 0 100 100" className="admin-sales-donut w-full h-full -rotate-90">
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
              <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
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
              <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
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

                {/* Mobile Recent Orders List (sm:hidden) */}
                <div className="block sm:hidden space-y-2.5">
                  {metrics.recentOrders.map((ord, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm shrink-0">
                          {ord.image || '🛍️'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{ord.productName}</p>
                          <p className="text-[10px] text-slate-400">{ord.customer} • {ord.date}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-black text-slate-900 block">${ord.price}</span>
                        <span className="px-2 py-0.5 bg-[#E8F8F0] text-[#00B074] rounded-full font-black text-[9px]">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Recent Orders Table (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
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
          <main className="admin-orders-main p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <OrderPipelineBoard
              orders={ordersList}
              searchQuery={searchQuery}
              onUpdateStatus={handleUpdateOrderStatus}
              onPrintLabel={handlePrintLabel}
            />
            <div className="admin-inventory-header">
              <div className="admin-inventory-header__title">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Live Order Fulfillment</h3>
                <p className="text-xs text-slate-500 font-medium">Manage pending dispatches and customer shipments</p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {['all', 'pending', 'packed', 'delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition shrink-0 ${
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

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#00B074] flex items-center justify-center mb-3">
                  <ShoppingCart size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Orders in Live Fulfillment</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  New customer orders placed from the storefront will appear here instantly for packing & dispatch.
                </p>
              </div>
            ) : (
              <div>
                {/* Mobile Orders Card View (sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {filteredOrders.map((ord) => (
                    <div key={ord._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{ord.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          (ord.status || ord.orderStatus) === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : (ord.status || ord.orderStatus) === 'packed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {ord.status || ord.orderStatus}
                        </span>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">{ord.customerName}</p>
                        <p className="text-slate-400 text-[11px]">{ord.phoneNumber}</p>
                      </div>
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                        {ord.items && ord.items.length > 0
                          ? `${ord.items[0].productTitleSnapshot} ${ord.items.length > 1 ? `(+${ord.items.length - 1} more)` : ''}`
                          : (ord.products && ord.products.length > 0 ? ord.products[0].productName : 'Grocery items')}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-xs font-black text-slate-900">₹{Number(ord.totalAmount || ord.subtotal || 0).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold ml-1.5">{ord.paymentMethod || 'COD'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePrintLabel(ord._id)}
                            className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px]"
                          >
                            🖨️ Label
                          </button>
                          {(ord.status || ord.orderStatus) === 'pending' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord._id, 'packed')}
                              className="px-2 py-1 bg-[#00B074] text-white rounded-lg font-bold text-[10px]"
                            >
                              Pack
                            </button>
                          )}
                          {(ord.status || ord.orderStatus) === 'packed' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord._id, 'delivered')}
                              className="px-2 py-1 bg-blue-600 text-white rounded-lg font-bold text-[10px]"
                            >
                              Deliver
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Orders Table View (hidden sm:block) */}
                <div className="hidden sm:block bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[680px]">
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
                        {filteredOrders.map((ord) => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 3: INVENTORY & CATALOG VIEW                                      */}
        {/* ===================================================================== */}
        {activeTab === 'inventory' && !selectedProduct && (
          <main className={`admin-inventory-main p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8 ${showAddProductModal ? 'admin-inventory-main--drawer-open' : ''}`}>
            <div className="admin-inventory-header">
              <section className="admin-inventory-toolbar" aria-label="Inventory controls">
              <label className="admin-inventory-search">
                <Search size={15} />
                <input
                  type="search"
                  value={inventorySearch}
                  onChange={(event) => setInventorySearch(event.target.value)}
                  placeholder="Search product, SKU or brand"
                  aria-label="Search inventory"
                />
              </label>

              <label className="admin-inventory-control">
                <Filter size={14} />
                <select value={inventoryCategory} onChange={(event) => setInventoryCategory(event.target.value)} aria-label="Filter by category">
                  <option value="all">All categories</option>
                  {inventoryCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>

              <label className="admin-inventory-control">
                <Filter size={14} />
                <select value={inventoryStock} onChange={(event) => setInventoryStock(event.target.value)} aria-label="Filter by stock status">
                  <option value="all">All stock</option>
                  <option value="in-stock">In stock</option>
                  <option value="low-stock">Low stock</option>
                  <option value="out-of-stock">Out of stock</option>
                </select>
              </label>

              <label className="admin-inventory-control">
                <ArrowUpDown size={14} />
                <select value={inventorySort} onChange={(event) => setInventorySort(event.target.value)} aria-label="Sort inventory">
                  <option value="title-asc">Name A–Z</option>
                  <option value="title-desc">Name Z–A</option>
                  <option value="newest">Newest first</option>
                  <option value="price-low">Price low–high</option>
                  <option value="price-high">Price high–low</option>
                  <option value="stock-low">Stock low–high</option>
                  <option value="stock-high">Stock high–low</option>
                </select>
              </label>

              <div className="admin-inventory-toolbar__actions">
                <span><strong>{filteredProducts.length}</strong> of {productsList.length}</span>
                <button type="button" onClick={resetInventoryControls}>Reset</button>
                <button type="button" onClick={exportInventoryCsv} disabled={filteredProducts.length === 0} className="admin-inventory-export">
                  <Download size={14} /> Export CSV
                </button>
                <input
                  ref={inventoryCsvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleInventoryCsvImport}
                  className="sr-only"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={() => inventoryCsvInputRef.current?.click()}
                  disabled={isImportingInventory}
                  className="admin-inventory-import"
                >
                  <Upload size={14} /> {isImportingInventory ? 'Importing...' : 'Import CSV'}
                </button>
                <button
                  type="button"
                  onClick={() => { setProductFormError(''); setShowAddProductModal(true); }}
                  className="admin-inventory-add-button"
                >
                  <Plus size={15} /> Add New Product
                </button>
              </div>
              </section>
            </div>

            <div className={`admin-inventory-workspace ${showAddProductModal ? 'admin-inventory-workspace--editing' : ''}`}>
              <div className="admin-inventory-list space-y-5 sm:space-y-6">
            {/* Low stock alerts banner */}
            {alertsList.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-black text-amber-900">Low Stock Warning</h5>
                    <p className="text-[11px] text-amber-700">{alertsList.length} items require immediate restocking.</p>
                  </div>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto"
                >
                  Refresh Alerts
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#00B074] flex items-center justify-center mb-3">
                  <Package size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Products Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Click "Add New Product" above to add new grocery items to your catalog.
                </p>
              </div>
            ) : (
              <div>
                {/* Mobile Products Cards (sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {filteredProducts.map((p) => {
                    const variant = (p.variants && p.variants[0]) || {};
                    const stock = variant.stockQuantity !== undefined ? variant.stockQuantity : 45;
                    const isLow = stock < (variant.safetyStock || 10);
                    return (
                      <div
                        key={p._id}
                        data-product-id={p._id}
                        className="admin-product-row bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2.5"
                        role="button"
                        tabIndex={0}
                        onClick={() => openProductDetails(p._id)}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openProductDetails(p._id); }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm text-slate-900 leading-snug">{p.title}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{variant.sku || 'SKU-GEN'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                            isLow ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div>
                            <span className="text-[11px] text-slate-500 font-medium">{p.categoryName || 'General'}</span>
                            <p className="font-black text-sm text-slate-900 mt-0.5">₹{p.basePrice || variant.price || 0}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                              {stock} units
                            </span>
                            {variant._id && (
                              <button
                                onClick={(event) => { event.stopPropagation(); handleQuickRestock(variant._id, 50); }}
                                className="mt-1 block px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-[#00B074] rounded-lg font-bold text-[10px] transition text-slate-700"
                              >
                                +50 Qty
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Products Table (hidden sm:block) */}
                <div className="hidden sm:block bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="admin-inventory-table w-full text-left min-w-[620px]">
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
                        {filteredProducts.map((p) => {
                          const variant = (p.variants && p.variants[0]) || {};
                          const stock = variant.stockQuantity !== undefined ? variant.stockQuantity : 45;
                          const isLow = stock < (variant.safetyStock || 10);
                          return (
                            <tr
                              key={p._id}
                              data-product-id={p._id}
                              className="admin-product-row hover:bg-slate-50 transition"
                              tabIndex={0}
                              onClick={() => openProductDetails(p._id)}
                              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openProductDetails(p._id); }}
                            >
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
                                    onClick={(event) => { event.stopPropagation(); handleQuickRestock(variant._id, 50); }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-[#00B074] rounded-lg font-bold text-[11px] transition text-slate-600 inline-flex items-center gap-1"
                                  >
                                    <RefreshCw size={12} />
                                    <span>+50 Qty</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
              </div>

              {showAddProductModal && (
                <ProductEditorPanel
                  value={newProduct}
                  error={productFormError}
                  onChange={setNewProduct}
                  onSubmit={handleCreateProduct}
                  onClose={() => { setProductFormError(''); setShowAddProductModal(false); }}
                />
              )}
            </div>
          </main>
        )}

        {activeTab === 'inventory' && selectedProduct && (
          <main className="admin-product-detail-main p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            <ProductDetailPanel
              product={selectedProduct}
              onBack={closeProductDetails}
              onSave={(values) => handleUpdateProduct(selectedProduct, values)}
              onDelete={() => handleDeleteProduct(selectedProduct)}
              onRestock={handleQuickRestock}
            />
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 4: CUSTOMERS MANAGEMENT VIEW                                     */}
        {/* ===================================================================== */}
        {activeTab === 'customers' && !selectedCustomer && (
          <main className="admin-customers-main p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Customer & Buyer Accounts</h3>
                <p className="text-xs text-slate-500 font-medium">Inspect registered users, spend metrics, and accounts</p>
              </div>
              <span className="px-3 py-1.5 bg-[#E8F8F0] text-[#00B074] text-xs font-black rounded-xl self-start sm:self-auto">
                {customersList.length} Active Buyers
              </span>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#00B074] flex items-center justify-center mb-3">
                  <Users size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Customers Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Registered customer and buyer accounts will show up here.
                </p>
              </div>
            ) : (
              <div>
                {/* Mobile Customers Cards (sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {filteredCustomers.map((cust) => (
                    <div
                      key={cust._id}
                      data-customer-id={cust._id}
                      className="admin-customer-card bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3"
                      role="button"
                      tabIndex={0}
                      onClick={() => openCustomerDetails(cust._id)}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openCustomerDetails(cust._id); }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#00B074] flex items-center justify-center font-bold text-sm">
                            {cust.fullName ? cust.fullName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 leading-none">{cust.fullName || 'Registered User'}</p>
                            <span className="text-[10px] text-slate-400 font-medium">Customer Account</span>
                          </div>
                        </div>
                        <button
                          onClick={(event) => { event.stopPropagation(); handleDeleteCustomer(cust._id); }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Remove customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone</span>
                          <span className="font-semibold text-slate-800">{cust.phone ? `+91 ${cust.phone}` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                          <span className="font-semibold text-slate-800 truncate block" title={cust.email}>{cust.email || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5 text-xs">
                        <span className="text-slate-500">
                          Orders: <strong className="text-slate-900">{cust.ordersCount || 0}</strong>
                        </span>
                        <span className="text-slate-500">
                          Lifetime Spend: <strong className="text-slate-900 font-black">₹{Number(cust.totalSpend || 0).toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Customers Table (hidden sm:block) */}
                <div className="hidden sm:block bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="admin-customers-table w-full text-left min-w-[760px]">
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
                        {filteredCustomers.map((cust) => (
                          <tr
                            key={cust._id}
                            data-customer-id={cust._id}
                            className="admin-customer-row hover:bg-slate-50 transition"
                            tabIndex={0}
                            onClick={() => openCustomerDetails(cust._id)}
                            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openCustomerDetails(cust._id); }}
                          >
                            <td className="p-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                  {cust.fullName ? cust.fullName[0] : 'U'}
                                </div>
                                <span>{cust.fullName}</span>
                              </div>
                            </td>
                            <td className="p-4 font-medium text-slate-600">{cust.phone || 'N/A'}</td>
                            <td className="p-4 font-medium text-slate-500">{cust.email || 'N/A'}</td>
                            <td className="p-4 font-bold text-slate-900">{cust.ordersCount || 0}</td>
                            <td className="p-4 font-black text-slate-900">₹{Number(cust.totalSpend || 0).toFixed(2)}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={(event) => { event.stopPropagation(); handleDeleteCustomer(cust._id); }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                title="Remove customer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {activeTab === 'customers' && selectedCustomer && (
          <main className="admin-customer-detail-main p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            <CustomerDetailPanel
              customer={selectedCustomer}
              orders={selectedCustomerOrders}
              onClose={closeCustomerDetails}
            />
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW: COUPONS & DISCOUNTS MANAGEMENT                                  */}
        {/* ===================================================================== */}
        {activeTab === 'coupons' && (
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Promotions & Coupon Vouchers</h3>
                <p className="text-xs text-slate-500 font-medium">Create and manage percentage or fixed discounts, minimum cart values, and limits</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCouponModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus size={15} />
                <span>Create New Coupon</span>
              </button>
            </div>

            {couponsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#00B074] flex items-center justify-center mb-3">
                  <Tag size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Coupons Created</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Click "Create New Coupon" above to add promotional discount vouchers.
                </p>
              </div>
            ) : (
              <div>
                {/* Mobile Coupons Card View (sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {couponsList.map((coupon) => (
                    <div key={coupon._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-emerald-50 text-[#00B074] font-mono font-black text-xs rounded-lg border border-emerald-200">
                            {coupon.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            coupon.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete coupon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div>
                        <span className="font-black text-base text-slate-900 block">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} FLAT`}
                        </span>
                        {coupon.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{coupon.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Min Order</span>
                          <span className="font-bold text-slate-800">₹{coupon.minOrderAmount || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Max Cap</span>
                          <span className="font-bold text-slate-800">{coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount}` : 'None'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Usage</span>
                          <span className="font-bold text-slate-800">{coupon.usedCount || 0}/{coupon.usageLimit || '∞'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Coupons Table View (hidden sm:block) */}
                <div className="hidden sm:block bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
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
                        {couponsList.map((coupon) => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW: REVIEWS & MODERATION MANAGEMENT                                 */}
        {/* ===================================================================== */}
        {activeTab === 'reviews' && (
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Customer Ratings & Reviews</h3>
                <p className="text-xs text-slate-500 font-medium">Moderate customer feedback, approve ratings, and manage public testimonials</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1.5 bg-[#E8F8F0] text-[#00B074] text-xs font-black rounded-xl">
                  {reviewsList.length} Total Reviews
                </span>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsList.length === 0 ? (
                <div className="bg-white p-8 sm:p-12 text-center rounded-3xl border border-slate-100 shadow-xs text-slate-400">
                  <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">No reviews submitted yet</p>
                  <p className="text-xs text-slate-400 mt-1">Customer reviews submitted on product pages will appear here for moderation.</p>
                </div>
              ) : (
                reviewsList.map((rev) => (
                  <div key={rev._id} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
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

                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400 font-medium flex-wrap">
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
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Storefront Hero Banners</h3>
                <p className="text-xs text-slate-500 font-medium">Control homepage carousel banners, promotional badges, and action buttons</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddBannerModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5"
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

                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border-t border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full shrink-0 ${
                          banner.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {banner.isActive ? 'Live on Store' : 'Hidden'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px] sm:max-w-xs">Link: {banner.ctaLink}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <button
                          onClick={() => handleToggleBanner(banner._id, banner.isActive)}
                          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition text-center ${
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
                          <Trash2 size={16} />
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
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Sales & Financial Analytics</h3>
              <p className="text-xs text-slate-500 font-medium">Deep-dive financial breakdown across categories and products</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">Average Order Value</span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">₹425.50</h4>
                <p className="text-xs font-bold text-[#00B074] mt-2">↑ 6.4% from last month</p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">Order Fulfillment Rate</span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">98.2%</h4>
                <p className="text-xs font-bold text-[#00B074] mt-2">↑ 1.2% improvement</p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs sm:col-span-2 md:col-span-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Inventory Value</span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">₹1,24,500</h4>
                <p className="text-xs font-bold text-slate-500 mt-2">Across 1,247 products</p>
              </div>
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW 6: SETTINGS & SUPER ADMIN AUTH MANAGEMENT                         */}
        {/* ===================================================================== */}
        {activeTab === 'settings' && (
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 lg:pb-8">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Super Admin Profile & Security</h3>
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

            <div className="max-w-2xl bg-white p-4 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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
                    className="w-full sm:w-auto px-6 py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-md shadow-[#00B074]/20 flex items-center justify-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </main>
        )}

        {/* ===================================================================== */}
        {/* VIEW: DELIVERY ZONE GEOFENCE POLYGON MANAGER                          */}
        {/* ===================================================================== */}
        {activeTab === 'delivery-zone' && (
          <main className="p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            <DeliveryZoneManager />
          </main>
        )}

        {/* ===================================================================== */}
        {/* MOBILE BOTTOM NAVIGATION BAR (Instant 1-tap switching on phones/tablets) */}
        {/* ===================================================================== */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 z-40 flex items-center justify-around shadow-lg shadow-slate-900/10">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition ${
              activeTab === 'dashboard' ? 'text-[#00B074]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="mt-0.5">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition relative ${
              activeTab === 'orders' ? 'text-[#00B074]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingCart size={18} />
            <span className="mt-0.5">Orders</span>
            {metrics.pendingOrders > 0 && (
              <span className="absolute top-0.5 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">
                {metrics.pendingOrders}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition relative ${
              activeTab === 'inventory' ? 'text-[#00B074]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package size={18} />
            <span className="mt-0.5">Stock</span>
            {metrics.lowStockCount > 0 && (
              <span className="absolute top-0.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivery-zone')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition ${
              activeTab === 'delivery-zone' ? 'text-[#00B074]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Navigation size={18} />
            <span className="mt-0.5">Zones</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <Menu size={18} />
            <span className="mt-0.5">More</span>
          </button>
        </nav>

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
              onClick={async () => {
                setShowSupportModal(false);
                await showAlert({
                  title: 'Request submitted',
                  message: 'The engineering desk will reach out shortly.',
                  tone: 'success'
                });
              }}
              className="w-full py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition shadow-sm"
            >
              Submit Priority Ticket
            </button>
          </div>
        </div>
      )}

      {/* Legacy fixed product drawer retained disabled while the inline editor is active. */}
      {false && (
        <aside className="admin-product-drawer" aria-label="Add new product panel">
          <div className="admin-product-drawer__panel bg-white p-6 relative overflow-y-auto">
            <button
              onClick={() => { setProductFormError(''); setShowAddProductModal(false); }}
              className="admin-product-drawer__close absolute right-4 top-4 p-1.5 text-slate-500 hover:text-black transition"
              aria-label="Close add product panel"
            >
              <X size={18} />
            </button>

            <p className="admin-product-drawer__eyebrow">INVENTORY / NEW ITEM</p>
            <h3 className="text-xl font-black text-slate-900 mb-1">Add new product</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Create a storefront item with pricing and opening stock.</p>

            {productFormError && <div className="admin-product-form-error" role="alert">{productFormError}</div>}

            <form onSubmit={handleCreateProduct} className="space-y-4" noValidate>
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

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
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
        </aside>
      )}

      {/* MODAL: ADD NEW COUPON */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
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
