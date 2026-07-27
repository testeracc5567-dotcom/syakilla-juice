"use client";
import { useState, useEffect } from "react";
import Photo from "./Photo";
import { useStore } from "@/context/StoreContext";
import { useUI } from "@/context/UIContext";
import { money } from "@/lib/format";
import { getRating } from "@/lib/reviews";
import { productImage } from "@/lib/productImage";

export default function ProductCard({ product: p }) {
  const { add } = useStore();
  const { openProduct } = useUI();
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    setMounted(true);
    const load = () => setRating(getRating(p.id));
    load();
    window.addEventListener("syk-reviews-update", load);
    return () => window.removeEventListener("syk-reviews-update", load);
  }, [p.id]);

  // Klik tombol tambah: jangan buka modal detail. Stok habis = gak bisa ditambah.
  const addToCart = (e) => {
    e.stopPropagation();
    if (Number(p.stock || 0) <= 0) return;
    add(p.id);
  };

  // Sebelum mount pakai nilai bawaan biar sama dengan server (hindari hydration error).
  const value = mounted && rating.count ? rating.avg : p.stars;
  const count = mounted ? rating.count : 0;
  const stock = Number(p.stock || 0);
  const out = stock <= 0;

  return (
    <div
      className={"card card-click" + (out ? " card-out" : "")}
      role="button"
      tabIndex={0}
      onClick={() => openProduct(p)}
      onKeyDown={(e) => {
        if (e.key === "Enter") openProduct(p);
      }}
    >
      <div className="card-media">
        {p.tag ? <span className="tag">{p.tag}</span> : null}
        <Photo
          src={productImage(p)}
          alt={p.name}
          fallback={p.img}
          className="card-photo"
        />
        <div className="quick">
          <button onClick={addToCart} disabled={out}>
            {out ? "Stok Habis" : "Tambah " + "\u2014" + " " + money(p.price)}
          </button>
        </div>
      </div>
      <div className="card-body">
        <span className="card-cat">{p.cat}</span>
        <h3 className="serif">{p.name}</h3>
        <div className="desc">{p.desc}</div>
        <div className="card-foot">
          <span className="price">{money(p.price)}</span>
          <span className="card-rate">
            <span className="cr-star">{"\u2605"}</span>
            <b>{Number(value).toFixed(1)}</b>
            <small>({count})</small>
          </span>
        </div>
        <div className="card-stock">
          {out ? (
            <span className="cs-out">Stok habis</span>
          ) : (
            <span className="cs-in">Stok {stock}</span>
          )}
        </div>
      </div>
    </div>
  );
}