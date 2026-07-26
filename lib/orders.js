// Riwayat pesanan. Sumber utamanya SERVER (Firestore lewat /api/orders) biar
// pesanan pembeli langsung kelihatan di akun admin, walau beda browser/HP.
// localStorage cuma cache biar UI nggak kedip.
const ORDERS_KEY = "syk_orders_v1";

let cache = null;

function readLocal() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function writeLocal(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(data || {}));
  } catch (e) {}
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("syk-orders-update"));
}

function setCache(data) {
  cache = data || {};
  writeLocal(cache);
  emit();
}

export function readOrders() {
  if (typeof window === "undefined") return {};
  if (!cache) cache = readLocal();
  return cache;
}

export async function refreshOrders(roomId) {
  if (typeof window === "undefined") return {};
  try {
    const url = roomId
      ? "/api/orders?room=" + encodeURIComponent(roomId)
      : "/api/orders";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return readOrders();
    const json = await res.json().catch(() => null);
    if (json && json.data) setCache(json.data);
    return readOrders();
  } catch (e) {
    return readOrders();
  }
}

export function startOrdersSync(roomId, ms) {
  if (typeof window === "undefined") return () => {};
  refreshOrders(roomId);
  const iv = setInterval(() => refreshOrders(roomId), ms || 6000);
  const onVis = () => {
    if (document.visibilityState === "visible") refreshOrders(roomId);
  };
  document.addEventListener("visibilitychange", onVis);
  return () => {
    clearInterval(iv);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function saveOrder(roomId, payload) {
  if (typeof window === "undefined" || !roomId) return;
  const opts = payload || {};
  const order = opts.order || {};
  const customer = opts.customer || {};

  const all = Object.assign({}, readOrders());
  const bucket = all[roomId] || { customer: {}, orders: [] };
  all[roomId] = {
    customer: Object.assign({}, bucket.customer, customer),
    orders: [order].concat(bucket.orders || []),
  };
  setCache(all);

  fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, customer, order }),
  })
    .then(() => refreshOrders(roomId))
    .catch(() => {});
}

export function getCustomerOrders(roomId) {
  if (!roomId) return { customer: {}, orders: [] };
  const all = readOrders();
  return all[roomId] || { customer: {}, orders: [] };
}

export function isOrderDone(status) {
  const s = String(status || "").toLowerCase();
  return s.includes("selesai") || s.includes("berhasil");
}

export function updateOrderStatus(roomId, orderId, status) {
  if (typeof window === "undefined" || !roomId) return;
  const all = Object.assign({}, readOrders());
  const bucket = all[roomId];
  if (bucket) {
    all[roomId] = Object.assign({}, bucket, {
      orders: (bucket.orders || []).map((o) =>
        o.id === orderId ? Object.assign({}, o, { status }) : o,
      ),
    });
    setCache(all);
  }
  fetch("/api/orders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, orderId, status }),
  })
    .then(() => refreshOrders())
    .catch(() => {});
}

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

export function isOrderCancelled(status) {
  return String(status || "")
    .toLowerCase()
    .includes("batal");
}

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
