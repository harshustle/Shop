import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import FreshCartNavbar from '../components/FreshCartNavbar';
import FreshCartFooter from '../components/FreshCartFooter';
import CartDrawer from '../components/CartDrawer';

// Modular Account Components
import AccountMenu from '../components/account/AccountMenu';
import ProfileHeader from '../components/account/ProfileHeader';
import WalletTab from '../components/account/WalletTab';
import ReferEarnTab from '../components/account/ReferEarnTab';
import CouponsTab from '../components/account/CouponsTab';
import OrdersTab from '../components/account/OrdersTab';
import WishlistTab from '../components/account/WishlistTab';
import AddressesTab from '../components/account/AddressesTab';
import ProfileSettingsTab from '../components/account/ProfileSettingsTab';

// Interactive Modals
import LanguageModal from '../components/account/LanguageModal';
import FeedbackModal from '../components/account/FeedbackModal';
import ContactUsModal from '../components/account/ContactUsModal';
import PolicyModal from '../components/account/PolicyModal';
import LogoutConfirmModal from '../components/account/LogoutConfirmModal';

import { API_URL } from '../config';

const CustomerAccount = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab & Modal States
  const paramTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(paramTab || 'wallet');
  const [activeModal, setActiveModal] = useState(null); // 'language' | 'feedback' | 'contact' | 'shipping' | 'terms' | 'refunds' | 'privacy' | 'logout'

  // Data States
  const [accountData, setAccountData] = useState(null);
  const [walletData, setWalletData] = useState({ balance: 0, referralCode: 'FRESH5', referralReward: 5, transactions: [] });
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('freshcart_language') || 'English');
  const [isLoading, setIsLoading] = useState(true);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Mobile View state (allows toggling between menu list and tab content on small screens)
  const [showMobileContent, setShowMobileContent] = useState(Boolean(paramTab));

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch all user data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Account profile & addresses
      const accRes = await fetch(`${API_URL}/api/account/me`, { headers: getHeaders() });
      if (accRes.ok) {
        const data = await accRes.json();
        setAccountData(data);
        const name = data.user?.fullName || localStorage.getItem('fullName') || '';
        const email = data.user?.email || localStorage.getItem('userEmail') || '';
        const phone = data.user?.phone || localStorage.getItem('userPhone') || '';
        setProfileForm({ fullName: name, email: email, phone: phone });
        
        if (name) localStorage.setItem('fullName', name);
        if (email) localStorage.setItem('userEmail', email);
        if (phone) localStorage.setItem('userPhone', phone);
        window.dispatchEvent(new Event('storage'));

        // 2. Fetch Wishlist full product objects
        if (data.wishlist && data.wishlist.length > 0) {
          const wRes = await fetch(`${API_URL}/api/catalog/search?limit=50`);
          if (wRes.ok) {
            const allP = await wRes.json();
            setWishlistProducts((allP.products || []).filter(p => data.wishlist.includes(p._id)));
          }
        } else {
          setWishlistProducts([]);
        }
      }

      // 3. Fetch User Orders
      const userPhone = localStorage.getItem('userPhone');
      if (userPhone) {
        const ordRes = await fetch(`${API_URL}/api/orders/user/${userPhone}`, { headers: getHeaders() });
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(Array.isArray(ordData) ? ordData : []);
        }
      }

      // 4. Fetch Wallet & Referral Data
      await fetchWallet();

    } catch (err) {
      console.warn('Error fetching account data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/api/account/wallet`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
      }
    } catch (err) {
      console.warn('Wallet fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (paramTab) {
      setActiveTab(paramTab);
      setShowMobileContent(true);
    }
  }, [paramTab]);

  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
    setShowMobileContent(true);
    setSearchParams({ tab: tabKey });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('freshcart_language', lang);
  };

  const handleRemoveWishlistItem = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/account/wishlist/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        setWishlistProducts(prev => prev.filter(p => p._id !== productId));
      }
    } catch (err) {
      console.error('Remove wishlist error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-800 flex flex-col font-sans">
      
      <FreshCartNavbar onOpenCart={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-6 sm:space-y-8">
        
        {/* Profile Card Header */}
        <ProfileHeader 
          user={accountData?.user || profileForm} 
          onEditProfile={() => handleSelectTab('profile')}
          isEditing={activeTab === 'profile'}
        />

        {/* Mobile "Back to Menu" bar when viewing tab on small screens */}
        {showMobileContent && (
          <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setShowMobileContent(false);
                setSearchParams({});
              }}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#00B074] transition"
            >
              <ArrowLeft size={16} />
              <span>Back to Account Menu</span>
            </button>
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {activeTab}
            </span>
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Account Menu Card (exactly matching the user's screenshot) */}
          <div className={`lg:col-span-4 ${showMobileContent ? 'hidden lg:block' : 'block'}`}>
            <AccountMenu
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              onOpenModal={(modalName) => setActiveModal(modalName)}
              walletBalance={walletData?.balance || 0}
              currentLanguage={currentLanguage}
              ordersCount={orders.length}
              wishlistCount={wishlistProducts.length}
            />
          </div>

          {/* RIGHT COLUMN: Active Tab View */}
          <div className={`lg:col-span-8 ${!showMobileContent ? 'hidden lg:block' : 'block'}`}>
            
            {activeTab === 'wallet' && (
              <WalletTab 
                walletData={walletData} 
                onRefreshWallet={fetchWallet} 
              />
            )}

            {activeTab === 'refer' && (
              <ReferEarnTab 
                referralCode={walletData?.referralCode || 'FRESH5'} 
                rewardAmount={walletData?.referralReward || 5} 
              />
            )}

            {activeTab === 'coupons' && (
              <CouponsTab />
            )}

            {activeTab === 'orders' && (
              <OrdersTab 
                orders={orders} 
              />
            )}

            {activeTab === 'wishlist' && (
              <WishlistTab 
                wishlistProducts={wishlistProducts} 
                onRemoveItem={handleRemoveWishlistItem} 
              />
            )}

            {activeTab === 'addresses' && (
              <AddressesTab 
                addresses={accountData?.addresses || []} 
                onAddressUpdated={fetchData} 
              />
            )}

            {activeTab === 'profile' && (
              <ProfileSettingsTab 
                profileForm={profileForm} 
                setProfileForm={setProfileForm} 
                onProfileSaved={fetchData} 
              />
            )}

          </div>

        </div>

      </main>

      <FreshCartFooter />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Interactive Modals */}
      <LanguageModal
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleLanguageChange}
      />

      <FeedbackModal
        isOpen={activeModal === 'feedback'}
        onClose={() => setActiveModal(null)}
      />

      <ContactUsModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
      />

      <PolicyModal
        isOpen={['shipping', 'terms', 'refunds', 'privacy'].includes(activeModal)}
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />

      <LogoutConfirmModal
        isOpen={activeModal === 'logout'}
        onClose={() => setActiveModal(null)}
      />

    </div>
  );
};

export default CustomerAccount;
