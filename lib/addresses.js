// Buku alamat pembeli. Struktur: { [ownerId]: [{ id, label, name, phone, address, primary }] }
const ADDR_KEY = "syk_addr_v1";

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ADDR_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function writeAll(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADDR_KEY, JSON.stringify(data || {}));
  window.dispatchEvent(new Event("syk-addr-update"));
}

export function getAddresses(owner) {
  if (!owner) return [];
  const list = readAll()[owner] || [];
  return list.slice().sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));
}

export function getPrimaryAddress(owner) {
  const list = getAddresses(owner);
  return list.find((a) => a.primary) || list[0] || null;
}

export function saveAddress(owner, addr) {
  if (!owner || !addr) return null;
  const all = readAll();
  const list = (all[owner] || []).slice();
  const id = addr.id || "ad_" + Date.now().toString(36);
  const item = {
    id,
    label: String(addr.label || "").trim() || "Alamat",
    name: String(addr.name || "").trim(),
    phone: String(addr.phone || "").trim(),
    address: String(addr.address || "").trim(),
    primary: !!addr.primary,
  };
  const idx = list.findIndex((a) => a.id === id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  if (list.length === 1) list[0].primary = true;
  if (item.primary) {
    list.forEach((a) => {
      a.primary = a.id === id;
    });
  }
  all[owner] = list;
  writeAll(all);
  return item;
}

export function removeAddress(owner, id) {
  if (!owner || !id) return;
  const all = readAll();
  let list = (all[owner] || []).filter((a) => a.id !== id);
  if (list.length && !list.some((a) => a.primary)) list[0].primary = true;
  all[owner] = list;
  writeAll(all);
}

export function setPrimaryAddress(owner, id) {
  if (!owner || !id) return;
  const all = readAll();
  const list = (all[owner] || []).map((a) =>
    Object.assign({}, a, { primary: a.id === id }),
  );
  all[owner] = list;
  writeAll(all);
}
