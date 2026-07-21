"use client";
import { useState } from "react";
import ProductCard from "./ProductCard";

export default function CategoryAccordion({ title, products, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={"acc-item" + (open ? " open" : "")}>
      <button
        className="acc-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="acc-title serif">{title}</span>
        <span className="acc-meta">
          <span className="acc-count">{products.length} menu</span>
          <span className="acc-ic" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </span>
      </button>
      <div className="acc-body">
        <div className="products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}