import SITE from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Khusus admin." }, { status: 403 });

  const rows = (SITE.products || []).map((p, i) => ({
    id: p.id,
    name: p.name,
    cat: p.cat,
    img: p.img || "",
    price: Number(p.price) || 0,
    desc: p.desc || "",
    tag: p.tag || "",
    stars: Number(p.stars) || 5,
    featured: !!p.featured,
    sort_order: i,
  }));

  const { error } = await supabaseAdmin.from("products").upsert(rows, { onConflict: "id" });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, count: rows.length });
}