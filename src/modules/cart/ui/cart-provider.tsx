"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  appendCartLine,
  cartTotals,
  removeCartLine,
  replaceCartLine,
  type CartLine,
} from "@/src/modules/cart/domain/cart";

export type { CartLine } from "@/src/modules/cart/domain/cart";

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  itemCount: number;
  total: number;
  addLine: (line: Omit<CartLine, "id">) => void;
  removeLine: (id: string) => void;
  replaceLine: (id: string, line: CartLine) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "artprint:v01:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let restored: CartLine[] = [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) restored = JSON.parse(stored) as CartLine[];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    queueMicrotask(() => {
      setLines(restored);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const addLine = useCallback((line: Omit<CartLine, "id">) => {
    setLines((current) => appendCartLine(current, line, crypto.randomUUID()));
  }, []);
  const removeLine = useCallback((id: string) => setLines((current) => removeCartLine(current, id)), []);
  const replaceLine = useCallback((id: string, line: CartLine) => setLines((current) => replaceCartLine(current, id, line)), []);
  const clear = useCallback(() => setLines([]), []);
  const totals = useMemo(() => cartTotals(lines), [lines]);
  const value = useMemo(
    () => ({ lines, ready, ...totals, addLine, removeLine, replaceLine, clear }),
    [lines, ready, totals, addLine, removeLine, replaceLine, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
