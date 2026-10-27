import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number) => { success: boolean; message?: string };
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  scheduledPickupTime: string;
  setScheduledPickupTime: (time: string) => void;
  customerNotes: string;
  setCustomerNotes: (notes: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('smart_cafeteria_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  
  // Default to 15 minutes from now
  const [scheduledPickupTime, setScheduledPickupTime] = useState<string>(() => {
    return new Date(Date.now() + 15 * 60000).toISOString();
  });

  useEffect(() => {
    localStorage.setItem('smart_cafeteria_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem, quantity = 1): { success: boolean; message?: string } => {
    if (!item.isInStock || item.availablePortions <= 0) {
      return { success: false, message: `"${item.name}" is currently out of stock due to ingredient limits.` };
    }

    const existingIndex = cart.findIndex(c => c.menuItem.id === item.id);
    const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;

    if (requestedTotal > item.availablePortions) {
      return { 
        success: false, 
        message: `Only ${item.availablePortions} portions of "${item.name}" can be prepared with current ingredient stock.` 
      };
    }

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      setCart(prev => [...prev, { menuItem: item, quantity }]);
    }

    return { success: true };
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.menuItem.id === itemId) {
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > c.menuItem.availablePortions) {
            return c; // Cannot exceed available stock
          }
          return { ...c, quantity: newQty };
        }
        return c;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
    setCustomerNotes('');
  };

  const itemCount = cart.reduce((acc, itm) => acc + itm.quantity, 0);
  const subtotal = Number(cart.reduce((acc, itm) => acc + (itm.menuItem.price * itm.quantity), 0).toFixed(2));
  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      taxAmount,
      totalAmount,
      scheduledPickupTime,
      setScheduledPickupTime,
      customerNotes,
      setCustomerNotes,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
