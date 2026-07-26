// Daftar voucher & ongkir Syakilla Juice.
// Dipakai di CheckoutModal. Tambah/ubah kode voucher cukup di array VOUCHERS.
import { money } from "./format";

export const SHIPPING_FEE = 5000;

export const VOUCHERS = [
  {
    code: "SYAKILLA10",
    label: "Diskon 10%",
    type: "percent",
    value: 10,
    maxDiscount: 10000,
    min: 20000,
    desc: "Potongan 10%, maks Rp 10.000",
  },
  {
    code: "HEMAT5K",
    label: "Potongan Rp 5.000",
    type: "amount",
    value: 5000,
    min: 25000,
    desc: "Langsung potong Rp 5.000",
  },
  {
    code: "GRATISONGKIR",
    label: "Gratis Ongkir",
    type: "shipping",
    value: 0,
    min: 30000,
    desc: "Ongkir jadi gratis",
  },
  {
    code: "SEGAR20",
    label: "Diskon 20%",
    type: "percent",
    value: 20,
    maxDiscount: 20000,
    min: 75000,
    desc: "Potongan 20%, maks Rp 20.000",
  },
];

export function findVoucher(code) {
  const c = String(code || "")
    .trim()
    .toUpperCase();
  if (!c) return null;
  return VOUCHERS.find((v) => v.code === c) || null;
}

// Hitung potongan voucher.
// return { ok, error, voucher, discount, shippingDiscount }
export function applyVoucher(code, subtotal, shipping) {
  const sub = Number(subtotal) || 0;
  const ship = Number(shipping) || 0;
  const v = findVoucher(code);

  if (!v) {
    return {
      ok: false,
      error: String(code || "").trim()
        ? "Kode voucher tidak ditemukan."
        : "",
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
