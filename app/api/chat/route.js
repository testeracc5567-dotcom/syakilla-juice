// API chat (server, Firestore) - biar chat pembeli MASUK ke admin walau beda
// browser/HP. Pesan disimpan di koleksi chat_messages, status online di
// chat_presence.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MSG = "chat_messages";
const PRES = "chat_presence";
const LIMIT = 800;

async function sessionInfo() {
  try {
    const s = await getServerSession(authOptions);
    return {
      isAdmin: !!(s && s.user && s.user.isAdmin),
      email: s && s.user && s.user.email ? s.user.email : null,
      name: s && s.user && s.user.name ? s.user.name : null,
    };
  } catch (e) {
    return { isAdmin: false, email: null, name: null };
  }
}

function safeId(id) {
  return String(id || "").replace(/\//g, "_");
}

async function touchPresence(adb, id) {
  if (!id) return;
  try {
    await adb.collection(PRES).doc(safeId(id)).set({ id: String(id), ts: Date.now() });
  } catch (e) {}
}

async function readPresence(adb) {
  const out = {};
  try {
    const snap = await adb.collection(PRES).get();
    snap.docs.forEach((d) => {
      const v = d.data() || {};
      if (v.id) out[v.id] = Number(v.ts) || 0;
    });
  } catch (e) {}
  return out;
}

function toMsg(d) {
  const v = d.data() || {};
  return {
    id: d.id,
    roomId: v.roomId,
    buyerName: v.buyerName || "Pembeli",
    from: v.from === "admin" ? "admin" : "buyer",
    text: String(v.text || ""),
    ts: Number(v.ts) || 0,
  };
}

export async function GET(req) {
  try {
    const { isAdmin, email } = await sessionInfo();
    const params = new URL(req.url).searchParams;
    const room = params.get("room");
    const adb = getAdminDb();

    await touchPresence(adb, isAdmin ? "admin" : email || room);
    const presence = await readPresence(adb);

    if (isAdmin) {
      const snap = await adb.collection(MSG).limit(LIMIT).get();
      const byRoom = {};
      snap.docs.map(toMsg).forEach((m) => {
        if (!m.roomId) return;
        if (!byRoom[m.roomId]) {
          byRoom[m.roomId] = { id: m.roomId, buyerName: m.buyerName, messages: [] };
        }
        if (m.from === "buyer" && m.buyerName) byRoom[m.roomId].buyerName = m.buyerName;
        byRoom[m.roomId].messages.push(m);
      });
      const rooms = Object.values(byRoom).map((r) => {
        r.messages.sort((a, b) => a.ts - b.ts);
        r.last = r.messages[r.messages.length - 1] || null;
        return r;
      });
      rooms.sort((a, b) => (b.last ? b.last.ts : 0) - (a.last ? a.last.ts : 0));
      return NextResponse.json({ rooms, presence });
    }

    const rid = email || room;
    if (!rid) return NextResponse.json({ messages: [], presence });
    const snap = await adb.collection(MSG).where("roomId", "==", rid).limit(LIMIT).get();
    const messages = snap.docs.map(toMsg).sort((a, b) => a.ts - b.ts);
    return NextResponse.json({ messages, presence });
  } catch (e) {
    return NextResponse.json({
      rooms: [],
      messages: [],
      presence: {},
      error: e.message || "Gagal baca chat.",
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { isAdmin, email, name } = await sessionInfo();
    const text = String(body.text || "").trim();
    const roomId = String(isAdmin ? body.roomId || "" : email || body.roomId || "").trim();
    if (!roomId) return NextResponse.json({ error: "Room tidak valid." }, { status: 400 });
    if (!text) return NextResponse.json({ error: "Pesan kosong." }, { status: 400 });

    const adb = getAdminDb();
    const ts = Date.now();
    await adb.collection(MSG).add({
      roomId,
      buyerName: isAdmin ? body.buyerName || "Pembeli" : name || body.buyerName || "Tamu",
      from: isAdmin ? "admin" : "buyer",
      text,
      ts,
    });
    await touchPresence(adb, isAdmin ? "admin" : roomId);
    return NextResponse.json({ ok: true, ts });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal kirim pesan." }, { status: 500 });
  }
}
