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
// ===== Status pesanan resmi + urutan alur (dipakai admin di Riwayat Pesanan) =====
export const ORDER_STATUS = {
  DIBAYAR: "Dibayar",
  DIPROSES: "Sedang Diproses",
  DIANTAR: "Sedang Diantar",
  SELESAI: "Pesanan Selesai",
  DIBATALKAN: "Dibatalkan oleh Penjual",
};

// Urutan tombol maju status buat admin
export const ORDER_STATUS_FLOW = [
  ORDER_STATUS.DIBAYAR,
  ORDER_STATUS.DIPROSES,
  ORDER_STATUS.DIANTAR,
  ORDER_STATUS.SELESAI,
];

// Warna badge status (buat tampilan)
export function statusColor(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("batal")) return "#dc2626";      // merah
  if (s.includes("selesai")) return "#16a34a";    // hijau
  if (s.includes("diantar")) return "#2563eb";    // biru
  if (s.includes("proses")) return "#d97706";     // oranye
  return "#6b7280";                                // abu (Dibayar)
}

// Status berikutnya dalam alur (buat tombol "Proses ke tahap berikutnya")
export function nextStatus(status) {
  const i = ORDER_STATUS_FLOW.indexOf(status);
  if (i === -1 || i >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[i + 1];
}
// ===== Member Loyalty (dihitung dari pesanan yang sudah Selesai) =====
export function loyaltyLevel(points) {
  if (points >= 500) return "Gold";
  if (points >= 200) return "Silver";
  if (points >= 50) return "Bronze";
  return "Member Baru";
}

// Daftar member + poin. 1 poin per Rp1.000 dari pesanan berstatus Selesai.
export function getLoyaltyMembers() {
  const all = readOrders();
  const members = [];
  Object.keys(all).forEach((roomId) => {
    const bucket = all[roomId] || {};
    const orders = bucket.orders || [];
    let spent = 0, completed = 0;
    orders.forEach((o) => {
      if (!isOrderDone(o.status)) return;
      completed += 1;
      spent += Number(o.total) ||
        (o.items || []).reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
    });
    const points = Math.floor(spent / 1000);
    members.push({
      roomId,
      name: bucket.customer?.name || roomId,
      phone: bucket.customer?.phone || "",
      totalOrders: orders.length,
      completedOrders: completed,
      spent,
      points,
      level: loyaltyLevel(points),
    });
  });
  members.sort((a, b) => b.points - a.points);
  return members;
}