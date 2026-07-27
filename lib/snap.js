// Loader script Snap Midtrans buat sisi browser.
let loading = null;

export function loadSnap(clientKey) {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.snap) return Promise.resolve(window.snap);
  if (!clientKey) return Promise.resolve(null);
  if (loading) return loading;

  const sandbox = String(clientKey).toUpperCase().startsWith("SB-");
  const src = sandbox
    ? "https://app.sandbox.midtrans.com/snap/snap.js"
    : "https://app.midtrans.com/snap/snap.js";

  loading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.setAttribute("data-client-key", clientKey);
    s.async = true;
    s.onload = () => resolve(window.snap || null);
    s.onerror = () => {
      loading = null;
      resolve(null);
    };
    document.body.appendChild(s);
  });
  return loading;
}
