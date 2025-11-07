'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import type { Product, CartItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number, product?: Product) => void;
  getProductQuantity: (productId: string) => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [removedProductId, setRemovedProductId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    variant?: "default" | "destructive";
    title: string;
    description?: string;
  } | null>(null);
  const { toast } = useToast();

  // Handle toast notifications for removed items
  useEffect(() => {
    if (removedProductId) {
      toast({
        variant: "destructive",
        title: "Removed from cart",
      });
      setRemovedProductId(null);
    }
  }, [removedProductId, toast]);

  // Handle other toast notifications
  useEffect(() => {
    if (toastNotification) {
      toast(toastNotification);
      setToastNotification(null);
    }
  }, [toastNotification, toast]);

  const addToCart = (product: Product) => {
    console.log('addToCart called for product:', product.name);
    
    // Check stock availability
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentQuantity + 1;
      
      // Validate stock availability
      if (newQuantity > product.stockQty) {
        // Queue toast notification instead of calling directly
        setToastNotification({
          variant: "destructive",
          title: "Stock Limit Exceeded",
          description: `Only ${product.stockQty} ${product.stockQty === 1 ? 'item' : 'items'} available in stock. You cannot add more than available stock.`,
        });
        return prevCart; // Don't update cart if stock is exceeded
      }
      
      if (existingItem) {
        const updatedCart = prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: newQuantity } : item
        );
        console.log('Updated existing item in cart:', updatedCart);
        // Queue toast notification
        setToastNotification({
          title: "Added to Cart",
          description: `${product.name} added to cart (${newQuantity} ${newQuantity === 1 ? 'item' : 'items'})`,
        });
        return updatedCart;
      }
      const newCart = [...prevCart, { product, quantity: 1 }];
      console.log('Added new item to cart:', newCart);
      // Queue toast notification
      setToastNotification({
        title: "Added to Cart",
        description: `${product.name} added to cart`,
      });
      return newCart;
    });
  };

  const updateQuantity = (productId: string, quantity: number, product?: Product) => {
    console.log('updateQuantity called:', { productId, quantity });
    setCart(prevCart => {
      if (quantity <= 0) {
        console.log('Removing product from cart:', productId);
        setRemovedProductId(productId);
        return prevCart.filter(item => item.product.id !== productId);
      }
      
      // Check stock availability - get product from cart if not provided
      const cartItem = prevCart.find(item => item.product.id === productId);
      const productToCheck = product || cartItem?.product;
      
      if (productToCheck) {
        if (quantity > productToCheck.stockQty) {
          // Queue toast notification instead of calling directly
          setToastNotification({
            variant: "destructive",
            title: "Stock Limit Exceeded",
            description: `Only ${productToCheck.stockQty} ${productToCheck.stockQty === 1 ? 'item' : 'items'} available in stock. You cannot select more than available stock.`,
          });
          return prevCart; // Don't update cart if stock is exceeded
        }
      }
      
      // Update cart quantity
      const updatedCart = prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      console.log('Updated cart:', updatedCart);
      return updatedCart;
    });
  };

  const getProductQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setCart([]);
  }
  
  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, getProductQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
