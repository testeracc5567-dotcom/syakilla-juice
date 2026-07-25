// Bentuk & validasi data produk. Dipakai di API route (server) dan seed.
// Tetap framework-agnostic: jangan import firebase / fs di sini.
import SITE from "./data";

// Batas ukuran gambar base64 yang disimpan ke Firestore (limit dokumen 1MB).
export const MAX_IMAGE_CHARS = 900000;

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v) {
  return typeof v === "string" ? v.trim() : "";
}

// Rapikan input produk jadi bentuk baku sebelum disimpan.
export function normalizeProduct(input, extra) {
  input = input || {};
  const out = {
    name: str(input.name),
    cat: str(input.cat),
    price: Math.max(0, Math.round(num(input.price, 0))),
    desc: str(input.desc),
    tag: str(input.tag),
    stars: Math.max(0, Math.min(5, num(input.stars, 5))),
    featured: Boolean(input.featured),
    img: str(input.img),
    imageData: typeof input.imageData === "string" ? input.imageData : "",
    order: num(input.order, Date.now()),
  };
  return Object.assign(out, extra || {});
}

// Validasi minimum. Balikin string error kalau nggak valid, atau null kalau ok.
export function validateProduct(p) {
  if (!p.name) return "Nama produk wajib diisi.";
  if (!p.cat) return "Kategori wajib diisi.";
  if (!(p.price >= 0)) return "Harga tidak valid.";
  if (p.imageData && p.imageData.length > MAX_IMAGE_CHARS) {
    return "Ukuran gambar terlalu besar. Coba foto yang lebih kecil.";
  }
  return null;
}

// Data awal buat seeding: ambil dari SITE.products (data bawaan).
export function defaultProducts() {
  return (SITE.products || []).map((p, i) =>
    normalizeProduct(
      {
        name: p.name,
        cat: p.cat,
        price: p.price,
        desc: p.desc,
        tag: p.tag,
        stars: p.stars,
        featured: p.featured,
        img: p.img,
        imageData: "",
        order: i,
      },
      { id: p.id },
    ),
  );
}