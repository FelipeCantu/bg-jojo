import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext({
  items: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  isOpen: false,
  toggleCart: () => {},
  clearCart: () => {}, 
});

const CART_STORAGE_KEY = 'bg-jojo-cart';

const isValidCartItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.name !== 'string' || !item.name.trim()) return false;
  if (typeof item.price !== 'number' || item.price < 0 || item.price > 10000) return false;
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return false;
  // Validate Stripe price ID format if present
  if (item.stripePriceId !== undefined && (typeof item.stripePriceId !== 'string' || !item.stripePriceId.startsWith('price_'))) return false;
  return true;
};

const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    // Filter out any tampered or malformed items
    return parsed.filter(isValidCartItem);
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCartFromStorage);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [items]);

  const addToCart = (newItem) => {
    const { name, selectedSize, quantity = 1 } = newItem;

    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.name === name && item.selectedSize === selectedSize
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item === existingItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, { ...newItem, quantity }];
    });
  };

  const updateQuantity = (targetItem, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(targetItem);
      return;
    }

    const { name, selectedSize } = targetItem;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.name === name && item.selectedSize === selectedSize
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = ({ name, selectedSize }) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(item.name === name && item.selectedSize === selectedSize)
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch {}
  };

  const toggleCart = () => setIsOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart, 
        isOpen,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);