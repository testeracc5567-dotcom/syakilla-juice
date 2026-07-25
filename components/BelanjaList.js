"use client";
// Daftar produk per kategori di halaman Belanja — realtime dari ProductsContext.
import SITE from "@/lib/data";
import { useProducts } from "@/context/ProductsContext";
import CategoryAccordion from "./CategoryAccordion";

export default function BelanjaList() {
  const { products } = useProducts();
  const order =
    SITE.categories && SITE.categories.length ? SITE.categories : [];
  const fromProducts = Array.from(
    new Set(products.map((p) => p.cat).filter(Boolean)),
  );
  // Urutkan sesuai data bawaan dulu, lalu kategori baru dari produk.
  const cats = [
    ...order.filter((c) => fromProducts.includes(c)),
    ...fromProducts.filter((c) => !order.includes(c)),
  ];
  return (
    <div className="acc">
      {cats.map((cat, i) => (
        <CategoryAccordion
          key={cat}
          title={cat}
          defaultOpen={i === 0}
          products={products.filter((p) => p.cat === cat)}
        />
      ))}
    </div>
  );
}