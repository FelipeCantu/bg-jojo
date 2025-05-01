import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext({
  items: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  isOpen: false,
  toggleCart: () => {},
});

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

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

  const toggleCart = () => setIsOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        isOpen,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
