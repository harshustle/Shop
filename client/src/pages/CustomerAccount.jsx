import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  Lock, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Save, 
  ShieldCheck, 
  AlertCircle,
  Truck,
  ExternalLink
} from 'lucide-react';
import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';
import CheckoutModal from '../components/CheckoutModal';
import { API_URL } from '../config';

const CustomerAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'addresses' | 'orders' | 'wishlist'
  const [accountData, setAccountData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' });
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phoneNumber: '',
    streetAddress: '',
    apartment: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    postalCode: '226010',
    isDefault: true
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  // Cart & Checkout
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch profile & addresses
      const accRes = await fetch(`${API_URL}/api/account/me`, { headers: getHeaders() });
      if (accRes.ok) {
        const data = await accRes.json();
        setAccountData(data);
        setProfileForm({
          fullName: data.user?.fullName || '',
          email: data.user?.email || '',
          phone: data.user?.phone || ''
        });

        // Fetch Wishlist products if any
        if (data.wishlist && data.wishlist.length > 0) {
          const wRes = await fetch(`${API_URL}/api/catalog/search?limit=50`);
          if (wRes.ok) {
            const allP = await wRes.json();
            setWishlistProducts((allP.products || []).filter(p => data.wishlist.includes(p._id)));
          }
        }
      }

      // Fetch user orders
      const userPhone = localStorage.getItem('userPhone');
      if (userPhone) {
        const ordRes = await fetch(`${API_URL}/api/orders/user/${userPhone}`, { headers: getHeaders() });
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(Array.isArray(ordData) ? ordData : []);
        }
      }
    } catch (err) {
      console.warn('Account fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setNotice({ type: '', text: '' });
    try {
      const res = await fetch(`${API_URL}/api/account/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNotice({ type: 'success', text: 'Profile details updated successfully!' });
        localStorage.setItem('fullName', profileForm.fullName);
      } else {
        setNotice({ type: 'error', text: data.error || 'Update failed' });
      }
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to communicate with server' });
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/account/addresses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(addressForm)
      });
      if (res.ok) {
        setShowAddressModal(false);
        setAddressForm({
          label: 'Home',
          fullName: '',
          phoneNumber: '',
          streetAddress: '',
          apartment: '',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          postalCode: '226010',
          isDefault: false
        });
        fetchData();
      }
    } catch (err) {
      console.error('Save address error', err);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await fetch(`${API_URL}/api/account/addresses/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Delete address error', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userPhone');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        
        {/* Top Account Header Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00B074] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#00B074]/20">
              {profileForm.fullName ? profileForm.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{profileForm.fullName || 'FreshCart Customer'}</h1>
              <p className="text-xs text-slate-500 font-medium">{profileForm.phone} • {profileForm.email || 'Verified Customer'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Navigation & Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                activeTab === 'profile' ? 'bg-[#E8F8F0] text-[#00B074]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={16} />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                activeTab === 'addresses' ? 'bg-[#E8F8F0] text-[#00B074]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin size={16} />
              <span>Saved Delivery Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                activeTab === 'orders' ? 'bg-[#E8F8F0] text-[#00B074]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Package size={16} />
              <span>My Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                activeTab === 'wishlist' ? 'bg-[#E8F8F0] text-[#00B074]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart size={16} />
              <span>Wishlist ({wishlistProducts.length})</span>
            </button>
          </aside>

          {/* Tab View Contents */}
          <div className="lg:col-span-3">

            {/* TAB 1: PROFILE SETTINGS */}
            {activeTab === 'profile' && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500 font-medium">Update your account details and contact preferences</p>
                </div>

                {notice.text && (
                  <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    notice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{notice.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number (Registered)</label>
                    <input
                      type="tel"
                      disabled
                      value={profileForm.phone}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-medium text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Saved Delivery Addresses</h3>
                    <p className="text-xs text-slate-500 font-medium">Manage Home, Office, and alternate dispatch locations</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="px-4 py-2 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={15} />
                    <span>Add New Address</span>
                  </button>
                </div>

                {(!accountData?.addresses || accountData.addresses.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl">
                    <MapPin size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-600">No addresses saved yet.</p>
                    <p className="text-[11px] text-slate-400">Add an address for lightning fast 1-click checkout.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accountData.addresses.map((addr) => (
                      <div key={addr._id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-white text-slate-800 text-[10px] font-black rounded-md uppercase border border-slate-200">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-black text-[#00B074]">Default</span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{addr.fullName}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {addr.streetAddress}, {addr.apartment && `${addr.apartment}, `}{addr.city}, {addr.state} - {addr.postalCode}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">Phone: {addr.phoneNumber}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-end">
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-rose-500 hover:text-rose-700 p-1 transition text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">Order History & Tracking</h3>
                  <p className="text-xs text-slate-500 font-medium">Review your previous grocery deliveries and live fulfillment updates</p>
                </div>

                {orders.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl space-y-2">
                    <p className="text-3xl">📦</p>
                    <h4 className="text-xs font-bold text-slate-700">No orders placed yet</h4>
                    <p className="text-[11px] text-slate-400">Your delivered items and invoices will appear here.</p>
                    <Link to="/shop" className="inline-block mt-3 px-5 py-2 bg-[#00B074] text-white rounded-xl text-xs font-black">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div key={ord._id} className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 transition space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-black text-slate-900">Order {ord.orderNumber}</span>
                            <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                              Placed on {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                            (ord.status || ord.orderStatus) === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {ord.status || ord.orderStatus}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 font-medium">
                          {ord.items && ord.items.length > 0 ? (
                            ord.items.map((it, idx) => (
                              <span key={idx} className="block">• {it.productTitleSnapshot} x {it.quantity} (₹{it.totalLinePrice})</span>
                            ))
                          ) : (
                            <span>Grocery Cart Package</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="font-black text-slate-900">Total: ₹{ord.totalAmount || ord.subtotal}</span>
                          <span className="text-[11px] font-bold text-[#00B074]">15-Min Delivery Verified</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">My Saved Wishlist</h3>
                  <p className="text-xs text-slate-500 font-medium">Items bookmarked for quick re-ordering</p>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl">
                    <Heart size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Your wishlist is empty</p>
                    <p className="text-[11px] text-slate-400">Save items while browsing to purchase later.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wishlistProducts.map((p) => (
                      <Link
                        key={p._id}
                        to={`/product/${p.slug || p._id}`}
                        className="p-3 rounded-2xl border border-slate-100 hover:shadow-md transition"
                      >
                        <div className="w-full h-32 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-2">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0].imageUrl} alt={p.title} className="w-full h-full object-cover" />
                          ) : '🛒'}
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 truncate">{p.title}</h5>
                        <p className="text-xs font-black text-slate-900 mt-1">₹{p.basePrice}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <h3 className="text-base font-black text-slate-900 mb-1">Add Delivery Address</h3>
            <p className="text-xs text-slate-500 mb-4">Enter address details for 15-min delivery dispatch</p>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, label: l })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                      addressForm.label === l ? 'bg-[#E8F8F0] border-[#00B074] text-[#00B074]' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={addressForm.phoneNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">House / Flat / Street *</label>
                <input
                  type="text"
                  required
                  placeholder="Flat 402, Royal Residency, Road 4"
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B074] hover:bg-[#009663] text-white text-xs font-black rounded-xl shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <FreshCartFooter />

    </div>
  );
};

export default CustomerAccount;
