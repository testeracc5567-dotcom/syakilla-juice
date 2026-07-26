// Voucher Syakilla Juice: SEKARANG CUMA DARI TUKAR POIN.
// Nggak ada lagi kode voucher yang diketik manual.
// 1 poin = Rp 1.000 belanja (dihitung dari pesanan yang udah Selesai).
import { money } from "./format";

export const SHIPPING_FEE = 5000;

export const POINT_VOUCHERS = [
  { code: "POINONGKIR", label: "Gratis Ongkir", cost: 15, type: "shipping", value: 0, min: 0, desc: "Ongkir jadi gratis" },
  { code: "POIN5K", label: "Potongan Rp 5.000", cost: 25, type: "amount", value: 5000, min: 10000, desc: "Langsung potong Rp 5.000" },
  { code: "POIN10K", label: "Potongan Rp 10.000", cost: 45, type: "amount", value: 10000, min: 20000, desc: "Langsung potong Rp 10.000" },
  { code: "POIN20", label: "Diskon 20%", cost: 80, type: "percent", value: 20, maxDiscount: 20000, min: 30000, desc: "Potongan 20%, maks Rp 20.000" },
];

// Kompatibilitas komponen lama.
export const VOUCHERS = POINT_VOUCHERS;

export function findVoucher(code) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return null;
  return POINT_VOUCHERS.find((v) => v.code === c) || null;
}

export function applyVoucher(code, subtotal, shipping) {
  const sub = Number(subtotal) || 0;
  const ship = Number(shipping) || 0;
  const v = findVoucher(code);

  if (!v) {
    return {
      ok: false,
      error: String(code || "").trim() ? "Voucher tidak ditemukan." : "",
      voucher: null,
      discount: 0,
      shippingDiscount: 0,
    };
  }

  if (sub < (v.min || 0)) {
    return {
      ok: false,
      error: "Minimal belanja " + money(v.min) + " buat pakai voucher ini.",
      voucher: v,
      discount: 0,
      shippingDiscount: 0,
    };
  }

  let discount = 0;
  let shippingDiscount = 0;

  if (v.type === "percent") {
    discount = Math.round((sub * v.value) / 100);
    if (v.maxDiscount) discount = Math.min(discount, v.maxDiscount);
  } else if (v.type === "amount") {
    discount = Math.min(v.value, sub);
  } else if (v.type === "shipping") {
    shippingDiscount = ship;
  }

  return { ok: true, error: "", voucher: v, discount, shippingDiscount };
}
