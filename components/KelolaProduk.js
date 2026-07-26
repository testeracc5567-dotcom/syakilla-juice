"use client";
// Panel admin buat kelola produk: tambah, edit, hapus, upload foto.
// List-nya realtime dari ProductsContext (langsung update begitu ada perubahan).
import { useState, useRef } from "react";
import { useProducts } from "@/context/ProductsContext";
import { money } from "@/lib/format";
import { productImage } from "@/lib/productImage";
import { Icon } from "./Icons";

const EMPTY = {
  id: "",
  name: "",
  cat: "",
  price: "",
  desc: "",
  tag: "",
  stars: 5,
  featured: false,
  img: "",
  imageData: "",
};

// Kompres gambar di browser: resize maks 800px, JPEG kualitas turun otomatis
// sampai ukurannya aman buat Firestore (limit dokumen 1MB).
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal baca file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > height && width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else if (height > MAX) {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.72;
        let out = canvas.toDataURL("image/jpeg", quality);
        while (out.length > 850000 && quality > 0.35) {
          quality -= 0.1;
          out = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function KelolaProduk() {
  const { products, live } = useProducts();
  const [form, setForm] = useState(null); // null = lagi lihat list
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);

  const cats = Array.from(new Set(products.map((p) => p.cat).filter(Boolean)));

  const startAdd = () => {
    setEditingId(null);
    setForm(Object.assign({}, EMPTY));
    setErr(null);
    setMsg(null);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      name: p.name || "",
      cat: p.cat || "",
      price: p.price != null ? String(p.price) : "",
      desc: p.desc || "",
      tag: p.tag || "",
      stars: p.stars != null ? p.stars : 5,
      featured: !!p.featured,
      img: p.img || "",
      imageData: p.imageData || "",
    });
    setErr(null);
    setMsg(null);
  };

  const cancel = () => {
    setForm(null);
    setEditingId(null);
    setErr(null);
  };

  const set = (k, v) => setForm((f) => Object.assign({}, f, { [k]: v }));

  const onPickFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setErr(null);
    try {
      const data = await compressImage(file);
      set("imageData", data);
    } catch (e2) {
      setErr(e2.message || "Gagal memproses gambar.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    setErr(null);
    setMsg(null);
    if (!form.name.trim()) return setErr("Nama produk wajib diisi.");
    if (!form.cat.trim()) return setErr("Kategori wajib diisi.");
    const payload = {
      name: form.name.trim(),
      cat: form.cat.trim(),
      price: Number(form.price) || 0,
      desc: form.desc.trim(),
      tag: form.tag.trim(),
      stars: Number(form.stars) || 0,
      featured: !!form.featured,
      img: form.img.trim(),
      imageData: form.imageData || "",
    };
    setBusy(true);
    try {
      const url = editingId
        ? "/api/admin/products/" + encodeURIComponent(editingId)
        : "/api/admin/products";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan.");
      setMsg(editingId ? "Produk diperbarui." : "Produk ditambahkan.");
      setForm(null);
      setEditingId(null);
    } catch (e) {
      setErr(e.message || "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm('Hapus produk "' + p.name + '"?')) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(
        "/api/admin/products/" + encodeURIComponent(p.id),
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal menghapus.");
      setMsg("Produk dihapus.");
    } catch (e) {
      setErr(e.message || "Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products/seed", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal impor.");
      setMsg(
        json.seeded
          ? "Berhasil impor " + json.seeded + " produk ke database."
          : json.message || "Data sudah ada.",
      );
    } catch (e) {
      setErr(e.message || "Gagal impor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kp">
      <div className="kp-head">
        <h3 className="serif">Kelola Produk</h3>
        {!form ? (
          <button className="btn-primary kp-add" onClick={startAdd}>
            <Icon name="plus" /> Tambah Produk
          </button>
        ) : null}
      </div>

      <div className="dash-realtime-note">
        Perubahan produk langsung tampil di website secara realtime.
      </div>

      {msg ? <div className="kp-alert ok">{msg}</div> : null}
      {err ? <div className="kp-alert err">{err}</div> : null}

      {!live && !form ? (
        <div className="kp-seed">
          <p>
            Produk masih dari data bawaan. Impor dulu ke database biar bisa
            diedit, diganti, atau dihapus.
          </p>
          <button className="btn-outline" onClick={seed} disabled={busy}>
            {busy ? "Memproses..." : "Impor produk ke database"}
          </button>
        </div>
      ) : null}

      {form ? (
        <div className="kp-form">
          <div className="kp-photo">
            <div className="kp-photo-prev">
              {form.imageData ? (
                <img src={form.imageData} alt="Preview" />
              ) : (
                <span className="kp-photo-empty">
                  <Icon name="camera" />
                  Belum ada foto
                </span>
              )}
            </div>
            <div className="kp-photo-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="btn-outline"
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                <Icon name="camera" /> Upload Foto
              </button>
              {form.imageData ? (
                <button
                  type="button"
                  className="kp-link-del"
                  onClick={() => set("imageData", "")}
                >
                  Hapus foto
                </button>
              ) : null}
            </div>
          </div>

          <label className="kp-field">
            <span>Nama produk</span>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Misal: Alpukat Kocok Coklat"
            />
          </label>

          <div className="kp-row">
            <label className="kp-field">
              <span>Kategori</span>
              <input
                list="kp-cats"
                value={form.cat}
                onChange={(e) => set("cat", e.target.value)}
                placeholder="Misal: Alpukat Kocok"
              />
              <datalist id="kp-cats">
                {cats.map((c) => (
                  <option value={c} key={c} />
                ))}
              </datalist>
            </label>
            <label className="kp-field">
              <span>Harga (Rp)</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="18000"
              />
            </label>
          </div>

          <label className="kp-field">
            <span>Deskripsi</span>
            <textarea
              value={form.desc}
              onChange={(e) => set("desc", e.target.value)}
              placeholder="Ceritain rasa & isinya..."
            />
          </label>

          <div className="kp-row">
            <label className="kp-field">
              <span>Label (opsional)</span>
              <input
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="Misal: Best Seller"
              />
            </label>
            <label className="kp-field">
              <span>Rating awal</span>
              <select
                value={form.stars}
                onChange={(e) => set("stars", Number(e.target.value))}
              >
                {[5, 4.5, 4, 3.5, 3].map((s) => (
                  <option value={s} key={s}>
                    {s} bintang
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="kp-check">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            <span>Tampilkan di beranda (produk unggulan)</span>
          </label>

          <div className="kp-form-actions">
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy
                ? "Menyimpan..."
                : editingId
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </button>
            <button className="btn-outline" onClick={cancel} disabled={busy}>
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="kp-list">
          {!products.length ? (
            <div className="tx-empty">Belum ada produk.</div>
          ) : (
            products.map((p) => (
              <div className="kp-item" key={p.id}>
                <span className="kp-thumb">
                  <img src={productImage(p)} alt={p.name} />
                </span>
                <div className="kp-meta">
                  <strong>{p.name}</strong>
                  <small>
                    {p.cat} · {money(p.price)}{" \u00b7 Stok "}
                    {p.stock != null ? p.stock : 0}
                    {p.featured ? " · Unggulan" : ""}
                  </small>
                </div>
                <div className="kp-actions">
                  <button
                    className="icon-btn"
                    onClick={() => startEdit(p)}
                    aria-label="Edit"
                    disabled={busy}
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    className="icon-btn kp-del"
                    onClick={() => remove(p)}
                    aria-label="Hapus"
                    disabled={busy}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}