"use client";
// Sumber produk realtime buat seluruh aplikasi.
// Baca koleksi "products" di Firestore via onSnapshot (update otomatis).
// Kalau Firestore kosong / gagal, jatuh ke data bawaan (SITE.products).
import { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, hasFirebaseConfig } from "@/lib/firebaseClient";
import SITE from "@/lib/data";

const ProductsCtx = createContext(null);

function sortProducts(list) {
  return list.slice().sort((a, b) => {
    const ao = Number.isFinite(a.order) ? a.order : 0;
    const bo = Number.isFinite(b.order) ? b.order : 0;
    return ao - bo;
  });
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(SITE.products || []);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setReady(true);
      return;
    }
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        collection(db, "products"),
        (snap) => {
          if (!snap.empty) {
            const rows = snap.docs.map((d) =>
              Object.assign({}, d.data(), { id: d.id }),
            );
            setProducts(sortProducts(rows));
            setLive(true);
          } else {
            setProducts(SITE.products || []);
            setLive(false);
          }
          setReady(true);
        },
        () => {
          // Gagal konek Firestore -> pakai data bawaan.
          setProducts(SITE.products || []);
          setLive(false);
          setReady(true);
        },
      );
    } catch (e) {
      setProducts(SITE.products || []);
      setReady(true);
    }
    return () => unsub();
  }, []);

  return (
    <ProductsCtx.Provider value={{ products, ready, live }}>
      {children}
    </ProductsCtx.Provider>
  );
}

export function useProducts() {
  return (
    useContext(ProductsCtx) || {
      products: SITE.products || [],
      ready: true,
      live: false,
    }
  );
}