"use client";
import { useState } from "react";
import Illustration from "./Illustration";

// Nampilin foto produk. Kalau fotonya belum ada / gagal dimuat, otomatis balik
// ke ilustrasi SVG biar gak pernah blank.
export default function Photo({ src, alt, fallback, className }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <Illustration name={fallback} className={className} />;
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt || ""}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}