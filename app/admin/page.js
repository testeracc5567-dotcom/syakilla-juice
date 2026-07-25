"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import SITE from "@/lib/data";
import {
  getAllIncomingOrders,
  updateOrderStatus,
  getLoyaltyMembers,
  ORDER_STATUS_FLOW,
  statusColor,
  nextStatus,
  isOrderDone,
  isOrderCancelled,
} from "@/lib/orders";

const rupiah = (n) => "Rp " + (Number(n) || 0).toLocaleString("id-ID");
const priceOf = (it) =>
  it.price != null ? Number(it.price)
    : Number((SITE.products.find((p) => p.id === it.id) || {}).price) || 0;
const orderTotal = (o) =>
  o.total != null ? Number(o.total)
    : (o.items || []).reduce((s, it) => s + priceOf(it) * (Number(it.qty) || 1), 0);

const MENU = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "orders", label: "Riwayat Pesanan", icon: "📋" },
  { key: "loyalty", label: "Member Loyalty", icon: "🎁" },
  { key: "products", label: "Kelola Produk", icon: "🛒" },
];
const emptyForm = { id: "", name: "", cat: SITE.categories?.[0] || "", price: "", img: "", desc: "", tag: "", stars: 5, featured: false };

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pForm, setPForm] = useState(null);
  const [msg, setMsg] = useState("");

  const refreshLocal = useCallback(() => {
    setOrders(getAllIncomingOrders());
    setMembers(getLoyaltyMembers());
  }, []);
  const loadProducts = useCallback(async () => {
    try {
      const r = await fetch("/api/products", { cache: "no-store" });
      const d = await r.json();
      setProducts(d.products || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    refreshLocal();
    loadProducts();
    const h = () => refreshLocal();
    window.addEventListener("syk-orders-update", h);
    return () => window.removeEventListener("syk-orders-update", h);
  }, [refreshLocal, loadProducts]);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 2200); };

  const changeStatus = (roomId, orderId, status) => {
    updateOrderStatus(roomId, orderId, status);
    refreshLocal();
  };
  const saveProduct = async () => {
    const editing = !!pForm._editing;
    const r = await fetch(editing ? `/api/products/${pForm.id}` : "/api/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pForm),
    });
    const d = await r.json();
    if (!r.ok) return flash(d.error || "Gagal simpan.");
    setPForm(null); flash(editing ? "Produk diperbarui ✓" : "Produk ditambahkan ✓"); loadProducts();
  };
  const delProduct = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    const r = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (r.ok) { flash("Produk dihapus ✓"); loadProducts(); } else flash("Gagal hapus.");
  };
  const seedProducts = async () => {
    if (!confirm("Import semua produk dari data.js ke Supabase?")) return;
    const r = await fetch("/api/products/seed", { method: "POST" });
    const d = await r.json();
    if (r.ok) { flash(`Berhasil import ${d.count} produk ✓`); loadProducts(); } else flash(d.error || "Gagal import.");
  };

  if (!user) return <Gate text="Silakan login dulu sebagai Administrator." />;
  if (!isAdmin) return <Gate text="Halaman ini khusus Administrator." />;

  const doneCount = orders.filter((x) => isOrderDone(x.order.status)).length;

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <strong>Syakilla Juice</strong>
          <small>Panel Administrator</small>
        </div>
        <nav>
          {MENU.map((m) => (
            <button key={m.key} className={"adm-nav" + (tab === m.key ? " on" : "")} onClick={() => setTab(m.key)}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </nav>
        <a href="/" className="adm-back">← Kembali ke Toko</a>
      </aside>

      <main className="adm-main">
        {msg ? <div className="adm-toast">{msg}</div> : null}

        {tab === "dashboard" && (
          <>
            <h1>Dashboard</h1>
            <p className="adm-sub">Halo, {user.name || "Administrator"} 👋 Pantau semua aktivitas toko di sini.</p>
            <div className="adm-stats">
              <Stat label="Total Pesanan" value={orders.length} />
              <Stat label="Pesanan Selesai" value={doneCount} />
              <Stat label="Total Produk" value={products.length} />
              <Stat label="Total Member" value={members.length} />
            </div>
          </>
        )}

        {tab === "orders" && (
          <>
            <h1>Riwayat Pesanan</h1>
            <p className="adm-sub">Kelola status pesanan tiap pembeli.</p>
            {orders.length === 0 ? <Empty text="Belum ada pesanan." /> : orders.map(({ roomId, customer, order }) => {
              const nx = nextStatus(order.status);
              const locked = isOrderDone(order.status) || isOrderCancelled(order.status);
              return (
                <div key={roomId + order.id} className="adm-card">
                  <div className="adm-row">
                    <div>
                      <strong>{customer.name || roomId}</strong>
                      <small> · {customer.phone || "-"}</small>
                    </div>
                    <span className="adm-badge" style={{ background: statusColor(order.status) }}>{order.status}</span>
                  </div>
                  <ul className="adm-items">
                    {(order.items || []).map((it, i) => (
                      <li key={i}>{it.qty || 1}× {it.name || it.id} <span>{rupiah(priceOf(it) * (it.qty || 1))}</span></li>
                    ))}
                  </ul>
                  <div className="adm-row">
                    <strong>Total: {rupiah(orderTotal(order))}</strong>
                    <div className="adm-acts">
                      {!locked && nx ? <button className="adm-btn go" onClick={() => changeStatus(roomId, order.id, nx)}>➡ {nx}</button> : null}
                      {!locked ? <button className="adm-btn del" onClick={() => changeStatus(roomId, order.id, "Dibatalkan oleh Penjual")}>✕ Batalkan</button> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === "loyalty" && (
          <>
            <h1>Member Loyalty</h1>
            <p className="adm-sub">1 poin per Rp1.000 dari pesanan Selesai · Level: Member Baru → Bronze → Silver → Gold</p>
            {members.length === 0 ? <Empty text="Belum ada member." /> : (
              <table className="adm-table">
                <thead><tr><th>Nama</th><th>HP</th><th>Pesanan</th><th>Belanja</th><th>Poin</th><th>Level</th></tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.roomId}>
                      <td>{m.name}</td><td>{m.phone || "-"}</td>
                      <td>{m.completedOrders}/{m.totalOrders}</td>
                      <td>{rupiah(m.spent)}</td><td><strong>{m.points}</strong></td>
                      <td><span className="adm-level">{m.level}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === "products" && (
          <>
            <div className="adm-row">
              <h1>Kelola Produk</h1>
              <div className="adm-acts">
                <button className="adm-btn" onClick={seedProducts}>⬇ Import produk lama</button>
                <button className="adm-btn go" onClick={() => setPForm({ ...emptyForm })}>+ Tambah Produk</button>
              </div>
            </div>
            {products.length === 0 ? <Empty text="Belum ada produk. Klik 'Import produk lama' buat mindahin dari data.js." /> : (
              <table className="adm-table">
                <thead><tr><th>Nama</th><th>Kategori</th><th>Harga</th><th>Tag</th><th></th></tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td><td>{p.cat}</td><td>{rupiah(p.price)}</td><td>{p.tag || "-"}</td>
                      <td className="adm-acts">
                        <button className="adm-btn" onClick={() => setPForm({ ...p, _editing: true })}>Edit</button>
                        <button className="adm-btn del" onClick={() => delProduct(p.id)}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>

      {pForm && (
        <div className="adm-scrim" onClick={() => setPForm(null)}>
          <div className="adm-form" onClick={(e) => e.stopPropagation()}>
            <h3>{pForm._editing ? "Edit Produk" : "Tambah Produk"}</h3>
            <label>Nama<input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} /></label>
            <label>Kategori
              <select value={pForm.cat} onChange={(e) => setPForm({ ...pForm, cat: e.target.value })}>
                {(SITE.categories || []).map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Harga<input type="number" value={pForm.price} onChange={(e) => setPForm({ ...pForm, price: e.target.value })} /></label>
            <label>Kode Gambar (img)<input value={pForm.img} onChange={(e) => setPForm({ ...pForm, img: e.target.value })} placeholder="mis. ak_ori" /></label>
            <label>Deskripsi<textarea rows={2} value={pForm.desc} onChange={(e) => setPForm({ ...pForm, desc: e.target.value })} /></label>
            <label>Tag<input value={pForm.tag} onChange={(e) => setPForm({ ...pForm, tag: e.target.value })} placeholder="mis. Terlaris" /></label>
            <label className="adm-check"><input type="checkbox" checked={pForm.featured} onChange={(e) => setPForm({ ...pForm, featured: e.target.checked })} /> Tampilkan di menu unggulan</label>
            <div className="adm-acts">
              <button className="adm-btn" onClick={() => setPForm(null)}>Batal</button>
              <button className="adm-btn go" onClick={saveProduct}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .adm { display: flex; min-height: 100vh; background: #f6f7f5; color: #1a1a1a; font-family: inherit; }
        .adm-side { width: 240px; background: #14532d; color: #fff; padding: 24px 16px; display: flex; flex-direction: column; gap: 8px; }
        .adm-brand { margin-bottom: 16px; } .adm-brand strong { display: block; font-size: 18px; } .adm-brand small { color: #a7f3d0; }
        .adm-nav { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: transparent; border: 0; color: #d1fae5; padding: 12px 14px; border-radius: 10px; cursor: pointer; font-size: 15px; }
        .adm-nav:hover { background: rgba(255,255,255,.08); } .adm-nav.on { background: #22c55e; color: #06281a; font-weight: 700; }
        .adm-back { margin-top: auto; color: #a7f3d0; text-decoration: none; font-size: 14px; padding: 10px 14px; }
        .adm-main { flex: 1; padding: 32px 40px; position: relative; }
        .adm-main h1 { font-size: 26px; margin: 0 0 4px; } .adm-sub { color: #6b7280; margin: 0 0 20px; }
        .adm-stats { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 16px; }
        .adm-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; margin-bottom: 14px; }
        .adm-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .adm-items { list-style: none; padding: 10px 0; margin: 8px 0; border-top: 1px dashed #e5e7eb; border-bottom: 1px dashed #e5e7eb; }
        .adm-items li { display: flex; justify-content: space-between; font-size: 14px; padding: 2px 0; color: #374151; }
        .adm-badge { color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .adm-acts { display: flex; gap: 8px; flex-wrap: wrap; }
        .adm-btn { border: 1px solid #d1d5db; background: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; }
        .adm-btn.go { background: #16a34a; color: #fff; border-color: #16a34a; } .adm-btn.del { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
        .adm-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden; }
        .adm-table th, .adm-table td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #eef0ec; font-size: 14px; }
        .adm-table th { background: #f0fdf4; color: #14532d; }
        .adm-level { background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .adm-scrim { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50; }
        .adm-form { background: #fff; border-radius: 16px; padding: 22px; width: 420px; max-width: 100%; max-height: 90vh; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
        .adm-form label { display: flex; flex-direction: column; font-size: 13px; gap: 4px; color: #374151; }
        .adm-form input, .adm-form select, .adm-form textarea { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 11px; font: inherit; }
        .adm-check { flex-direction: row !important; align-items: center; gap: 8px; }
        .adm-toast { position: absolute; top: 16px; right: 40px; background: #14532d; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 14px; }
        @media (max-width: 720px){ .adm { flex-direction: column; } .adm-side { width: auto; flex-direction: row; flex-wrap: wrap; } .adm-back { margin: 0; } .adm-main { padding: 20px; } }
      `}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="adm-card" style={{ margin: 0 }}><div style={{ fontSize: 30, fontWeight: 800, color: "#16a34a" }}>{value}</div><div style={{ color: "#6b7280", fontSize: 14 }}>{label}</div></div>;
}
function Empty({ text }) { return <div className="adm-card" style={{ textAlign: "center", color: "#6b7280" }}>{text}</div>; }
function Gate({ text }) {
  return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, textAlign: "center", padding: 24 }}>
    <h2>🔒 {text}</h2><a href="/" style={{ color: "#16a34a" }}>← Kembali ke Toko</a>
  </div>;
}