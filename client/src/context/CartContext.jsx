import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../config';

const CartContext = createContext();

// Helper to get or create a guest session token
const getGuestSessionToken = () => {
  try {
    let token = localStorage.getItem('freshcart_guest_token');
    if (!token) {
      token = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem('freshcart_guest_token', token);
    }
    return token;
  } catch (e) {
    return 'sess_fallback';
  }
};

// Helper to construct authorization & session headers for Redis APIs
const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    headers['x-session-token'] = getGuestSessionToken();
  } catch (e) {}
  return headers;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isLoadingFromRedis, setIsLoadingFromRedis] = useState(true);

  // Track active token to detect account switching/logout
  const activeTokenRef = useRef(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const isInitialized = useRef(false);

  const [selectedLocation, setSelectedLocation] = useState({
    tag: 'Home',
    address: 'Vibhuti Khand, Gomti Nagar, Lucknow, UP - 226010',
    flatNumber: 'Flat 402, Tower B',
    landmark: 'Near Riverside Mall',
    lat: 26.8520,
    lng: 80.9510,
    distanceKm: 0.35,
    isDeliverable: true,
    etaMinutes: 10
  });

  // Fetch cart directly from Redis on backend
  const loadCartFromRedis = useCallback(async () => {
    setIsLoadingFromRedis(true);
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setItems(data.items);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('[CartContext] Notice fetching Redis cart:', err.message);
      setItems([]);
    } finally {
      setIsLoadingFromRedis(false);
      isInitialized.current = true;
    }
  }, []);

  // Fetch user's saved location from Redis
  const loadLocationFromRedis = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/account/location`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.location && data.location.address) {
          setSelectedLocation(data.location);
        }
      }
    } catch (err) {
      console.warn('[CartContext] Notice fetching Redis location:', err.message);
    }
  }, []);

  // Save selected location to Redis per active user
  const setLocation = useCallback(async (newLoc) => {
    setSelectedLocation(newLoc);
    try {
      const token = localStorage.getItem('token');
      if (token && newLoc?.address) {
        await fetch(`${API_URL}/api/account/location`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(newLoc)
        });
      }
    } catch (err) {
      console.warn('[CartContext] Notice saving Redis location:', err.message);
    }
  }, []);

  // Initial mount: purge obsolete global browser cart & location, hydrate from Redis
  useEffect(() => {
    try {
      localStorage.removeItem('freshcart_cart');
      localStorage.removeItem('freshcart_location');
    } catch (e) {}

    loadCartFromRedis();
    loadLocationFromRedis();
  }, [loadCartFromRedis, loadLocationFromRedis]);

  // Listen for user login, logout, and account changes to switch Redis cart and location
  useEffect(() => {
    const handleAccountChange = () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== activeTokenRef.current) {
        activeTokenRef.current = currentToken;
        // User logged out or switched accounts: reload isolated cart & location from Redis
        loadCartFromRedis();
        loadLocationFromRedis();
      }
    };

    window.addEventListener('storage', handleAccountChange);
    window.addEventListener('freshcart-user-updated', handleAccountChange);

    return () => {
      window.removeEventListener('storage', handleAccountChange);
      window.removeEventListener('freshcart-user-updated', handleAccountChange);
    };
  }, [loadCartFromRedis, loadLocationFromRedis]);

  // Sync cart changes to Redis backend (debounced to prevent spamming on rapid quantity clicks)
  useEffect(() => {
    if (!isInitialized.current) return;

    const timer = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/cart/sync`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items })
        });
      } catch (err) {
        console.warn('[CartContext] Redis sync notice:', err.message);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [items]);

  /**
   * Adds product & variant to cart
   */
  const addToCart = (product, variant, qty = 1) => {
    setItems(prevItems => {
      const variantId = variant?._id || variant?.variant_id || variant?.sku || product._id;
      const existingIndex = prevItems.findIndex(it => it.variantId === variantId);

      const price = Number(variant?.price || product.basePrice || product.price || 99);
      const comparePrice = Number(variant?.compareAtPrice || product.compareAtPrice || Math.round(price * 1.25));
      const title = product.title || product.productName || 'Product';
      const image = product.images?.[0]?.imageUrl || product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
      const attributes = variant?.attributes || {};

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          variantId,
          productId: product._id,
          title,
          sku: variant?.sku || 'SKU-DIRECT',
          price,
          comparePrice,
          image,
          attributes,
          quantity: qty
        }
      ];
    });
  };

  /**
   * Decrements or removes product from cart
   */
  const removeFromCart = (variantId) => {
    setItems(prevItems => {
      const existing = prevItems.find(it => it.variantId === variantId);
      if (!existing) return prevItems;

      if (existing.quantity > 1) {
        return prevItems.map(it => 
          it.variantId === variantId 
            ? { ...it, quantity: it.quantity - 1 }
            : it
        );
      }

      return prevItems.filter(it => it.variantId !== variantId);
    });
  };

  /**
   * Clears cart and flushes Redis cache
   */
  const clearCart = async () => {
    setItems([]);
    setAppliedCoupon(null);
    try {
      await fetch(`${API_URL}/api/cart`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('[CartContext] Redis clear error:', err.message);
    }
  };

  // Computations
  const itemCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const itemTotal = items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
  const totalSavings = items.reduce((sum, it) => sum + (((Number(it.comparePrice) || it.price) - it.price) * (Number(it.quantity) || 1)), 0);
  const deliveryFee = itemTotal >= 499 || itemTotal === 0 ? 0 : 25;
  const platformFee = itemTotal > 0 ? 2 : 0;
  
  const couponDiscount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, itemTotal) : 0;
  const grandTotal = Math.max(0, itemTotal - couponDiscount + deliveryFee + platformFee);

  /**
   * Apply coupon code via backend API
   */
  const applyCouponCode = async (code) => {
    try {
      const res = await fetch(`${API_URL}/api/coupons/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: itemTotal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          message: data.message
        });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Invalid coupon code' };
      }
    } catch (err) {
      return { success: false, message: 'Could not connect to coupon service' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getCartCount = () => itemCount;
  const getCartTotal = () => grandTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        itemTotal,
        totalSavings: Math.max(0, totalSavings),
        deliveryFee,
        platformFee,
        appliedCoupon,
        couponDiscount,
        grandTotal,
        addToCart,
        removeFromCart,
        clearCart,
        applyCouponCode,
        removeCoupon,
        getCartCount,
        getCartTotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isLocationModalOpen,
        setIsLocationModalOpen,
        openLocationModal: () => setIsLocationModalOpen(true),
        selectedLocation,
        setSelectedLocation: setLocation,
        isLoadingFromRedis
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
