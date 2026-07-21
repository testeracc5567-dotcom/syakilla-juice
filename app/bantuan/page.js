import { Icon } from "@/components/Icons";

export const metadata = { title: "Bantuan — Syakilla Juice" };

const STEPS = [
  {
    title: "Pilih menu favoritmu",
    text: "Buka halaman Belanja, pilih jus yang kamu mau, lalu masukin ke keranjang.",
  },
  {
    title: "Cek keranjang",
    text: "Klik ikon keranjang di kanan atas buat lihat pesanan dan atur jumlahnya.",
  },
  {
    title: "Checkout & isi data",
    text: "Tekan Checkout, isi nama, nomor HP/WhatsApp, dan alamat kalau mau diantar.",
  },
  {
    title: "Pilih pembayaran",
    text: "Bisa Transfer Bank, E-Wallet (DANA/OVO/GoPay), atau COD bayar di tempat.",
  },
  {
    title: "Tunggu pesananmu",
    text: "Pesanan langsung kami siapkan fresh. Status bisa kamu tanyakan lewat chat admin.",
  },
];

const DELIVERY = [
  {
    icon: "store",
    title: "Ambil Sendiri",
    text: "Pesan online, lalu ambil langsung di gerai Syakilla Juice, Batuphat Timur.",
  },
  {
    icon: "pin",
    title: "Diantar ke Sekitar Batuphat",
    text: "Kami antar ke kawasan Batuphat & Lhokseumawe. Ongkir menyesuaikan jarak.",
  },
  {
    icon: "drop",
    title: "Selalu Fresh Sampai Tujuan",
    text: "Jus dibuat pas pesanan masuk biar tetap segar waktu kamu terima.",
  },
];

export default function BantuanPage() {
  return (
    <div className="bantuan">
      <div className="wrap">
        <header className="bantuan-hero">
          <span className="eyebrow">Pusat Bantuan</span>
          <h1 className="serif">Butuh bantuan? Kami bantu, kok.</h1>
          <p>
            Semua yang perlu kamu tahu soal cara pesan dan pengantaran ada di
            sini. Kalau masih bingung, tinggal chat admin dari tombol di pojok
            layar ya.
          </p>
        </header>

        <section className="bantuan-sec" id="cara-pesan">
          <h2 className="serif">Cara Pesan</h2>
          <ol className="bantuan-steps">
            {STEPS.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bantuan-sec" id="pengantaran">
          <h2 className="serif">Pengantaran</h2>
          <ul className="bantuan-list">
            {DELIVERY.map((d) => (
              <li key={d.title}>
                <Icon name={d.icon} />
                <div>
                  <strong>{d.title}</strong>
                  <p>{d.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}