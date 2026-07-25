import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

// PUT edit produk (admin only)
export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Khusus admin." }, { status: 403 });

  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Data tidak valid." }, { status: 400 }); }

  const patch = {};
  ["name", "cat", "img", "desc", "tag"].forEach((k) => { if (k in b) patch[k] = b[k]; });
  if ("price" in b) patch.price = Number(b.price) || 0;
  if ("stars" in b) patch.stars = Number(b.stars) || 5;
  if ("featured" in b) patch.featured = !!b.featured;
  if ("sort_order" in b) patch.sort_order = Number(b.sort_order) || 0;

  const { error } = await supabaseAdmin.from("products").update(patch).eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// DELETE hapus produk (admin only)
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Khusus admin." }, { status: 403 });

  const { error } = await supabaseAdmin.from("products").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}