import BelanjaList from "@/components/BelanjaList";
import Reviews from "@/components/Reviews";

export const metadata = { title: "Belanja \u2014 Syakilla Juice" };

export default function Belanja() {
  return (
    <>
      <section id="collection">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Semua Menu</span>
              <h2 className="serif">Belanja</h2>
            </div>
            <a className="link-gold" href="/">
              {"\u2190"} Kembali ke beranda
            </a>
          </div>
          <BelanjaList />
        </div>
      </section>
      <Reviews />
    </>
  );
}
