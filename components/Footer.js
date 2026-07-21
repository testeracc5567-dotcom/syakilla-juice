import SITE from "@/lib/data";
import { Icon } from "./Icons";
import Logo from "./Logo";

export default function Footer() {
  const f = SITE.footer;
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Logo />
            <p>{f.about}</p>
            <div className="socials">
              {f.socials.map((s) => (
                <a href={s.href} key={s.icon} aria-label={s.icon}>
                  <Icon name={s.icon} />
                </a>
              ))}
            </div>
          </div>
          {f.columns.map((col) => (
            <div className="foot-col" key={col.title}>
              <h5>{col.title}</h5>
              {col.links.map((l) => (
                <a href={l.href} key={l.label}>{l.label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span>{f.copyright}</span>
        </div>
      </div>
    </footer>
  );
}