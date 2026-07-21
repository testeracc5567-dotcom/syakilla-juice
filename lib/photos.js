// =============================================================
// Foto produk & blog diambil otomatis dari loremflickr (foto asli,
// gratis, tanpa API key) berdasarkan kata kunci tiap item.
//
// CATATAN: loremflickr milih foto ACAK sesuai kata kunci, jadi kadang
// kurang pas 100% dengan rasa spesifik. Kalau nanti mau foto yang benar
// -benar sesuai, tinggal ganti kata kunci di bawah, atau ganti pakai foto
// sendiri (lihat versi lokal /public/products/<id>.jpg).
//
// Foto dimuat oleh browser pengunjung, jadi butuh koneksi internet.
// Kalau gagal dimuat, otomatis balik ke ilustrasi (lihat components/Photo.js).
// =============================================================

// Kata kunci foto per produk
const PRODUCT_KW = {
  // Alpukat Kocok
  ak_ori: "avocado,juice",
  ak_coklat: "avocado,chocolate,drink",
  ak_keju: "avocado,shake",
  ak_milo: "avocado,chocolate,milkshake",
  ak_oreo: "avocado,oreo,shake",
  ak_special: "avocado,smoothie",
  ak_glaze: "avocado,drink",
  ak_yakult: "avocado,yogurt,drink",
  ak_nutella: "avocado,chocolate,shake",

  // Squash (soda buah)
  sq_blue: "blue,soda,drink",
  sq_strawberry: "strawberry,soda,drink",
  sq_melon: "melon,soda,drink",
  sq_jeruk: "orange,soda,drink",
  sq_blackcurrant: "blackcurrant,soda,drink",
  sq_lemon: "lemon,soda,drink",
  sq_apel: "apple,soda,drink",

  // Tea Series
  tea_original: "iced,tea",
  tea_lychee: "lychee,tea",
  tea_lemon: "lemon,tea",
  tea_moca: "mocha,coffee,drink",
  tea_yakult: "yogurt,tea,drink",
  tea_milo: "chocolate,milk,tea",

  // Milkshake Series
  ms_original: "milkshake,vanilla",
  ms_chocolate: "chocolate,milkshake",
  ms_chocobar: "chocolate,milkshake",
  ms_chocoqueen: "chocolate,milkshake",
  ms_chococrumb: "chocolate,milkshake",
  ms_chococheese: "chocolate,cheesecake,milkshake",
  ms_greentea: "matcha,milkshake",
  ms_strawberry: "strawberry,milkshake",
  ms_redvelvet: "red,velvet,milkshake",
  ms_tiramisu: "tiramisu,drink",
  ms_thaitea: "thai,tea,drink",
  ms_taro: "purple,milkshake",

  // Milky Series
  mk_mangga: "mango,milk,drink",
  mk_grape: "grape,milk,drink",
  mk_bluevanila: "blue,milk,drink",
  mk_chocobanana: "banana,chocolate,milk",
};

// Kata kunci foto per artikel blog
const BLOG_KW = {
  "alpukat-nagih": "avocado,juice",
  "squash-vs-teh": "soda,iced,tea",
  "milkshake-lembut": "milkshake",
  "fresh-tiap-pesanan": "fresh,juice,fruit",
  "milky-series-baru": "milk,drink",
  "simpan-buah-segar": "fresh,fruit",
};

// Angka "lock" bikin foto tiap item tetap konsisten (gak ganti-ganti tiap
// refresh) dan beda antar item.
function lockFor(id) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return n % 1000;
}

function build(kw, id, w, h) {
  return (
    "https://loremflickr.com/" + w + "/" + h + "/" + kw + "?lock=" + lockFor(id)
  );
}

export function productPhoto(id) {
  return build(PRODUCT_KW[id] || "juice,drink", id, 600, 600);
}

export function blogPhoto(id) {
  return build(BLOG_KW[id] || "juice,cafe", id, 800, 600);
}
// Foto besar buat section editorial / halaman Tentang (foto asli, bukan AI).
export function craftPhoto() {
  return build("fresh,fruit,juice,glass", "craft_editorial", 1000, 750);
}

// Foto keren buat banner AI Assistant (foto jus asli, bukan gambar robot AI).
export function aiPhoto() {
  return build("fresh,juice,fruit,drink", "ai_banner", 320, 320);
}