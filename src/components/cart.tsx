"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  variantId: string;
  productSlug: string;
  name_ar: string;
  name_en: string;
  label_ar: string;
  label_en: string;
  price: number;
  image: string | null;
  qty: number;
  maxQty: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "alnajaar-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once on mount
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, ready]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const found = prev.find((l) => l.variantId === line.variantId);
      if (found) {
        return prev.map((l) =>
          l.variantId === line.variantId ? { ...l, qty: Math.min(l.qty + line.qty, line.maxQty, 20), maxQty: line.maxQty } : l,
        );
      }
      return [...prev, { ...line, qty: Math.min(line.qty, line.maxQty, 20) }];
    });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(1, Math.min(qty, l.maxQty, 20)) } : l)),
    );
  }, []);

  const remove = useCallback((variantId: string) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotal: lines.reduce((a, l) => a + l.qty * l.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, ready, add, setQty, remove, clear],
  );

  return <Ctx value={value}>{children}</Ctx>;
}

export function useCart() {
  const c = use(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
