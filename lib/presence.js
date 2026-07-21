// Presence / heartbeat sederhana via localStorage.
// CATATAN: localStorage cuma dibagi antar-tab di browser & device yang sama.
// Jadi status online realtime jalan antar-tab (mis. tab admin + tab pembeli di
// satu komputer), TAPI belum lintas-device (beda hp/laptop) — itu butuh server.
const PRESENCE_KEY = "syk_presence_v1";
export const ONLINE_WINDOW = 20000; // < 20 detik = dianggap online

export function readPresence() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PRESENCE_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

export function setPresence(id) {
  if (typeof window === "undefined" || !id) return;
  const all = readPresence();
  all[id] = Date.now();
  localStorage.setItem(PRESENCE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("syk-presence-update"));
}

export function getLastSeen(id) {
  if (!id) return 0;
  return readPresence()[id] || 0;
}

export function isOnline(id) {
  const ts = getLastSeen(id);
  return !!ts && Date.now() - ts < ONLINE_WINDOW;
}