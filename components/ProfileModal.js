"use client";
import { useState, useEffect, useRef } from "react";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "./Icons";

function uid() {
  return "adr_" + Math.random().toString(36).slice(2, 9);
}

export default function ProfileModal() {
  const { profileOpen, closeProfile } = useUI();
  const { user, isAdmin, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (profileOpen && user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setPhoto(user.photo || "");
      setAddresses(user.addresses || []);
      setSelectedAddressId(user.selectedAddressId || null);
      setEditing(null);
      setSaved(false);
    }
  }, [profileOpen, user]);

  if (!profileOpen || !user) return null;

  const onPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const startAdd = () => setEditing({ id: uid(), label: "", detail: "" });
  const startEdit = (a) => setEditing({ ...a });

  const saveAddress = () => {
    if (!editing) return;
    const label = editing.label.trim() || "Alamat";
    const detail = editing.detail.trim();
    if (!detail) return;
    setAddresses((list) => {
      const exists = list.some((a) => a.id === editing.id);
      const item = { id: editing.id, label, detail };
      return exists
        ? list.map((a) => (a.id === editing.id ? item : a))
        : [...list, item];
    });
    setSelectedAddressId((sid) => sid || editing.id);
    setEditing(null);
  };

  const removeAddress = (id) => {
    setAddresses((list) => list.filter((a) => a.id !== id));
    setSelectedAddressId((sid) => (sid === id ? null : sid));
  };

  const save = () => {
    updateProfile({
      name: name.trim() || user.name,
      phone: phone.trim(),
      photo,
      addresses,
      selectedAddressId,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="modal-scrim show" onClick={closeProfile}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-x icon-btn"
          onClick={closeProfile}
          aria-label="Tutup"
        >
          <Icon name="close" />
        </button>
        <h3 className="serif">Profil Saya</h3>
        <div className={"profile-role " + (isAdmin ? "admin" : "buyer")}>
          <Icon name={isAdmin ? "shield" : "user"} />
          {isAdmin
            ? "Akun Administrator — kelola pesanan & chat pembeli"
            : "Akun Pembeli"}
        </div>

        <div className="profile-photo-row">
          <div className="profile-ava">
            {photo ? <img src={photo} alt={name} /> : <Icon name="user" />}
          </div>
          <div className="profile-photo-act">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fileRef.current && fileRef.current.click()}
            >
              <Icon name="camera" /> Ganti Foto
            </button>
            {photo ? (
              <button
                type="button"
                className="btn-ghost danger"
                onClick={() => setPhoto("")}
              >
                Hapus
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPhoto}
            />
          </div>
        </div>

        <label className="fld">
          Nama
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
          />
        </label>
        <label className="fld">
          Email
          <input value={user.email} readOnly disabled />
        </label>
        <label className="fld">
          No. HP / WhatsApp
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </label>

        {!isAdmin ? (
          <div className="addr-block">
            <div className="addr-head">
              <span>Alamat Pengiriman</span>
              <button type="button" className="btn-ghost" onClick={startAdd}>
                <Icon name="plus" /> Tambah
              </button>
            </div>

            {addresses.length === 0 && !editing ? (
              <div className="addr-empty">
                Belum ada alamat. Tambahkan biar gampang pas checkout.
              </div>
            ) : null}

            {addresses.map((a) => (
              <div
                key={a.id}
                className={
                  "addr-item" + (selectedAddressId === a.id ? " on" : "")
                }
              >
                <button
                  type="button"
                  className="addr-pick"
                  onClick={() => setSelectedAddressId(a.id)}
                  aria-label="Pilih alamat utama"
                >
                  <span className="addr-radio" />
                  <span className="addr-txt">
                    <strong>
                      <Icon name="pin" /> {a.label}
                      {selectedAddressId === a.id ? <em> · Utama</em> : null}
                    </strong>
                    <small>{a.detail}</small>
                  </span>
                </button>
                <span className="addr-tools">
                  <button
                    type="button"
                    className="icon-btn sm"
                    onClick={() => startEdit(a)}
                    aria-label="Edit alamat"
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn sm"
                    onClick={() => removeAddress(a.id)}
                    aria-label="Hapus alamat"
                  >
                    <Icon name="trash" />
                  </button>
                </span>
              </div>
            ))}

            {editing ? (
              <div className="addr-form">
                <input
                  value={editing.label}
                  onChange={(e) =>
                    setEditing((d) => ({ ...d, label: e.target.value }))
                  }
                  placeholder="Label (Rumah, Kantor, Kos...)"
                />
                <textarea
                  value={editing.detail}
                  onChange={(e) =>
                    setEditing((d) => ({ ...d, detail: e.target.value }))
                  }
                  placeholder="Alamat lengkap (jalan, no rumah, patokan)"
                  rows={2}
                />
                <div className="addr-form-act">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setEditing(null)}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn-primary sm"
                    onClick={saveAddress}
                  >
                    Simpan Alamat
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="addr-empty admin-note">
            Akun admin gak perlu alamat pengiriman. Kamu bisa kelola chat
            pembeli lewat tombol chat di header.
          </div>
        )}

        <button type="button" className="btn-primary full" onClick={save}>
          {saved ? "Tersimpan ✓" : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}