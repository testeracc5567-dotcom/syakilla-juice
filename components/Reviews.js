import SITE from "@/lib/data";
import { starStr } from "@/lib/format";

export default function Reviews() {
  const r = SITE.reviews;
  return (
    <section className="quotes" id="reviews">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{r.eyebrow}</span>
            <h2 className="serif">{r.title}</h2>
          </div>
        </div>
        <div className="q-grid">
          {r.items.map((q, i) => (
            <div className="q-card" key={i}>
              <div className="stars">{starStr(q.stars)}</div>
              <p>{q.text}</p>
              <div className="q-who">
                <div className="q-av">{q.avatar}</div>
                <div>
                  <div className="nm">{q.name}</div>
                  <div className="rl">{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
