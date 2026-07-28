// API tukar poin -> voucher. Semua dicatat di Firestore biar poin beneran
// berkurang dan voucher yang udah dipakai HANGUS.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { POINT_VOUCHERS } from "@/lib/vouchers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COL = "voucher_claims";

async function emailOf() {
  try {
    const s = await getServerSession(authOptions);
    return s && s.user && s.user.email ? String(s.user.email) : null;
  } catch (e) {
    return null;
  }
}

// Poin yang didapat = total belanja / 1.000 (sama kayak di dashboard).
async function earnedPoints(adb, email) {
  let spend = 0;
  const snap = await adb.collection("orders").where("roomId", "==", email).get();
  snap.docs.forEach(function (d) {
    const v = d.data() || {};
    const o = v.order || {};
    spend += Number(o.total) || 0;
  });
  return Math.floor(spend / 1000);
}

function toClaim(d) {
  const v = d.data() || {};
  return {
    id: d.id,
    code: v.code,
    label: v.label,
    cost: Number(v.cost) || 0,
    used: !!v.used,
    ts: Number(v.ts) || 0,
    usedTs: Number(v.usedTs) || 0,
    orderId: v.orderId || "",
  };
}

async function spentOf(adb, email) {
  const snap = await adb.collection(COL).where("email", "==", email).get();
  const claims = snap.docs.map(toClaim);
  const spent = claims.reduce(function (s, c) {
    return s + c.cost;
  }, 0);
  return { claims: claims, spent: spent };
}

export async function GET() {
  try {
    const email = await emailOf();
    if (!email) {
      return NextResponse.json({ claims: [], earned: 0, spent: 0, points: 0 });
    }
    const adb = getAdminDb();
    const info = await spentOf(adb, email);
    const earned = await earnedPoints(adb, email);
    const claims = info.claims.sort(function (a, b) {
      return b.ts - a.ts;
    });
    return NextResponse.json({
      claims: claims,
      earned: earned,
      spent: info.spent,
      points: Math.max(0, earned - info.spent),
    });
  } catch (e) {
    return NextResponse.json({ claims: [], earned: 0, spent: 0, points: 0, error: e.message });
  }
}

// Tukar poin jadi voucher.
export async function POST(req) {
  try {
    const email = await emailOf();
    if (!email) {
      return NextResponse.json({ error: "Masuk dulu buat nukar poin." }, { status: 401 });
    }
    const body = await req.json();
    const code = String(body.code || "").toUpperCase();
    const v = POINT_VOUCHERS.find(function (x) {
      return x.code === code;
    });
    if (!v) return NextResponse.json({ error: "Voucher tidak ditemukan." }, { status: 400 });

    const adb = getAdminDb();
    const info = await spentOf(adb, email);
    const earned = await earnedPoints(adb, email);
    const sisa = earned - info.spent;
    if (sisa < v.cost) {
      return NextResponse.json(
        { error: "Poin kamu kurang. Butuh " + v.cost + " poin, punyamu " + sisa + "." },
        { status: 400 },
      );
    }

    const ts = Date.now();
    const id = String(email).replace(/\//g, "_") + "__" + code + "__" + ts;
    await adb.collection(COL).doc(id).set({
      email: email,
      code: code,
      label: v.label,
      cost: v.cost,
      used: false,
      ts: ts,
      usedTs: 0,
      orderId: "",
    });

    return NextResponse.json({ ok: true, points: sisa - v.cost });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal nukar poin." }, { status: 500 });
  }
}

// Tandai voucher udah dipakai -> HANGUS.
export async function PATCH(req) {
  try {
    const email = await emailOf();
    if (!email) return NextResponse.json({ error: "Masuk dulu." }, { status: 401 });
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Voucher tidak valid." }, { status: 400 });

    const adb = getAdminDb();
    const ref = adb.collection(COL).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: "Voucher tidak ada." }, { status: 404 });

    const v = doc.data() || {};
    if (v.email !== email) return NextResponse.json({ error: "Bukan voucher kamu." }, { status: 403 });
    if (v.used) return NextResponse.json({ error: "Voucher ini udah hangus." }, { status: 409 });

    await ref.update({ used: true, usedTs: Date.now(), orderId: String(body.orderId || "") });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal pakai voucher." }, { status: 500 });
  }
}