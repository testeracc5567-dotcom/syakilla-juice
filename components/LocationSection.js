import SITE from "@/lib/data";
import { Icon } from "./Icons";

export default function LocationSection() {
  const loc = SITE.location;
  return (
    <section className="location" id="lokasi">
      <div className="wrap">
        <div className="loc-head anim-reveal">
          <span className="eyebrow">Lokasi Kami</span>
          <h2 className="serif">{loc.title}</h2>
          <p>{loc.intro}</p>
        </div>
        <div className="loc-grid">
          <div className="loc-info anim-reveal">
            <div className="loc-row">
              <span className="loc-ic">
                <Icon name="pin" />
              </span>
              <div>
                <strong>Alamat</strong>
                <p>{loc.address}</p>
              </div>
            </div>
            <div className="loc-row">
              <span className="loc-ic">
                <Icon name="drop" />
              </span>
              <div>
                <strong>Jam Buka</strong>
                <p>{loc.hours}</p>
              </div>
            </div>
            <div className="loc-row">
              <span className="loc-ic">
                <Icon name="wa" />
              </span>
              <div>
                <strong>WhatsApp</strong>
                <p>{loc.phone}</p>
              </div>
            </div>
            <a
              className="btn-primary loc-btn"
              href={loc.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="pin" /> Buka di Google Maps
            </a>
          </div>
          <div className="loc-map anim-reveal">
            <iframe
              title="Peta Lokasi Syakilla Juice"
              src={loc.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}