"use client";
// Ulasan pelanggan: ambil review ASLI dari pembeli (localStorage),
// difilter cuma bintang 4 & 5, terus dijalanin otomatis (marquee).
// Kalau belum ada review asli, pakai contoh dari lib/data.js.
import { useEffect, useMemo, useState } from "react";
import SITE from "@/lib/data";
import { starStr } from "@/lib/format";
import { readAllReviews } from "@/lib/reviews";
import { useProducts } from "@/context/ProductsContext";

const MIN_STARS = 4;

export default function Reviews() {
  const { products } = useProducts();
  const [all, setAll] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setAll(readAllReviews());
    load();
    setReady(true);
    window.addEventListener("syk-reviews-update", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("syk-reviews-update", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  // Kumpulin semua review bintang 4 & 5 dari semua produk.
  const real = useMemo(() => {
    const list = [];
    Object.keys(all || {}).forEach((pid) => {
      const prod = products.find((p) => p.id === pid);
      (all[pid] || []).forEach((r) => {
        const st = Number(r.stars) || 0;
        if (st < MIN_STARS) return;
        if (!String(r.text || "").trim()) return;
        const nm = String(r.name || "Pelanggan").trim() || "Pelanggan";
        list.push({
          key: pid + "-" + (r.id || r.ts || nm),
          stars: Math.round(st),
          text: r.text,
          name: nm,
          role: prod ? prod.name : "Pelanggan",
          avatar: nm.charAt(0).toUpperCase(),
          ts: Number(r.ts) || 0,
        });
      });
    });
    return list.sort((a, b) => b.ts - a.ts);
  }, [all, products]);

  const fallback = (SITE.reviews.items || []).map((q, i) => ({
    key: "seed-" + i,
    stars: q.stars,
    text: q.text,
    name: q.name,
    role: q.role,
    avatar: q.avatar,
  }));

  const usingReal = ready && real.length > 0;
  const items = usingReal ? real : fallback;
  if (!items.length) return null;

  const avg = usingReal
    ? real.reduce((a, r) => a + r.stars, 0) / real.length
    : 0;
  const title = usingReal
    ? avg.toFixed(1) + " / 5 dari " + real.length + " ulasan pelanggan"
    : SITE.reviews.title;

  // Biar animasinya nyambung mulus, isi digandakan tepat 2x.
  let base = items;
  while (base.length < 6) base = base.concat(items);
  const loop = base.concat(base);
  const duration = Math.max(28, base.length * 7);

  return (
    <section className="quotes rv" id="reviews">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{SITE.reviews.eyebrow}</span>
            <h2 className="serif">{title}</h2>
            <p className="rv-note">
              {usingReal
                ? "Ulasan asli dari pembeli Syakilla Juice, khusus bintang 4 & 5."
                : "Belum ada ulasan pembeli. Ini contoh tampilannya dulu ya."}
            </p>
          </div>
        </div>
      </div>

      <div className="rv-marq">
        <div className="rv-track" style={{ animationDuration: duration + "s" }}>
          {loop.map((q, i) => (
            <article className="q-card rv-card" key={q.key + "-" + i}>
              <div className="stars">{starStr(q.stars)}</div>
              <p>{q.text}</p>
              <div className="q-who">
                <div className="q-av">{q.avatar}</div>
                <div>
                  <div className="nm">{q.name}</div>
                  <div className="rl">{q.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
