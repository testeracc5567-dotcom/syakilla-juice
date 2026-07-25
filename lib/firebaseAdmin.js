// Firebase Admin (server only) — dipakai di API route buat tulis produk.
// Service account di-encode base64 dan disimpan di env FIREBASE_SERVICE_ACCOUNT_B64.
// SDK admin bypass Firestore rules, jadi tulis produk aman dan cuma lewat API admin.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) return null;
  try {
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

let adminDb = null;

export function getAdminDb() {
  if (adminDb) return adminDb;
  const sa = loadServiceAccount();
  if (!sa) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_B64 belum di-set atau formatnya salah.",
    );
  }
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(sa) });
  adminDb = getFirestore(app);
  return adminDb;
}