// =============================================================
// Ilustrasi SVG (tema hijau/putih), digambar 100% via kode.
// TIDAK ada file gambar sama sekali. Bukan gambar AI.
// Dipakai: <Illustration name="ak_ori" /> dsb.
// =============================================================
const r0 = (v) => Math.round(v);
const r1 = (v) => Math.round(v * 10) / 10;

function svgBg(w, h, uid) {
  return (
    `<defs><radialGradient id="${uid}bg" cx="50%" cy="36%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#eef9f1"/><stop offset="1" stop-color="#d5eede"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#${uid}bg)"/>` +
    `<circle cx="${r0(w * 0.14)}" cy="${r0(h * 0.2)}" r="${r0(w * 0.05)}" fill="#ffffff" opacity="0.5"/>` +
    `<circle cx="${r0(w * 0.86)}" cy="${r0(h * 0.8)}" r="${r0(w * 0.07)}" fill="#c9ead3" opacity="0.45"/>`
  );
}

function svgLeaf(x, y, s) {
  s = s || 1;
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,0 C 14,-20 42,-20 56,-2 C 36,8 12,10 0,0 Z" fill="#5cbf7a"/><path d="M5,0 C 22,-9 40,-9 52,-2" stroke="#2e9e5b" stroke-width="2.5" fill="none"/></g>`;
}

function svgGlass(cx, topY, botY, wTop, wBot, j1, j2, fill, uid) {
  const straw = "#1f7a45";
  const surfY = topY + (1 - fill) * (botY - topY);
  const hwS = wTop + (wBot - wTop) * ((surfY - topY) / (botY - topY));
  const r = 16;
  const sx = cx + wTop * 0.35;
  const body = `M${cx - wTop},${topY} L${cx + wTop},${topY} L${cx + wBot},${botY - r} Q${cx + wBot},${botY} ${cx + wBot - r},${botY} L${cx - wBot + r},${botY} Q${cx - wBot},${botY} ${cx - wBot},${botY - r} Z`;
  const juice = `M${r1(cx - hwS)},${r1(surfY)} L${r1(cx + hwS)},${r1(surfY)} L${cx + wBot},${botY - r} Q${cx + wBot},${botY} ${cx + wBot - r},${botY} L${cx - wBot + r},${botY} Q${cx - wBot},${botY} ${cx - wBot},${botY - r} Z`;
  let s = "";
  s += `<defs><linearGradient id="${uid}j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${j1}"/><stop offset="1" stop-color="${j2}"/></linearGradient></defs>`;
  s += `<ellipse cx="${cx}" cy="${botY + 24}" rx="${wTop + 20}" ry="15" fill="#0b4d29" opacity="0.12"/>`;
  s += `<path d="${body}" fill="#ffffff" opacity="0.55" stroke="#bfe0cb" stroke-width="3"/>`;
  s += `<path d="${juice}" fill="url(#${uid}j)"/>`;
  s += `<circle cx="${r0(cx - hwS * 0.35)}" cy="${r0(surfY + 55)}" r="6" fill="#fff" opacity="0.35"/><circle cx="${r0(cx + hwS * 0.2)}" cy="${r0(surfY + 90)}" r="9" fill="#fff" opacity="0.28"/><circle cx="${r0(cx - 8)}" cy="${r0(surfY + 130)}" r="5" fill="#fff" opacity="0.35"/>`;
  s += `<g transform="rotate(15 ${r0(sx)} ${r0(surfY)})"><rect x="${r0(sx - 7)}" y="${r0(surfY - 130)}" width="14" height="170" rx="7" fill="${straw}"/><rect x="${r0(sx - 7)}" y="${r0(surfY - 130)}" width="6" height="170" rx="3" fill="#ffffff" opacity="0.25"/></g>`;
  s += `<ellipse cx="${cx}" cy="${r1(surfY)}" rx="${r1(hwS)}" ry="9" fill="#ffffff" opacity="0.30"/>`;
  s += `<ellipse cx="${cx}" cy="${topY}" rx="${wTop}" ry="11" fill="#ffffff" opacity="0.45" stroke="#bfe0cb" stroke-width="3"/>`;
  s += `<rect x="${cx - wTop + 14}" y="${topY + 20}" width="9" height="${r0(botY - topY - 52)}" rx="5" fill="#ffffff" opacity="0.32"/>`;
  return { markup: s, surfY, hwS };
}

function svgFruit(x, y, r, c, c2) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${r0(x - r * 0.32)}" cy="${r0(y - r * 0.32)}" r="${r0(r * 0.34)}" fill="${c2}" opacity="0.55"/>`;
}

function citrusSegments(r, col) {
  let s = "";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s += `<line x1="0" y1="0" x2="${r1(Math.cos(a) * r)}" y2="${r1(Math.sin(a) * r)}" stroke="${col}" stroke-width="2.5"/>`;
  }
  return s;
}

// ---- Motif buah / garnish (dipakai di sisi kiri kartu) ----
function fruitIcon(key, x, y, s) {
  s = s || 1;
  const wrap = (m) => `<g transform="translate(${x},${y}) scale(${s})">${m}</g>`;
  switch (key) {
    case "alpukat":
      return wrap(
        `<ellipse rx="40" ry="52" fill="#3f6b2e"/><ellipse rx="31" ry="43" fill="#cfe39a"/><circle cy="10" r="18" fill="#8a5a2b"/><circle cx="-6" cy="3" r="6" fill="#f0f7d8" opacity="0.6"/>`,
      );
    case "mangga":
      return wrap(
        `<path d="M2,-52 C34,-42 40,10 8,50 C-24,38 -34,-24 2,-52 Z" fill="#f7a600"/><path d="M6,-40 C22,-30 26,4 10,34" stroke="#ffd77a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M2,-52 C-4,-60 -14,-60 -16,-54" stroke="#2e9e5b" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      );
    case "jeruk":
      return wrap(
        `<circle r="46" fill="#ff8400"/><circle r="37" fill="#ffb43d"/>${citrusSegments(35, "#ff8400")}<circle r="37" fill="none" stroke="#ff8400" stroke-width="3"/><circle cx="-14" cy="-14" r="7" fill="#fff" opacity="0.4"/>`,
      );
    case "semangka":
      return wrap(
        `<path d="M-52,-16 A52 52 0 0 1 52,-16 Z" fill="#2e9e5b"/><path d="M-45,-16 A45 45 0 0 1 45,-16 Z" fill="#eafff0"/><path d="M-39,-16 A39 39 0 0 1 39,-16 Z" fill="#ec2f4b"/><circle cx="-16" cy="-6" r="3" fill="#2a1a1a"/><circle cx="6" cy="-10" r="3" fill="#2a1a1a"/><circle cx="20" cy="-4" r="3" fill="#2a1a1a"/>`,
      );
    case "melon":
      return wrap(
        `<circle r="46" fill="#a9c93f"/><circle r="46" fill="none" stroke="#8fbf3f" stroke-width="3"/><path d="M-40,-10 Q0,-24 40,-10 M-42,8 Q0,-6 42,8 M-30,-28 Q0,-36 30,-28" stroke="#eef7c2" stroke-width="3" fill="none"/><circle cx="-14" cy="-16" r="7" fill="#eef7c2" opacity="0.6"/>`,
      );
    case "strawberry":
      return wrap(
        `<path d="M0,52 C-44,30 -42,-14 0,-22 C42,-14 44,30 0,52 Z" fill="#e63950"/><path d="M-20,-22 L-4,-40 L0,-26 L6,-42 L22,-22 Z" fill="#2e9e5b"/><circle cx="-14" cy="4" r="2.4" fill="#ffd77a"/><circle cx="6" cy="-2" r="2.4" fill="#ffd77a"/><circle cx="16" cy="14" r="2.4" fill="#ffd77a"/><circle cx="-6" cy="22" r="2.4" fill="#ffd77a"/><circle cx="-22" cy="20" r="2.4" fill="#ffd77a"/>`,
      );
    case "lime":
      return wrap(
        `<circle r="44" fill="#4f9e35"/><circle r="35" fill="#8fd14f"/>${citrusSegments(33, "#4f9e35")}<circle r="35" fill="none" stroke="#4f9e35" stroke-width="3"/><circle cx="-13" cy="-13" r="6" fill="#fff" opacity="0.4"/>`,
      );
    case "lemon":
      return wrap(
        `<ellipse rx="48" ry="37" fill="#e6c400"/><ellipse rx="39" ry="29" fill="#f6e75a"/>${citrusSegments(27, "#e6c400")}<ellipse rx="39" ry="29" fill="none" stroke="#e6c400" stroke-width="3"/><circle cx="-14" cy="-12" r="6" fill="#fff" opacity="0.4"/>`,
      );
    case "apple":
      return wrap(
        `<path d="M0,-28 C-30,-42 -48,-10 -32,28 C-20,50 -4,44 0,38 C4,44 20,50 32,28 C48,-10 30,-42 0,-28 Z" fill="#e2413f"/><path d="M0,-28 C-2,-44 -8,-50 -16,-50" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M2,-38 C10,-52 26,-50 28,-38 C20,-32 8,-34 2,-38 Z" fill="#2e9e5b"/><ellipse cx="-13" cy="2" rx="7" ry="13" fill="#fff" opacity="0.32"/>`,
      );
    case "grape": {
      const gp = (gx, gy) =>
        `<circle cx="${gx}" cy="${gy}" r="14" fill="#8a5ab0"/><circle cx="${gx - 4}" cy="${gy - 4}" r="4" fill="#d3b6e8" opacity="0.7"/>`;
      return wrap(
        `<rect x="-3" y="-46" width="6" height="18" rx="3" fill="#2e9e5b"/>` +
          gp(-16, -20) + gp(16, -20) + gp(0, -8) + gp(-28, 4) +
          gp(28, 4) + gp(-13, 16) + gp(13, 16) + gp(0, 30),
      );
    }
    case "banana":
      return wrap(
        `<path d="M-36,-24 C-30,28 8,42 42,18 C34,34 -8,26 -24,-20 Z" fill="#ffd24d"/><path d="M-36,-24 C-30,28 8,42 42,18" stroke="#e0a800" stroke-width="3" fill="none"/><path d="M-36,-24 C-38,-30 -34,-34 -28,-32" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      );
    case "cherry":
      return wrap(
        `<path d="M0,-34 C14,-46 32,-44 36,-28" stroke="#2e9e5b" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M0,-34 C-6,-20 -8,-6 -8,2" stroke="#7a4a24" stroke-width="3" fill="none"/><circle cx="-8" cy="14" r="16" fill="#e63950"/><circle cx="20" cy="18" r="14" fill="#c81e3a"/><circle cx="-13" cy="9" r="4" fill="#fff" opacity="0.45"/>`,
      );
    case "leaf":
      return wrap(
        `<path d="M0,0 C 16,-28 52,-28 68,-2 C 46,10 14,12 0,0 Z" fill="#5cbf7a"/><path d="M6,0 C 26,-13 50,-13 64,-2" stroke="#2e9e5b" stroke-width="3" fill="none"/><path d="M-8,12 C 6,-8 32,-18 52,-18 C 36,-4 16,8 -2,22 Z" fill="#7bcf92"/>`,
      );
    default: // mix
      return wrap(
        svgFruit(-18, -6, 26, "#ff6b81", "#ffa8b4") +
          svgFruit(20, -14, 22, "#ffd24d", "#ffe497") +
          svgFruit(14, 18, 20, "#8fd14f", "#cfe39a") +
          svgFruit(-20, 22, 16, "#ec5aa0", "#f7b8d6"),
      );
  }
}

// ---- Overlay di dalam gelas per gaya minuman ----
function svgIce(cx, y, hw) {
  const cube = (dx, dy, rot) => {
    const x = r0(cx + dx), yy = r0(y + dy);
    return `<g transform="rotate(${rot} ${x} ${yy})"><rect x="${x - 17}" y="${yy - 17}" width="34" height="34" rx="7" fill="#ffffff" opacity="0.5" stroke="#ffffff" stroke-width="2"/><rect x="${x - 14}" y="${yy - 14}" width="12" height="12" rx="3" fill="#ffffff" opacity="0.4"/></g>`;
  };
  return cube(-hw * 0.34, 42, -12) + cube(hw * 0.3, 62, 14) + cube(-hw * 0.02, 100, 6);
}

function svgFoam(cx, y, hw) {
  return (
    `<g><ellipse cx="${cx}" cy="${r1(y - 4)}" rx="${r1(hw + 6)}" ry="18" fill="#fff5e6"/>` +
    `<circle cx="${r0(cx - hw * 0.5)}" cy="${r0(y - 16)}" r="${r0(hw * 0.44)}" fill="#fff8ee"/>` +
    `<circle cx="${r0(cx + hw * 0.5)}" cy="${r0(y - 16)}" r="${r0(hw * 0.44)}" fill="#fff8ee"/>` +
    `<circle cx="${cx}" cy="${r0(y - 34)}" r="${r0(hw * 0.52)}" fill="#fffaf2"/>` +
    `<circle cx="${cx}" cy="${r0(y - 58)}" r="12" fill="#e63950"/>` +
    `<rect x="${cx - 2}" y="${r0(y - 80)}" width="4" height="22" rx="2" fill="#2e9e5b"/></g>`
  );
}

function svgBand(cx, y, hw, color, crumb) {
  let s = `<ellipse cx="${cx}" cy="${r1(y + 2)}" rx="${r1(hw)}" ry="8" fill="${color}"/>`;
  s += `<path d="M${r1(cx - hw)},${r1(y + 2)} L${r1(cx + hw)},${r1(y + 2)} L${r1(cx + hw * 0.9)},${r1(y + 36)} L${r1(cx - hw * 0.9)},${r1(y + 36)} Z" fill="${color}" opacity="0.95"/>`;
  if (crumb) {
    const bit = (dx, dy, rr) =>
      `<circle cx="${r0(cx + dx)}" cy="${r0(y + dy)}" r="${rr}" fill="#ffffff" opacity="0.55"/>`;
    s += bit(-hw * 0.4, 12, 3) + bit(hw * 0.3, 10, 2.5) + bit(-hw * 0.05, 24, 3) + bit(hw * 0.18, 27, 2);
  }
  return s;
}

function svgOreo(cx, y, hw) {
  const bit = (dx, dy, rot) => {
    const x = r0(cx + dx), yy = r0(y + dy);
    return `<g transform="rotate(${rot} ${x} ${yy})"><rect x="${x - 11}" y="${yy - 8}" width="22" height="16" rx="4" fill="#2a2426"/><rect x="${x - 11}" y="${yy - 2}" width="22" height="4" fill="#efe6d0"/></g>`;
  };
  return bit(-hw * 0.4, 16, -18) + bit(hw * 0.3, 32, 20) + bit(-hw * 0.02, 54, 8);
}

// ---- Konfigurasi visual tiap produk (warna + gaya + garnish) ----
const AV1 = "#cfe39a", AV2 = "#8ab24a";
const VIS = {
  ak_ori: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat" },
  ak_coklat: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat", topping: { color: "#6b4226" } },
  ak_keju: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat", topping: { color: "#ffd76b", crumb: true } },
  ak_milo: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat", topping: { color: "#7a4a24", crumb: true } },
  ak_oreo: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat", topping: { color: "#33292b", crumb: true } },
  ak_special: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat", topping: { color: "#6b4226", crumb: true } },
  ak_glaze: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat", topping: { color: "#e8b84b" } },
  ak_yakult: { style: "kocok", c1: AV1, c2: AV2, garnish: "alpukat", topping: { color: "#f5ead0" } },
  ak_nutella: { style: "kocok", c1: "#a9733f", c2: "#5b3418", garnish: "alpukat", topping: { color: "#3a2416" } },

  sq_blue: { style: "squash", c1: "#5bb4f0", c2: "#1f74d6", garnish: "lime" },
  sq_strawberry: { style: "squash", c1: "#ff7d90", c2: "#e63950", garnish: "strawberry" },
  sq_melon: { style: "squash", c1: "#d4e86b", c2: "#a9c93f", garnish: "melon" },
  sq_jeruk: { style: "squash", c1: "#ffc24d", c2: "#ff8400", garnish: "jeruk" },
  sq_blackcurrant: { style: "squash", c1: "#9a6fc0", c2: "#5b3a86", garnish: "grape" },
  sq_lemon: { style: "squash", c1: "#f6e75a", c2: "#e6c400", garnish: "lemon" },
  sq_apel: { style: "squash", c1: "#a6de6a", c2: "#6fb32f", garnish: "apple" },

  tea_original: { style: "tea", c1: "#c77b3a", c2: "#8a4f22", garnish: "leaf" },
  tea_lychee: { style: "tea", c1: "#f3c9d6", c2: "#e79bb4", garnish: "cherry" },
  tea_lemon: { style: "tea", c1: "#f0d95a", c2: "#d9b52e", garnish: "lemon" },
  tea_moca: { style: "tea", c1: "#7a4a2c", c2: "#4b2c17", garnish: "leaf" },
  tea_yakult: { style: "tea", c1: "#f0dca8", c2: "#d8b46e", garnish: "leaf" },
  tea_milo: { style: "tea", c1: "#8a5a34", c2: "#4f3018", garnish: "leaf" },

  ms_original: { style: "shake", c1: "#f7efd8", c2: "#e6d3ad", garnish: "leaf" },
  ms_chocolate: { style: "shake", c1: "#b07a4e", c2: "#6b4226", garnish: "leaf" },
  ms_chocobar: { style: "shake", c1: "#b07a4e", c2: "#5b3418", garnish: "leaf" },
  ms_chocoqueen: { style: "shake", c1: "#a56a42", c2: "#5b3418", garnish: "leaf" },
  ms_chococrumb: { style: "shake", c1: "#b07a4e", c2: "#6b4226", garnish: "leaf" },
  ms_chococheese: { style: "shake", c1: "#d9a24e", c2: "#a9733f", garnish: "leaf" },
  ms_greentea: { style: "shake", c1: "#b7d98a", c2: "#7bab4a", garnish: "leaf" },
  ms_strawberry: { style: "shake", c1: "#ffb0c2", c2: "#f06a86", garnish: "strawberry" },
  ms_redvelvet: { style: "shake", c1: "#d65a5a", c2: "#9e2a2a", garnish: "cherry" },
  ms_tiramisu: { style: "shake", c1: "#d8b98a", c2: "#b08a54", garnish: "leaf" },
  ms_thaitea: { style: "shake", c1: "#f0a24e", c2: "#d9772a", garnish: "leaf" },
  ms_taro: { style: "shake", c1: "#c9a8e0", c2: "#9a6fc0", garnish: "leaf" },

  mk_mangga: { style: "milky", c1: "#ffd76b", c2: "#f7a600", garnish: "mangga" },
  mk_grape: { style: "milky", c1: "#c49be0", c2: "#8a5ab0", garnish: "grape" },
  mk_bluevanila: { style: "milky", c1: "#9fd6f2", c2: "#4aa3e8", garnish: "leaf" },
  mk_chocobanana: { style: "milky", c1: "#e0c46a", c2: "#a9733f", garnish: "banana" },
};

function productSvg(key) {
  const v = VIS[key] || { style: "kocok", c1: "#ff8fb0", c2: "#ffb03a", garnish: "mix" };
  const W = 800, H = 550, cx = 470;
  let topY, botY, wTop, wBot;
  const st = v.style;
  if (st === "squash") { topY = 138; botY = 442; wTop = 86; wBot = 64; }
  else if (st === "tea") { topY = 134; botY = 446; wTop = 94; wBot = 70; }
  else if (st === "shake") { topY = 168; botY = 436; wTop = 90; wBot = 66; }
  else if (st === "milky") { topY = 150; botY = 432; wTop = 92; wBot = 72; }
  else { topY = 156; botY = 432; wTop = 96; wBot = 74; }
  const uid = "p" + key.replace(/[^a-z0-9]/gi, "");
  const g = svgGlass(cx, topY, botY, wTop, wBot, v.c1, v.c2, 0.82, uid);
  let over = "";
  if (v.topping) over += svgBand(cx, g.surfY, g.hwS, v.topping.color, v.topping.crumb);
  if (st === "squash" || st === "tea") over += svgIce(cx, g.surfY, g.hwS);
  if (st === "milky") over += svgOreo(cx, g.surfY, g.hwS);
  if (st === "shake") over += svgFoam(cx, g.surfY, g.hwS);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    svgBg(W, H, uid) +
    svgLeaf(cx - wTop - 34, g.surfY + 6, 0.9) +
    fruitIcon(v.garnish, 200, 268, 1.3) +
    g.markup + over + `</svg>`
  );
}

function heroSvg() {
  const W = 1500, H = 950;
  const g1 = svgGlass(980, 360, 780, 120, 92, "#cfe39a", "#8ab24a", 0.82, "h1");
  const g2 = svgGlass(1230, 420, 800, 100, 78, "#ff7d90", "#e63950", 0.82, "h2");
  const g3 = svgGlass(760, 430, 810, 108, 84, "#c77b3a", "#8a4f22", 0.82, "h3");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    svgBg(W, H, "hero") + g3.markup + g1.markup + g2.markup +
    svgLeaf(700, 470, 1.2) + svgLeaf(1330, 470, 1.0) + svgLeaf(560, 700, 0.9) +
    fruitIcon("alpukat", 600, 300, 1.2) + fruitIcon("strawberry", 1360, 300, 1.1) +
    `</svg>`
  );
}

function craftSvg() {
  const W = 1200, H = 900;
  const g = svgGlass(430, 230, 700, 140, 108, "#cfe39a", "#8ab24a", 0.82, "crg");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    svgBg(W, H, "cr") +
    `<rect x="120" y="600" width="980" height="150" rx="32" fill="#e7d3b3"/><rect x="120" y="600" width="980" height="150" rx="32" fill="none" stroke="#d8bf95" stroke-width="5"/><circle cx="150" cy="675" r="7" fill="#d8bf95"/>` +
    g.markup +
    fruitIcon("jeruk", 830, 300, 1.5) + fruitIcon("strawberry", 1000, 470, 1.3) +
    fruitIcon("alpukat", 770, 560, 1.25) + fruitIcon("lemon", 960, 650, 1.15) +
    fruitIcon("lime", 720, 690, 1.1) +
    svgLeaf(700, 300, 1.3) + svgLeaf(900, 520, 1.0) + svgLeaf(1010, 300, 0.9) +
    `</svg>`
  );
}

export function pic(key) {
  if (VIS[key]) return productSvg(key);
  if (key === "hero") return heroSvg();
  if (key === "craft") return craftSvg();
  return "";
}

export function productDataUri(key) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(productSvg(key));
}

export default function Illustration({ name, className = "" }) {
  return (
    <span
      className={"illus " + className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: pic(name) }}
    />
  );
}