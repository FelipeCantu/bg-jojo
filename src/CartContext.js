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

const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
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