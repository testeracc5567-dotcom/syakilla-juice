import SITE from "@/lib/data";
import Photo from "./Photo";
import { craftPhoto } from "@/lib/photos";

export default function Editorial() {
  const c = SITE.craft;
  return (
    <section className="editorial" id="craft">
      <div className="wrap ed-grid">
        <div className="ed-media anim-reveal">
          <Photo
            src={craftPhoto()}
            alt={c.title}
            fallback={c.image}
            className="ed-photo"
          />
        </div>
        <div className="ed-text">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="serif">{c.title}</h2>
          {c.paragraphs.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
          <div className="stats">
            {c.stats.map((s) => (
              <div className="stat" key={s.l}>
                <div className="n serif">{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}