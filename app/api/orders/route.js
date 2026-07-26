// API pesanan (server, Firestore) - biar pesanan pembeli MASUK ke admin
// walaupun beda browser / beda HP. Admin baca semua, pembeli baca punya sendiri.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COL = "orders";

function bucketize(docs) {
  const data = {};
  docs.forEach((d) => {
    const v = d.data() || {};
    const roomId = v.roomId || "tamu";
    if (!data[roomId]) data[roomId] = { customer: {}, orders: [] };
    data[roomId].customer = Object.assign(
      {},
      data[roomId].customer,
      v.customer || {},
    );
    if (v.order) data[roomId].orders.push(v.order);
  });
  Object.keys(data).forEach((k) => {
    data[k].orders.sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0));
  });
  return data;
}

async function getSessionInfo() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = !!(session && session.user && session.user.isAdmin);
    const email =
      session && session.user && session.user.email
        ? session.user.email
        : null;
    return { isAdmin, email };
  } catch (e) {
    return { isAdmin: false, email: null };
  }
}

export async function GET(req) {
  try {
    const { isAdmin, email } = await getSessionInfo();
    const room = new URL(req.url).searchParams.get("room");
    const adb = getAdminDb();
    let snap;
    if (isAdmin) {
      snap = await adb.collection(COL).get();
    } else {
      const rid = email || room;
      if (!rid) return NextResponse.json({ data: {} });
      snap = await adb.collection(COL).where("roomId", "==", rid).get();
    }
    return NextResponse.json({ data: bucketize(snap.docs) });
  } catch (e) {
    return NextResponse.json({ data: {}, error: e.message || "Gagal baca." });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = await getSessionInfo();
    const order = body.order || {};
    const roomId = String(email || body.roomId || "").trim();
    if (!roomId) {
      return NextResponse.json({ error: "Room tidak valid." }, { status: 400 });
    }
    if (!order.id) {
      return NextResponse.json({ error: "Pesanan tidak valid." }, { status: 400 });
    }
    const adb = getAdminDb();
    await adb
      .collection(COL)
      .doc(String(order.id))
      .set({
        roomId,
        customer: body.customer || {},
        order: Object.assign({}, order, {
          status: order.status || "Diproses",
        }),
        ts: Number(order.ts) || Date.now(),
      });
    return NextResponse.json({ ok: true, id: order.id });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal simpan pesanan." },
      { status: 500 },
    );
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { isAdmin, email } = await getSessionInfo();
    const orderId = String(body.orderId || "").trim();
    const status = String(body.status || "").trim();
    if (!orderId || !status) {
      return NextResponse.json({ error: "Data kurang." }, { status: 400 });
    }
    const adb = getAdminDb();
    const ref = adb.collection(COL).doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }
    const owner = (doc.data() || {}).roomId;
    const mine = owner && (owner === email || owner === body.roomId);
    if (!isAdmin && !mine) {
      return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
    }
    await ref.update({ "order.status": status });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal ubah status." },
      { status: 500 },
    );
  }
}
