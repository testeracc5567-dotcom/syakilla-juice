// Penyimpanan akun user di SERVER (file JSON, bukan localStorage lagi).
// PENTING: file ini cuma boleh diimport dari kode server (API routes / lib/auth.js),
// jangan diimport dari komponen client ("use client") karena pakai modul "fs".
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), ".server-data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Bikin akun admin bawaan kalau file user belum ada sama sekali.
function seedIfEmpty() {
  ensureDir();
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
}

export function readUsers() {
  seedIfEmpty();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
  } catch (e) {
    return [];
  }
}

export function writeUsers(list) {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2));
}

export function findUserByEmail(email) {
  const e = String(email || "")
    .toLowerCase()
    .trim();
  if (!e) return null;
  return readUsers().find((u) => u.email.toLowerCase() === e) || null;
}

export function createUser({ name, email, password, role, provider, photo }) {
  const users = readUsers();
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
  users.push(user);
  writeUsers(users);
  return user;
}

export function updateUser(email, patch) {
  const users = readUsers();
  const e = String(email || "")
    .toLowerCase()
    .trim();
  const idx = users.findIndex((u) => u.email.toLowerCase() === e);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  writeUsers(users);
  return users[idx];
}

export function verifyPassword(user, password) {
  if (!user || !user.passwordHash) return false;
  return bcrypt.compareSync(String(password || ""), user.passwordHash);
}