// Voucher milik pembeli (hasil tukar poin). Datanya dari server.
let state = { claims: [], earned: 0, spent: 0, points: 0, loaded: false };
let timer = null;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("syk-vou-update"));
  }
}

export function getVoucherState() {
  return state;
}

// Voucher yang masih aktif (belum hangus).
export function myVouchers() {
  return state.claims.filter(function (c) {
    return !c.used;
  });
}

export async function refreshVouchers() {
  try {
    const res = await fetch("/api/vouchers", { cache: "no-store" });
    const data = await res.json();
    state = {
      claims: Array.isArray(data.claims) ? data.claims : [],
      earned: Number(data.earned) || 0,
      spent: Number(data.spent) || 0,
      points: Number(data.points) || 0,
      loaded: true,
    };
    emit();
  } catch (e) {}
  return state;
}

export function startVouchersSync(ms) {
  if (typeof window === "undefined" || timer) return;
  refreshVouchers();
  timer = setInterval(refreshVouchers, ms || 10000);
}

export async function redeemVoucher(code) {
  const res = await fetch("/api/vouchers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Gagal nukar poin.");
  await refreshVouchers();
  return data;
}

export async function useVoucher(id, orderId) {
  const res = await fetch("/api/vouchers", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id, orderId: orderId || "" }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Gagal pakai voucher.");
  await refreshVouchers();
  return data;
}