"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useUI } from "./UIContext";
import { useProducts } from "./ProductsContext";

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const { showToast, openCart } = useUI();
  const { products } = useProducts();
  const [cart, setCart] = useState({});

  const P = useCallback((id) => products.find((p) => p.id === id), [products]);

  const add = useCallback(
    (id) => {
      setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
      const prod = P(id);
      if (prod) showToast(prod.name + " masuk keranjang");
      openCart();
    },
    [P, showToast, openCart],
  );

  const changeQty = useCallback((id, delta) => {
    setCart((c) => {
      const q = (c[id] || 0) + delta;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const count = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart],
  );

  const subtotal = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [id, q]) => {
        const prod = P(id);
        return sum + (prod ? prod.price * q : 0);
      }, 0),
    [cart, P],
  );

  return (
    <StoreCtx.Provider
      value={{ cart, add, changeQty, remove, clear, count, subtotal, P }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  return useContext(StoreCtx);
}