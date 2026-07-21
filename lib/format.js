// Helper format angka & bintang. Ambil setting mata uang dari data.js.
import SITE from "./data";

export function money(n) {
  const prefix = SITE.cart.currencyPrefix || "";
  const locale = SITE.cart.currencyLocale || "en-US";
  return prefix + Number(n || 0).toLocaleString(locale);
}

export function starStr(n) {
  const full = Math.max(0, Math.min(5, Number(n) || 0));
  return "\u2605".repeat(full) + "\u2606".repeat(5 - full);
}
