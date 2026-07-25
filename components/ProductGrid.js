"use client";
import SITE from "@/lib/data";
import { useProducts } from "@/context/ProductsContext";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const c = SITE.collection;
  const { products } = useProducts();
  // Beranda cuma nampilin produk unggulan. Selebihnya di halaman Belanja.
  const featured = products.filter((p) => p.featured);
  const shown = (featured.length ? featured : products).slice(0, 6);
  return (
    <section id="collection">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="serif">{c.title}</h2>
          </div>
          <a className="link-gold" href="/belanja">
            Semua {"\u2192"}
          </a>
        </div>
        <div className="products">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}