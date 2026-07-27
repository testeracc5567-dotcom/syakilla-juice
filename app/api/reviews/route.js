// API ulasan produk (server, Firestore) biar rating kelihatan di semua HP/browser.
// Doc id = productId + "__" + email + "__" + orderId, jadi 1 ulasan per PESANAN.
// Beli produk yang sama 2x = dua-duanya bisa diulas.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COL = "reviews";

function safeId(productId, email, orderId) {
  return (
    String(productId).replace(/[^a-zA-Z0-9_-]/g, "_") +
    "__" +
    String(email)
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "_") +
    "__" +
    String(orderId || "lama").replace(/[^a-zA-Z0-9_-]/g, "_")
  );
}

// GET: semua ulasan, dikelompokin per produk.
export async function GET() {
  try {
    const adb = getAdminDb();
    const snap = await adb.collection(COL).get();
    const data = {};
    snap.docs.forEach((d) => {
      const v = d.data() || {};
      const pid = String(v.productId || "");
      if (!pid) return;
      if (!data[pid]) data[pid] = [];
      data[pid].push({
        id: d.id,
        name: v.name || "Pembeli",
        email: v.email || "",
        stars: Number(v.stars) || 0,
        text: v.text || "",
        ts: Number(v.ts) || 0,
        orderId: v.orderId || "",
      });
    });
    Object.keys(data).forEach((k) => {
      data[k].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ data: {}, error: e.message || "Gagal baca." });
  }
}

// POST: kirim ulasan. Harus login dan harus pernah beli produknya.
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const email =
      session && session.user && session.user.email ? session.user.email : "";
    const nama =
      session && session.user && session.user.name
        ? session.user.name
        : "Pembeli";
    if (!email) {
      return NextResponse.json(
        { error: "Masuk dulu buat kasih ulasan." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const productId = String(body.productId || "").trim();
    const stars = Math.min(5, Math.max(1, Number(body.stars) || 0));
    const text = String(body.text || "").trim().slice(0, 1000);
    const orderId = String(body.orderId || "").trim();
    if (!productId || !stars || !text) {
      return NextResponse.json({ error: "Data ulasan kurang." }, {
        status: 400,
      });
    }

    const adb = getAdminDb();

    // Cek pembeli beneran pernah beli produk ini (dicek per pesanan).
    let bought = false;
    if (orderId) {
      const od = await adb.collection("orders").doc(orderId).get();
      if (od.exists) {
        const v = od.data() || {};
        const o = v.order || {};
        const st = String(o.status || "").toLowerCase();
        if (String(v.roomId || "") === email && !st.includes("batal")) {
          bought = (o.items || []).some(
            (it) => String(it.id) === productId,
          );
        }
      }
    } else {
      const orders = await adb
        .collection("orders")
        .where("roomId", "==", email)
        .get();
      orders.docs.forEach((d) => {
        const o = (d.data() || {}).order || {};
        const st = String(o.status || "").toLowerCase();
        if (st.includes("batal")) return;
        (o.items || []).forEach((it) => {
          if (String(it.id) === productId) bought = true;
        });
      });
    }
    if (!bought) {
      return NextResponse.json(
        { error: "Ulasan cuma buat produk yang pernah kamu beli." },
        { status: 403 },
      );
    }

    const id = safeId(productId, email, orderId);
    const ref = adb.collection(COL).doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "Pesanan ini udah kamu ulas." },
        { status: 409 },
      );
    }

    await ref.set({
      productId,
      email,
      name: nama,
      stars,
      text,
      orderId,
      ts: Date.now(),
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal simpan ulasan." },
      { status: 500 },
    );
  }
}
