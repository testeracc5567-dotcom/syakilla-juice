# Jus Buah Batuphat — Next.js

Website jus buah, dibuat dengan **Next.js (App Router)**. Semua gambar digambar
langsung via kode (inline SVG), jadi **tidak ada file gambar** — gampang di-hosting.

## Cara jalanin (di VS Code)

1. Buka folder ini di VS Code.
2. Buka Terminal, lalu jalankan sekali: `npm install`
3. Jalankan dev server: `npm run dev`
4. Buka browser ke http://localhost:3000

## Cara hosting (paling gampang: Vercel)

1. Push folder ini ke GitHub.
2. Buka vercel.com -> New Project -> pilih repo -> Deploy.

Atau build manual: `npm run build` lalu `npm start`.

## Struktur folder

- `app/` halaman (App Router): `layout.js`, `page.js`, `globals.css`, `tentang/`
- `components/` komponen UI (Header, ProductCard, CartDrawer, Icons, Illustration, ...)
- `context/` state global keranjang & UI (React Context)
- `lib/` data & helper -> **edit `lib/data.js`** buat menu, harga, teks, nomor WA

Nomor WhatsApp sekarang: 6285762258302 (ubah di `lib/data.js`).
