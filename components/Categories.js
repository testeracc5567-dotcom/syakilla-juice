import SITE from "@/lib/data";
import Illustration from "./Illustration";

export default function Categories() {
  const c = SITE.categories;
  return (
    <section id="categories">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="serif">{c.title}</h2>
          </div>
          <a className="link-gold" href={c.link.href}>
            {c.link.label} â†’
          </a>
        </div>
        <div className="cats">
          {c.items.map((it) => (
            <a className="cat" href={it.href} key={it.name}>
              <Illustration name={it.image} />
              <div className="cat-label">
                <span>{it.count}</span>
                <h3 className="serif">{it.name}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
