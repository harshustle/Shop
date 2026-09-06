import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('blinkit_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('blinkit_location');
      return saved ? JSON.parse(saved) : {
        tag: 'Home',
        address: 'Flat 402, Green Glen Layout, Bellandur, Bangalore - 560103'
      };
    } catch (e) {
      return {
        tag: 'Home',
        address: 'Flat 402, Green Glen Layout, Bellandur, Bangalore - 560103'
      };
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('blinkit_cart', JSON.stringify(items));
    } catch (e) {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('blinkit_location', JSON.stringify(selectedLocation));
    } catch (e) {}
  }, [selectedLocation]);

  /**
   * Adds product & variant to cart
   */
  const addToCart = (product, variant) => {
    setItems(prevItems => {
      const variantId = variant?._id || variant?.variant_id || variant?.sku || product._id;
      const existingIndex = prevItems.findIndex(it => it.variantId === variantId);

      const price = variant?.price || product.basePrice || product.price || 299;
      const comparePrice = variant?.compareAtPrice || product.compareAtPrice || Math.round(price * 1.25);
      const title = product.title || product.productName || 'Product';
      const image = product.images?.[0]?.imageUrl || product.primary_image?.image_url || product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80';
      const attributes = variant?.attributes || {};

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
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
          quantity: 1
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
   * Gets current quantity for a variant
   */
  const getItemQuantity = (variantId) => {
    const item = items.find(it => it.variantId === variantId);
    return item ? item.quantity : 0;
  };

  /**
   * Clears cart
   */
  const clearCart = () => {
    setItems([]);
  };

  // Computations
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const itemTotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const totalSavings = items.reduce((sum, it) => sum + ((it.comparePrice - it.price) * it.quantity), 0);
  const deliveryFee = itemTotal >= 499 || itemTotal === 0 ? 0 : 25;
  const platformFee = itemTotal > 0 ? 2 : 0;
  const grandTotal = itemTotal + deliveryFee + platformFee;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        itemTotal,
        totalSavings: Math.max(0, totalSavings),
        deliveryFee,
        platformFee,
        grandTotal,
        addToCart,
        removeFromCart,
        getItemQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedLocation,
        setSelectedLocation,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory
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
