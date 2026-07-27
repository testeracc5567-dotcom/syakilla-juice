// Webhook Midtrans. Signature diverifikasi dulu, jadi gak bisa dipalsuin.
// Set di Midtrans: Settings > Configuration > Payment Notification URL
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  baseOrderId,
  isSandbox,
  serverKey,
  statusFromMidtrans,
  verifySignature,
} from "@/lib/midtrans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    keyTerpasang: !!serverKey(),
    mode: isSandbox() ? "sandbox" : "production",
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!verifySignature(body)) {
      return NextResponse.json(
        { error: "Signature tidak valid." },
        { status: 403 },
      );
    }

    const orderId = baseOrderId(body.order_id);
    const status = statusFromMidtrans(body);
    if (!orderId || !status) {
      return NextResponse.json({ ok: true, skip: true });
    }

    const adb = getAdminDb();
    const ref = adb.collection("orders").doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ ok: true, notFound: true });

    const cur = (doc.data() || {}).order || {};
    const now = String(cur.status || "").toLowerCase();
    const jalan =
      now.includes("diproses") ||
      now.includes("dikirim") ||
      now.includes("selesai");
    if (jalan) return NextResponse.json({ ok: true, kept: true });

    const patch = { "order.status": status };
    if (status === "Dibayar") {
      patch["order.paidAt"] = Date.now();
      patch["order.payChannel"] = String(body.payment_type || "");
      patch["order.payRef"] = String(body.transaction_id || "");
    }
    await ref.update(patch);
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal proses notifikasi." },
      { status: 500 },
    );
  }
}
