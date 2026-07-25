import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

// GET semua produk (publik — dipakai storefront & admin)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ products: data || [] });
}

// POST tambah produk (admin only)
export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Khusus admin." }, { status: 403 });

  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Data tidak valid." }, { status: 400 }); }

  const row = {
    id: String(b.id || "").trim() || "prod_" + Math.random().toString(36).slice(2, 9),
    name: b.name || "",
    cat: b.cat || "",
    img: b.img || "",
    price: Number(b.price) || 0,
    desc: b.desc || "",
    tag: b.tag || "",
    stars: Number(b.stars) || 5,
    featured: !!b.featured,
    sort_order: Number(b.sort_order) || 0,
  };
  const { error } = await supabaseAdmin.from("products").insert(row);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, product: row });
}