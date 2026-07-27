// Bikin token pembayaran Snap buat 1 pesanan.
// Nominal diambil dari Firestore (bukan dari browser) biar gak bisa diakalin.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { authHeader, serverKey, snapApiUrl } from "@/lib/midtrans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    if (!serverKey()) {
      return NextResponse.json(
        { error: "MIDTRANS_SERVER_KEY belum di-set." },
        { status: 500 },
      );
    }
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "Pesanan tidak valid." }, {
        status: 400,
      });
    }

    let email = null;
    let isAdmin = false;
    try {
      const session = await getServerSession(authOptions);
      email = session && session.user ? session.user.email : null;
      isAdmin = !!(session && session.user && session.user.isAdmin);
    } catch (e) {
      email = null;
    }

    const adb = getAdminDb();
    const ref = adb.collection("orders").doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }
    const data = doc.data() || {};
    const owner = data.roomId;
    const mine = owner && (owner === email || owner === body.roomId);
    if (!isAdmin && !mine) {
      return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
    }

    const order = data.order || {};
    const status = String(order.status || "").toLowerCase();
    if (status.includes("batal")) {
      return NextResponse.json(
        { error: "Pesanan ini sudah dibatalkan." },
        { status: 400 },
      );
    }
    const gross = Math.round(Number(order.total) || 0);
    if (gross <= 0) {
      return NextResponse.json(
        { error: "Total pesanan tidak valid." },
        { status: 400 },
      );
    }

    const cust = data.customer || {};
    const nama = String(cust.name || order.name || "Pembeli").trim();
    const payload = {
      transaction_details: {
        order_id: orderId + "-" + Date.now().toString(36),
        gross_amount: gross,
      },
      customer_details: {
        first_name: nama.slice(0, 40) || "Pembeli",
        email: String(cust.email || email || "").slice(0, 45) || undefined,
        phone: String(cust.phone || order.phone || "").slice(0, 19) || undefined,
      },
      expiry: { unit: "minute", duration: 20 },
      credit_card: { secure: true },
    };

    const res = await fetch(snapApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.token) {
      const msg =
        (out.error_messages && out.error_messages.join(", ")) ||
        out.status_message ||
        "Midtrans menolak permintaan.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      token: out.token,
      redirect_url: out.redirect_url || "",
      clientKey: String(process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal buka pembayaran." },
      { status: 500 },
    );
  }
}
