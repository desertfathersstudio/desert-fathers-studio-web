"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { Sticker } from "./catalog";

const STORAGE_KEY = "dfs-cart";

export interface CartItem {
  sticker: Sticker;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (s: Sticker, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadFromStorage);
  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable (private browsing quota, etc.) — degrade silently
    }
  }, [items]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.sticker.price * i.qty, 0);

  const add = useCallback((s: Sticker, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sticker.id === s.id);
      if (existing) {
        return prev.map((i) =>
          i.sticker.id === s.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { sticker: s, qty }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.sticker.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.sticker.id !== id)
        : prev.map((i) => (i.sticker.id === id ? { ...i, qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        add,
        remove,
        setQty,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
