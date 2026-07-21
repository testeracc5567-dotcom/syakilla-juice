import SITE from "@/lib/data";

// Logo gambar: gelas berisi jus + sedotan + buah. Digambar via SVG (tanpa file).
const ICON = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 6 H24 L21.5 28 Q21.4 29 20.4 29 H11.6 Q10.6 29 10.5 28 Z" fill="rgba(255,255,255,0.18)" stroke="#ffffff" stroke-width="1.7" stroke-linejoin="round"/>
  <path d="M8.8 13 H23.2 L21.5 28 Q21.4 28.6 20.7 28.6 H11.3 Q10.6 28.6 10.5 28 Z" fill="#ffd24d"/>
  <path d="M8.8 13 H23.2 L22.7 17 H9.3 Z" fill="#ff9a3d"/>
  <ellipse cx="16" cy="6" rx="8" ry="1.6" fill="#ffffff" opacity="0.55"/>
  <path d="M19 4 L15.4 20" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <circle cx="22.5" cy="7.5" r="3.1" fill="#d6f7a8"/>
  <path d="M24.6 5.2 C26 4 27.4 4.2 27.8 4.4 C27.4 5.8 26.2 6.4 24.9 6.2 Z" fill="#bff08a"/>
</svg>`;

export default function Logo() {
  return (
    <span className="logo">
      <span
        className="logo-ic"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: ICON }}
      />
      <span>
        {SITE.brand.name}
        <b>{SITE.brand.accent}</b>
      </span>
    </span>
  );
}