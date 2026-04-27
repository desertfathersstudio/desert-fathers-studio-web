"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Sticker } from "./catalog";

export interface LightboxState {
  items: Sticker[];
  index: number;
}

interface LightboxCtx {
  state: LightboxState | null;
  open: (items: Sticker[], index: number) => void;
  close: () => void;
  setIndex: (i: number) => void;
}

const Ctx = createContext<LightboxCtx | null>(null);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LightboxState | null>(null);

  const open = useCallback((items: Sticker[], index: number) => {
    setState({ items, index });
  }, []);

  const close = useCallback(() => setState(null), []);

  const setIndex = useCallback((i: number) => {
    setState((prev) => (prev ? { ...prev, index: i } : prev));
  }, []);

  return (
    <Ctx.Provider value={{ state, open, close, setIndex }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLightbox() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLightbox must be inside LightboxProvider");
  return ctx;
}
