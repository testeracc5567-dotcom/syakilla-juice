import SITE from "@/lib/data";
import Photo from "@/components/Photo";
import Reviews from "@/components/Reviews";
import { blogPhoto } from "@/lib/photos";

export const metadata = { title: "Blog \u2014 Syakilla Juice" };

export default function BlogPage() {
  const b = SITE.blog;
  return (
    <>
      <section className="blog" id="blog">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">{b.eyebrow}</span>
              <h2 className="serif">{b.title}</h2>
            </div>
          </div>
          <p className="blog-intro">{b.intro}</p>
          <div className="blog-grid">
            {b.posts.map((p) => (
              <article className="blog-card" key={p.id}>
                <div className="blog-media">
                  <Photo src={blogPhoto(p.id)} alt={p.title} fallback={p.img} />
                  <span className="blog-cat">{p.category}</span>
                </div>
                <div className="blog-body">
                  <div className="blog-meta">
                    {p.date} {"\u00b7"} {p.readTime}
                  </div>
                  <h3 className="serif">{p.title}</h3>
                  <p>{p.excerpt}</p>
                  <div className="blog-foot">
                    <span className="blog-author">{p.author}</span>
                    <a className="link-gold" href="#">
                      Baca {"\u2192"}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Reviews />
    </>
  );
}