import React, { createContext, useContext, useState, ReactNode } from 'react';

// أنواع البيانات الأساسية
export type CartItem = {
  id: string;
  name_ar: string;
  description_ar?: string;
  price: number;
  image_url?: string;
  quantity: number;
  type: 'food' | 'drink';
  size?: string;
};

// نوع للعناصر القادمة من Supabase (مع الحقول الإضافية)
type SupabaseMenuItem = {
  id: string;
  name_ar: string;
  description_ar?: string;
  price: number;
  image_url?: string;
  category_id: string;
  is_available: boolean;
  display_order: number;
  created_at?: string;
  is_featured?: boolean;
};

type SupabaseDrink = {
  id: string;
  name_ar: string;
  description_ar?: string;
  price: number;
  image_url?: string;
  category_id: string;
  is_available: boolean;
  display_order: number;
  size?: string;
  drink_categories?: any;
  created_at?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: SupabaseMenuItem | SupabaseDrink, type: 'food' | 'drink') => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: SupabaseMenuItem | SupabaseDrink, type: 'food' | 'drink') => {
    console.log('Adding to cart - raw item:', item);
    
    if (!item || !item.id) {
      console.error('Invalid item:', item);
      return;
    }

    // إنشاء كائن CartItem نظيف بدون الحقول الإضافية
    const cleanItem: CartItem = {
      id: item.id,
      name_ar: item.name_ar,
      description_ar: item.description_ar,
      price: Number(item.price),
      image_url: item.image_url,
      quantity: 1,
      type: type,
      size: (item as SupabaseDrink).size
    };

    console.log('Clean cart item:', cleanItem);

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem.id === cleanItem.id && cartItem.type === cleanItem.type
      );

      if (existingItemIndex !== -1) {
        // العنصر موجود - زيادة الكمية
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1
        };
        console.log('Updated cart (existing item):', updatedCart);
        return updatedCart;
      } else {
        // عنصر جديد - إضافته
        const newCart = [...prevCart, cleanItem];
        console.log('Updated cart (new item):', newCart);
        return newCart;
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      return total + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => {
      return total + (isNaN(item.quantity) ? 0 : item.quantity);
    }, 0);
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}