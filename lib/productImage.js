// Tentukan sumber gambar produk: pakai foto upload (base64) kalau ada,
// kalau nggak pakai foto default dari keyword (loremflickr).
import { productPhoto } from "./photos";

export function productImage(p) {
  if (p && typeof p.imageData === "string" && p.imageData) return p.imageData;
  return productPhoto(p ? p.id : "");
}