// Seed produk awal ke Firestore dari data bawaan (SITE.products).
// Cuma jalan kalau koleksi masih kosong, biar nggak nimpa data yang udah ada.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { defaultProducts } from "@/lib/productModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session && session.user && session.user.isAdmin ? session : null;
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
  try {
    const adb = getAdminDb();
    const col = adb.collection("products");
    const existing = await col.limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({
        ok: true,
        seeded: 0,
        message: "Data produk sudah ada, seed dilewati.",
      });
    }
    const now = Date.now();
    const list = defaultProducts();
    const batch = adb.batch();
    list.forEach((p) => {
      const ref = col.doc(p.id);
      batch.set(ref, Object.assign({}, p, { createdAt: now, updatedAt: now }));
    });
    await batch.commit();
    return NextResponse.json({ ok: true, seeded: list.length });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Gagal seed produk." },
      { status: 500 },
    );
  }
}