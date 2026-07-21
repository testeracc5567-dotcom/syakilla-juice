// Penyimpanan riwayat pesanan (localStorage). Dipakai buat panel stalking admin,
// halaman Transaksi, Member Loyalty, dan syarat kasih ulasan.
// Struktur: { [roomId]: { customer: { name, phone, address }, orders: [order] } }
// roomId = email pembeli (kalau login) atau guest id (kalau belum login).
const ORDERS_KEY = "syk_orders_v1";

export function readOrders() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

export function saveOrder(roomId, { customer, order }) {
  if (typeof window === "undefined" || !roomId) return;
  const all = readOrders();
  const bucket = all[roomId] || { customer: {}, orders: [] };
  bucket.customer = { ...bucket.customer, ...(customer || {}) };
  bucket.orders = [order, ...(bucket.orders || [])]; // terbaru di depan
  all[roomId] = bucket;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("syk-orders-update"));
}

export function getCustomerOrders(roomId) {
  if (!roomId) return { customer: {}, orders: [] };
  const all = readOrders();
  return all[roomId] || { customer: {}, orders: [] };
}

// Cek apakah status pesanan sudah "selesai/berhasil".
export function isOrderDone(status) {
  const s = String(status || "").toLowerCase();
  return s.includes("selesai") || s.includes("berhasil");
}

// Admin: ubah status pesanan (mis. jadi "Selesai").
export function updateOrderStatus(roomId, orderId, status) {
  if (typeof window === "undefined" || !roomId) return;
  const all = readOrders();
  const bucket = all[roomId];
  if (!bucket) return;
  bucket.orders = (bucket.orders || []).map((o) =>
    o.id === orderId ? { ...o, status } : o,
  );
  all[roomId] = bucket;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("syk-orders-update"));
}

// Kumpulan id produk yang pernah dibeli user.
// Default: hanya dari pesanan yang statusnya sudah selesai/berhasil.
export function getPurchasedProductIds(roomId, opts) {
  const onlyDone = !opts || opts.onlyDone !== false;
  const { orders } = getCustomerOrders(roomId);
  const ids = new Set();
  (orders || []).forEach((o) => {
    if (onlyDone && !isOrderDone(o.status)) return;
    (o.items || []).forEach((it) => ids.add(it.id));
  });
  return ids;
}

// Total item terjual (dari semua pesanan yang sudah selesai) buat 1 produk.
export function getSoldCount(productId) {
  if (!productId) return 0;
  const all = readOrders();
  let n = 0;
  Object.values(all).forEach((bucket) => {
    (bucket.orders || []).forEach((o) => {
      if (!isOrderDone(o.status)) return;
      (o.items || []).forEach((it) => {
        if (it.id === productId) n += Number(it.qty) || 0;
      });
    });
  });
  return n;
}

// Cek apakah status pesanan "dibatalkan".
export function isOrderCancelled(status) {
  return String(status || "")
    .toLowerCase()
    .includes("batal");
}

// Semua pesanan masuk dari semua pembeli, terbaru duluan. Khusus admin
// (halaman "Pesanan Masuk").
export function getAllIncomingOrders() {
  const all = readOrders();
  const list = [];
  Object.keys(all).forEach((roomId) => {
    const bucket = all[roomId] || {};
    (bucket.orders || []).forEach((o) => {
      list.push({ roomId, customer: bucket.customer || {}, order: o });
    });
  });
  list.sort((a, b) => (b.order.ts || 0) - (a.order.ts || 0));
  return list;
}