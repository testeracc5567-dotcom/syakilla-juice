// ====== DATA PEMBAYARAN SYAKILLA JUICE ======
// ISI SENDIRI DI SINI. Yang bertanda ISI_... ganti pakai data asli kamu.
// Setelah diubah: git add . ; git commit -m "update rekening" ; git push

// 1) TRANSFER BANK
export const BANKS = [
  { bank: "BCA", number: "ISI_NOMOR_REKENING_BCA", holder: "ISI NAMA PEMILIK REKENING" },
  { bank: "BRI", number: "ISI_NOMOR_REKENING_BRI", holder: "ISI NAMA PEMILIK REKENING" },
  { bank: "Mandiri", number: "ISI_NOMOR_REKENING_MANDIRI", holder: "ISI NAMA PEMILIK REKENING" },
];

// 2) E-WALLET
export const EWALLETS = [
  { name: "DANA", number: "ISI_NOMOR_DANA", holder: "ISI NAMA AKUN" },
  { name: "OVO", number: "ISI_NOMOR_OVO", holder: "ISI NAMA AKUN" },
  { name: "GoPay", number: "ISI_NOMOR_GOPAY", holder: "ISI NAMA AKUN" },
];

// 3) QRIS
// Taruh gambar QRIS di folder "public" (misal public/qris.png),
// lalu tulis image: "/qris.png". Kalau masih kosong, di checkout muncul
// tulisan "QRIS sedang disiapkan".
export const QRIS = {
  image: "",
  merchant: "ISI NAMA MERCHANT QRIS",
  note: "Scan QRIS pakai aplikasi bank / e-wallet apa aja, lalu kirim bukti bayar lewat chat.",
};

export function isFilled(v) {
  const s = String(v || "");
  return !!s && !s.startsWith("ISI");
}
