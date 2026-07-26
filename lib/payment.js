// ====== DATA PEMBAYARAN SYAKILLA JUICE ======
// ISI SENDIRI DI SINI. Yang bertanda ISI_... ganti pakai data asli kamu.
// Yang belum diisi otomatis DISEMBUNYIIN dari pembeli.

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

// 3) QRIS - gambar QRIS ditaruh di folder public (public/qris.png).
export const QRIS = {
  image: "/qris.png",
  merchant: "ZEDNAGA STORE2 - TELECOMMUNICATION",
  nmid: "ID1025454026812",
  note: "Scan pakai aplikasi bank / e-wallet apa aja, lalu klik Saya Sudah Bayar.",
};

export function isFilled(v) {
  const s = String(v || "");
  return !!s && !s.startsWith("ISI");
}
