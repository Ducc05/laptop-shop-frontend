"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { cartApi } from "@/lib/api-endpoints";
import { useAuth } from "./AuthContext";
import type { Cart, CartItem } from "@/types/api";

type AddToCartSnapshot = Pick<
  CartItem,
  "productName" | "variantSku" | "imageUrl" | "price" | "snapshotPrice"
>;

interface CartContextType {
  cart: CartItem[];
  addToCart: (variantId: number, quantity?: number, snapshot?: AddToCartSnapshot) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const GUEST_CART_KEY = "cart.guest";

const calculateTotalPrice = (items: CartItem[] = []) =>
  items.reduce(
    (sum, item) => sum + (item.snapshotPrice ?? item.price ?? 0) * (item.quantity ?? 0),
    0
  );

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartData, setCartData] = useState<Cart>({ items: [], totalPrice: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const lastMergedTokenRef = useRef<string | null>(null);

  const syncCart = (nextCart?: Cart | null) => {
    setCartData({
      id: nextCart?.id,
      items: nextCart?.items ?? [],
      totalPrice: nextCart?.totalPrice ?? 0,
    });
  };

  const readGuestCart = (): CartItem[] => {
    if (typeof window === "undefined") return [];

    try {
      const savedCart = localStorage.getItem(GUEST_CART_KEY);
      if (!savedCart) return [];
      const parsedCart = JSON.parse(savedCart) as CartItem[];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
      return [];
    }
  };

  const writeGuestCart = (items: CartItem[]) => {
    if (typeof window === "undefined") return;

    if (items.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  };

  const syncGuestCart = (items: CartItem[]) => {
    writeGuestCart(items);
    syncCart({ items, totalPrice: calculateTotalPrice(items) });
  };

  const fetchCart = async () => {
    if (!user?.token) {
      const guestItems = readGuestCart();
      syncCart({ items: guestItems, totalPrice: calculateTotalPrice(guestItems) });
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.getCart();
      syncCart(response);
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mergeGuestCartToAccount = async () => {
    if (!user?.token || lastMergedTokenRef.current === user.token) return;

    const guestItems = readGuestCart();
    if (guestItems.length === 0) {
      lastMergedTokenRef.current = user.token;
      await fetchCart();
      return;
    }

    try {
      setIsLoading(true);
      for (const item of guestItems) {
        if (!item.variantId || !item.quantity) continue;
        await cartApi.addToCart(item.variantId, item.quantity);
      }

      writeGuestCart([]);
      lastMergedTokenRef.current = user.token;
      await fetchCart();
    } catch (error) {
      console.error("Failed to sync guest cart", error);
      await fetchCart();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (user?.token) {
      void mergeGuestCartToAccount();
      return;
    }

    lastMergedTokenRef.current = null;
    void fetchCart();
  }, [authLoading, user?.token]);

  const addToCart = async (variantId: number, quantity = 1, snapshot?: AddToCartSnapshot) => {
    if (!user?.token) {
      const guestItems = readGuestCart();
      const existingItem = guestItems.find((item) => item.variantId === variantId);

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity ?? 0) + quantity;
      } else {
        const itemPrice = snapshot?.snapshotPrice ?? snapshot?.price ?? 0;
        guestItems.push({
          id: variantId,
          variantId,
          quantity,
          productName: snapshot?.productName || `Sản phẩm #${variantId}`,
          variantSku: snapshot?.variantSku,
          imageUrl: snapshot?.imageUrl,
          price: snapshot?.price ?? itemPrice,
          snapshotPrice: itemPrice,
        });
      }

      syncGuestCart(guestItems);
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.addToCart(variantId, quantity);
      syncCart(response);
    } catch (error) {
      console.error("Failed to add to cart", error);
      alert("Thêm vào giỏ hàng thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!user?.token) {
      syncGuestCart(readGuestCart().filter((item) => item.id !== itemId));
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.removeFromCart(itemId);
      syncCart(response);
    } catch (error) {
      console.error("Failed to remove from cart", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (!user?.token) {
      const guestItems = readGuestCart().map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      syncGuestCart(guestItems);
      return;
    }

    try {
      setIsLoading(true);
      const response = await cartApi.updateQuantity(itemId, quantity);
      syncCart(response);
    } catch (error) {
      console.error("Failed to update cart quantity", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user?.token) {
      syncGuestCart([]);
      return;
    }

    try {
      setIsLoading(true);
      await cartApi.clearCart();
      syncCart(null);
    } catch (error) {
      console.error("Failed to clear cart", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cart = cartData.items ?? [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const totalPrice = cartData.totalPrice ?? calculateTotalPrice(cart);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
