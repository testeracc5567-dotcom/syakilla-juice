// API produk per-id (khusus admin).
// PATCH = edit produk. DELETE = hapus produk.
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

export async function PATCH(req, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  try {
    const id = params.id;
    const body = await req.json();
    const data = normalizeProduct(body, {
      id,
      updatedAt: Date.now(),
    });
    const err = validateProduct(data);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const adb = getAdminDb();
    await adb.collection("products").doc(id).set(data, { merge: true });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal mengubah produk." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  try {
    const id = params.id;
    const adb = getAdminDb();
    await adb.collection("products").doc(id).delete();
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal menghapus produk." },
      { status: 500 },
    );
  }
}