"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useUI } from "@/context/UIContext";
import { useStore } from "@/context/StoreContext";
import SITE from "@/lib/data";
import { money } from "@/lib/format";
import Photo from "./Photo";
import { productPhoto } from "@/lib/photos";
import { Icon } from "./Icons";

export default function SearchModal() {
  const { searchOpen, closeSearch } = useUI();
  const { add } = useStore();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
    if (!searchOpen) setQ("");
  }, [searchOpen]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return SITE.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.cat.toLowerCase().includes(s) ||
          (p.desc || "").toLowerCase().includes(s),
      )
      .slice(0, 8);
  }, [q]);

  if (!searchOpen) return null;

  return (
    <div className="modal-scrim show search-scrim" onClick={closeSearch}>
      <div className="search-box" onClick={(e) => e.stopPropagation()}>
        <div className="search-bar">
          <Icon name="search" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk favoritmu di sini, misal: alpukat, tea, coklat..."
          />
          <button className="icon-btn" onClick={closeSearch} aria-label="Tutup">
            <Icon name="close" />
          </button>
        </div>
        <div className="search-results">
          {q.trim() === "" ? (
            <div className="search-hint">
              Ketik nama minuman atau kategori buat nyari cepat 🍹
            </div>
          ) : results.length === 0 ? (
            <div className="search-hint">
              Nggak nemu &ldquo;{q}&rdquo;. Coba kata kunci lain ya.
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                className="search-item"
                onClick={() => {
                  add(p.id);
                  closeSearch();
                }}
              >
                <span className="search-thumb">
                  <Photo
                    src={productPhoto(p.id)}
                    alt={p.name}
                    fallback={p.img}
                  />
                </span>
                <span className="search-meta">
                  <strong>{p.name}</strong>
                  <small>{p.cat}</small>
                </span>
                <span className="search-price">{money(p.price)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}