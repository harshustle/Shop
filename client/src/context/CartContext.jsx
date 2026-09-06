import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('freshcart_cart') || localStorage.getItem('blinkit_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, discountType, message }

  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('freshcart_location');
      return saved ? JSON.parse(saved) : {
        tag: 'Home',
        address: 'Flat 402, Royal Residency, Gomti Nagar, Lucknow - 226010'
      };
    } catch (e) {
      return {
        tag: 'Home',
        address: 'Flat 402, Royal Residency, Gomti Nagar, Lucknow - 226010'
      };
    }
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('freshcart_cart', JSON.stringify(items));
    } catch (e) {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('freshcart_location', JSON.stringify(selectedLocation));
    } catch (e) {}
  }, [selectedLocation]);

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
   * Clears cart
   */
  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  // Computations
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const itemTotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const totalSavings = items.reduce((sum, it) => sum + ((it.comparePrice - it.price) * it.quantity), 0);
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
        selectedLocation,
        setSelectedLocation
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
