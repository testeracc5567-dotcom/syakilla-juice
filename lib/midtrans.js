// Helper Midtrans Snap (SERVER ONLY - jangan diimport dari komponen client).
import crypto from "crypto";

export function serverKey() {
  return String(process.env.MIDTRANS_SERVER_KEY || "").trim();
}

export function isSandbox() {
  return serverKey().toUpperCase().startsWith("SB-");
}

export function snapApiUrl() {
  return isSandbox()
    ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
    : "https://app.midtrans.com/snap/v1/transactions";
}

export function authHeader() {
  return "Basic " + Buffer.from(serverKey() + ":").toString("base64");
}

// signature_key = sha512(order_id + status_code + gross_amount + serverKey)
export function verifySignature(body) {
  const key = serverKey();
  if (!key) return false;
  const raw =
    String(body.order_id || "") +
    String(body.status_code || "") +
    String(body.gross_amount || "") +
    key;
  const hash = crypto.createHash("sha512").update(raw).digest("hex");
  return hash === String(body.signature_key || "");
}

export function statusFromMidtrans(body) {
  const t = String(body.transaction_status || "").toLowerCase();
  const fraud = String(body.fraud_status || "").toLowerCase();
  if (t === "capture") {
    if (fraud === "challenge") return "Menunggu Konfirmasi";
    return "Dibayar";
  }
  if (t === "settlement") return "Dibayar";
  if (t === "pending") return "Menunggu Konfirmasi";
  if (t === "deny") return "Dibatalkan (Pembayaran Ditolak)";
  if (t === "cancel") return "Dibatalkan (Pembayaran Dibatalkan)";
  if (t === "expire") return "Dibatalkan (Waktu Bayar Habis)";
  if (t === "refund" || t === "partial_refund") return "Dibatalkan (Refund)";
  return "";
}

export function baseOrderId(midtransOrderId) {
  return String(midtransOrderId || "").split("-")[0];
}
