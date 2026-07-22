// Penyimpanan akun user di SERVER (file JSON, bukan localStorage lagi).
// PENTING: file ini cuma boleh diimport dari kode server (API routes / lib/auth.js),
// jangan diimport dari komponen client ("use client") karena pakai modul "fs".
//
// CATATAN buat hosting serverless (Vercel dkk): filesystem di server serverless
// itu read-only / sementara, jadi tulis-baca file ini BISA GAGAL atau datanya
// bisa hilang antar request. Semua fungsi di sini dibuat "aman" (gak nge-crash
// kalau gagal), tapi ini bukan solusi permanen untuk data pembeli yang daftar
// online. Login Admin TIDAK bergantung pada file ini (lihat lib/auth.js).
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), ".server-data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    return true;
  } catch (e) {
    return false;
  }
}

// Bikin akun admin bawaan kalau file user belum ada sama sekali.
function seedIfEmpty() {
  if (!ensureDir()) return;
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const admin = {
        email: "admin@syakilla.id",
        name: "Administrator",
        passwordHash: bcrypt.hashSync("admin123", 10),
        role: "admin",
        provider: "credentials",
        photo: "",
        phone: "",
        addresses: [],
        selectedAddressId: null,
        createdAt: Date.now(),
      };
      fs.writeFileSync(USERS_FILE, JSON.stringify([admin], null, 2));
    }
  } catch (e) {
    // Filesystem read-only (misal di serverless hosting) - lewati aja, gak crash.
  }
}

export function readUsers() {
  try {
    seedIfEmpty();
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
  } catch (e) {
    return [];
  }
}

export function writeUsers(list) {
  try {
    if (!ensureDir()) return false;
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

export function findUserByEmail(email) {
  const e = String(email || "")
    .toLowerCase()
    .trim();
  if (!e) return null;
  try {
    return readUsers().find((u) => u.email.toLowerCase() === e) || null;
  } catch (e2) {
    return null;
  }
}

export function createUser({ name, email, password, role, provider, photo }) {
  const e = String(email || "")
    .toLowerCase()
    .trim();
  const user = {
    email: e,
    name: name || "",
    passwordHash: password ? bcrypt.hashSync(password, 10) : null,
    role: role || "buyer",
    provider: provider || "credentials",
    photo: photo || "",
    phone: "",
    addresses: [],
    selectedAddressId: null,
    createdAt: Date.now(),
  };
  try {
    const users = readUsers();
    users.push(user);
    writeUsers(users);
  } catch (e2) {
    // Gagal simpen permanen (misal serverless read-only fs). User tetap
    // dikembalikan supaya sesi login saat ini masih bisa jalan.
  }
  return user;
}

export function updateUser(email, patch) {
  try {
    const users = readUsers();
    const e = String(email || "")
      .toLowerCase()
      .trim();
    const idx = users.findIndex((u) => u.email.toLowerCase() === e);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...patch };
    writeUsers(users);
    return users[idx];
  } catch (e) {
    return null;
  }
}

export function verifyPassword(user, password) {
  if (!user || !user.passwordHash) return false;
  try {
    return bcrypt.compareSync(String(password || ""), user.passwordHash);
  } catch (e) {
    return false;
  }
}