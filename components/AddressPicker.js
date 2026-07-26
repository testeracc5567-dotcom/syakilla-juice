"use client";
// Buku alamat di checkout: pilih, tambah, ubah, hapus, jadikan utama.
import { useEffect, useState } from "react";
import {
  getAddresses,
  saveAddress,
  removeAddress,
  setPrimaryAddress,
} from "@/lib/addresses";
import { Icon } from "./Icons";

export default function AddressPicker({
  owner,
  value,
  onChange,
  onManualChange,
}) {
  const [list, setList] = useState([]);
  const [picked, setPicked] = useState("");
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!owner) return;
    const load = () => setList(getAddresses(owner));
    load();
    window.addEventListener("syk-addr-update", load);
    return () => window.removeEventListener("syk-addr-update", load);
  }, [owner]);

  useEffect(() => {
    if (!list.length) return;
    setPicked((cur) => cur || (list.find((a) => a.primary) || list[0]).id);
  }, [list]);

  useEffect(() => {
    if (!picked) return;
    const a = list.find((x) => x.id === picked);
    if (!a || !onChange) return;
    onChange({ name: a.name, phone: a.phone, address: a.address });
  }, [picked, list]);

  const openForm = (a) =>
    setForm(
      a
        ? Object.assign({}, a)
        : {
            id: "",
            label: "",
            name: "",
            phone: "",
            address: "",
            primary: list.length === 0,
          },
    );

  const set = (k) => (e) =>
    setForm((f) => Object.assign({}, f, { [k]: e.target.value }));

  const submit = () => {
    if (!form || !String(form.address || "").trim()) return;
    const saved = saveAddress(owner, form);
    setForm(null);
    if (saved) setPicked(saved.id);
  };

  const del = (id) => {
    if (!window.confirm("Hapus alamat ini?")) return;
    removeAddress(owner, id);
    if (picked === id) setPicked("");
  };

  return (
    <div className="co-addr">
      <div className="co-addr-head">
        <span>Alamat Pengiriman</span>
        <button type="button" className="co-addr-add" onClick={() => openForm()}>
          <Icon name="plus" /> Tambah Alamat
        </button>
      </div>

      {list.length ? (
        <div className="co-addr-list">
          {list.map((a) => (
            <div
              key={a.id}
              className={"co-addr-item" + (picked === a.id ? " on" : "")}
            >
              <button
                type="button"
                className="co-addr-pick"
                onClick={() => setPicked(a.id)}
              >
                <span className="co-dot" />
                <span className="co-addr-txt">
                  <strong>
                    {a.label}
                    {a.primary ? <em className="co-addr-badge">Utama</em> : null}
                  </strong>
                  <small>{a.address}</small>
                  <small>
                    {a.name}
                    {a.phone ? " \u00b7 " + a.phone : ""}
                  </small>
                </span>
              </button>
              <div className="co-addr-acts">
                {!a.primary ? (
                  <button
                    type="button"
                    onClick={() => setPrimaryAddress(owner, a.id)}
                  >
                    Jadikan Utama
                  </button>
                ) : null}
                <button type="button" onClick={() => openForm(a)}>
                  Ubah
                </button>
                <button type="button" className="del" onClick={() => del(a.id)}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {form ? (
        <div className="co-addr-form">
          <div className="co-grid2">
            <label className="co-field">
              <span>Label Alamat</span>
              <input
                value={form.label}
                onChange={set("label")}
                placeholder="Rumah / Kantor / Kos"
              />
            </label>
            <label className="co-field">
              <span>No. HP Penerima</span>
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="08xxxxxxxxxx"
              />
            </label>
          </div>
          <label className="co-field">
            <span>Nama Penerima</span>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="Nama lengkap"
            />
          </label>
          <label className="co-field">
            <span>Alamat Lengkap</span>
            <textarea
              value={form.address}
              onChange={set("address")}
              placeholder="Nama jalan, nomor rumah, patokan"
            />
          </label>
          <label className="co-addr-check">
            <input
              type="checkbox"
              checked={!!form.primary}
              onChange={(e) =>
                setForm((f) =>
                  Object.assign({}, f, { primary: e.target.checked }),
                )
              }
            />
            <span>Jadikan alamat utama</span>
          </label>
          <div className="co-addr-form-acts">
            <button type="button" className="co-vou-btn" onClick={submit}>
              Simpan Alamat
            </button>
            <button
              type="button"
              className="co-vou-btn ghost"
              onClick={() => setForm(null)}
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <label className="co-field">
          <span>
            {list.length
              ? "Alamat terpilih (bisa diedit langsung)"
              : "Alamat Pengiriman"}
          </span>
          <input
            value={value}
            onChange={onManualChange}
            placeholder="Nama jalan, nomor rumah, patokan"
          />
        </label>
      )}
    </div>
  );
}
