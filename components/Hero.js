import SITE from "@/lib/data";

export default function Hero() {
  const h = SITE.hero;
  return (
    <div className="hero" id="top">
      <div className="hero-bg">
        {/* Video langsung main, tanpa gambar pembuka */}
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          {h.videoUrls.map((src) => (
            <source key={src} src={src} type="video/mp4" />
          ))}
        </video>
      </div>
      <div className="wrap">
        <div className="hero-inner">
          <span className="eyebrow">{h.eyebrow}</span>
          <h1
            className="serif"
            dangerouslySetInnerHTML={{ __html: h.titleHtml }}
          />
          <p>{h.text}</p>
          <div className="hero-cta">
            <a className="btn btn-gold" href={h.primaryCta.href}>
              {h.primaryCta.label}
            </a>
            <a className="btn btn-ghost" href={h.secondaryCta.href}>
              {h.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
      <div className="scroll-hint">
        Scroll
        <span></span>
      </div>
    </div>
  );
}