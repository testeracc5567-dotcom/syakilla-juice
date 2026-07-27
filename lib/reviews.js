// Ulasan produk. Sumber utamanya SERVER (Firestore lewat /api/reviews) biar
// rating kelihatan di semua browser/HP. localStorage cuma cache biar gak kedip.
// Struktur: { [productId]: [{ id, name, email, stars, text, ts }] }
const REVIEWS_KEY = "syk_reviews_v1";

let cache = null;

function readLocal() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function writeLocal(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(data || {}));
  } catch (e) {
    // storage penuh: abaikan
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("syk-reviews-update"));
}

function setCache(data) {
  cache = data || {};
  writeLocal(cache);
  emit();
}

export function readAllReviews() {
  if (typeof window === "undefined") return {};
  if (!cache) cache = readLocal();
  return cache;
}

// Tarik ulasan terbaru dari server.
export async function refreshReviews() {
  if (typeof window === "undefined") return {};
  try {
    const res = await fetch("/api/reviews", { cache: "no-store" });
    if (!res.ok) return readAllReviews();
    const json = await res.json().catch(() => null);
    if (json && json.data) setCache(json.data);
    return readAllReviews();
  } catch (e) {
    return readAllReviews();
  }
}

// Sinkron berkala biar terasa realtime. Balikin fungsi buat stop.
export function startReviewsSync(ms) {
  if (typeof window === "undefined") return () => {};
  refreshReviews();
  const iv = setInterval(refreshReviews, ms || 8000);
  const onVis = () => {
    if (document.visibilityState === "visible") refreshReviews();
  };
  document.addEventListener("visibilitychange", onVis);
  return () => {
    clearInterval(iv);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function getReviews(productId) {
  const all = readAllReviews();
  return all[productId] || [];
}

// Kirim ulasan: tampil langsung (optimistis) + simpan ke server.
export function addReview(productId, review) {
  if (typeof window === "undefined" || !productId) {
    return Promise.resolve({ error: "Gagal kirim ulasan." });
  }
  const r = review || {};
  const all = Object.assign({}, readAllReviews());
  all[productId] = [r].concat(all[productId] || []);
  setCache(all);

  return fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      stars: r.stars,
      text: r.text,
    }),
  })
    .then((res) => res.json().catch(() => ({})))
    .then((out) => {
      refreshReviews();
      return out && out.ok ? { ok: true } : { error: (out && out.error) || "" };
    })
    .catch(() => {
      refreshReviews();
      return { error: "Gagal kirim ulasan." };
    });
}

export function getRating(productId) {
  const list = getReviews(productId);
  if (!list.length) return { avg: 0, count: 0 };
  const sum = list.reduce((a, r) => a + (Number(r.stars) || 0), 0);
  return { avg: sum / list.length, count: list.length };
}

export function hasReviewed(productId, email) {
  if (!email) return false;
  return getReviews(productId).some((r) => r.email === email);
}

// Jumlah ulasan yang pernah ditulis 1 user (semua produk).
export function getReviewCountByEmail(email) {
  if (!email) return 0;
  const all = readAllReviews();
  let n = 0;
  Object.values(all).forEach((list) => {
    (list || []).forEach((r) => {
      if (r.email === email) n += 1;
    });
  });
  return n;
}
