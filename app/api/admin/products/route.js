// API produk (khusus admin buat tulis).
// POST = tambah produk baru. Cuma bisa diakses admin (dicek lewat sesi NextAuth).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeProduct, validateProduct } from "@/lib/productModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session && session.user && session.user.isAdmin ? session : null;
}

export async function POST(req) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const now = Date.now();
    const id =
      (typeof body.id === "string" && body.id.trim()) ||
      "p_" + now.toString(36);
    const data = normalizeProduct(body, {
      id,
      createdAt: now,
      updatedAt: now,
    });
    const err = validateProduct(data);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const adb = getAdminDb();
    await adb.collection("products").doc(id).set(data);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal menyimpan produk." },
      { status: 500 },
    );
  }
}