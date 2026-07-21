"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Tambahin animasi "reveal" (muncul pelan pas discroll) ke elemen-elemen utama
// di semua halaman, tanpa harus ngedit tiap komponen satu-satu.
// Termasuk elemen yang SUDAH ditandai className "anim-reveal" langsung di JSX
// (mis. gambar craft, section Lokasi, halaman Bantuan) biar ikut dimunculkan.
const SELECTOR =
  "main > section, .card, .blog-card, .review-card, .sec-head, .foot-col, .foot-brand, .anim-reveal";

export default function ScrollAnimator() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll(SELECTOR));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("anim-in"));
      return;
    }
    els.forEach((el) => el.classList.add("anim-reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("anim-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}