import SITE from "@/lib/data";
import CategoryAccordion from "@/components/CategoryAccordion";

export const metadata = { title: "Belanja \u2014 Syakilla Juice" };

export default function Belanja() {
  const cats =
    SITE.categories && SITE.categories.length
      ? SITE.categories
      : [...new Set(SITE.products.map((p) => p.cat))];
  return (
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
        <div className="acc">
          {cats.map((cat, i) => (
            <CategoryAccordion
              key={cat}
              title={cat}
              defaultOpen={i === 0}
              products={SITE.products.filter((p) => p.cat === cat)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}