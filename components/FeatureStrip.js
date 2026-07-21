import SITE from "@/lib/data";
import { Icon } from "./Icons";

export default function FeatureStrip() {
  return (
    <div className="strip">
      <div className="wrap strip-grid">
        {SITE.features.map((f) => (
          <div className="strip-item" key={f.title}>
            <div className="ic">
              <Icon name={f.icon} />
            </div>
            <h4>{f.title}</h4>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
