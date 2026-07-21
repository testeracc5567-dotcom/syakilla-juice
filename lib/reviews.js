// Penyimpanan ulasan produk (localStorage).
// Struktur: { [productId]: [{ id, name, email, stars, text, ts }] }
const REVIEWS_KEY = "syk_reviews_v1";

export function readAllReviews() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

export function getReviews(productId) {
  const all = readAllReviews();
  return all[productId] || [];
}

export function addReview(productId, review) {
  if (typeof window === "undefined" || !productId) return;
  const all = readAllReviews();
  all[productId] = [review, ...(all[productId] || [])];
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("syk-reviews-update"));
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