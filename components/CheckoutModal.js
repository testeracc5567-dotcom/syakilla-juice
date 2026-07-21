"use client";
import { useState } from "react";
import { useUI } from "@/context/UIContext";
import { useStore } from "@/context/StoreContext";
import { useChat } from "@/context/ChatContext";
import { saveOrder } from "@/lib/orders";
import { money } from "@/lib/format";
import { Icon } from "./Icons";

const METHODS = [
  {
    id: "transfer",
    label: "Transfer Bank",
    desc: "BCA / BRI / Mandiri",
    icon: "card",
  },
  {
    id: "ewallet",
    label: "E-Wallet",
    desc: "DANA / OVO / GoPay",
    icon: "wallet",
  },
  {
    id: "cod",
    label: "Bayar di Tempat (COD)",
    desc: "Bayar pas ambil / diantar",
    icon: "store",
  },
];

export default function CheckoutModal() {
  const { checkoutOpen, closeCheckout } = useUI();
  const { cart, subtotal, P, clear } = useStore();
  const { myRoom } = useChat();
  const [method, setMethod] = useState("transfer");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [stage, setStage] = useState("form"); // form | processing | done
  const [orderId, setOrderId] = useState("");

  if (!checkoutOpen) return null;

  const entries = Object.entries(cart);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pay = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setStage("processing");
    // Rekam isi pesanan SEBELUM keranjang dikosongkan.
    const items = entries.map(([id, q]) => {
      const p = P(id);
      return { id, name: p ? p.name : id, qty: q, price: p ? p.price : 0 };
    });
    const total = subtotal;
    const chosen = method;
    const cust = {
      name: form.name,
      phone: form.phone,
      address: form.address,
    };
    setTimeout(() => {
      const newId = "SYK" + Math.floor(100000 + Math.random() * 900000);
      setOrderId(newId);
      // Simpan order ke riwayat (biar admin bisa lihat di panel chat).
      saveOrder(myRoom, {
        customer: cust,
        order: {
          id: newId,
          items,
          total,
          method: chosen,
          ts: Date.now(),
          status: "Diproses",
        },
      });
      setStage("done");
      clear();
    }, 2000);
  };

  const close = () => {
    closeCheckout();
    setTimeout(() => {
      setStage("form");
      setForm({ name: "", phone: "", address: "" });
      setMethod("transfer");
    }, 300);
  };

  return (
    <div className="modal-scrim show" onClick={close}>
      <div
        className="modal checkout-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-x icon-btn" onClick={close} aria-label="Tutup">
          <Icon name="close" />
        </button>

        {stage === "done" ? (
          <div className="pay-done">
            <div className="pay-check">
              <Icon name="check" />
            </div>
            <h3 className="serif">Pembayaran Berhasil!</h3>
            <p>
              Pesanan <strong>#{orderId}</strong> lagi kami siapkan. Makasih
              udah belanja di Syakilla Juice!
            </p>
            <button className="btn-primary full" onClick={close}>
              Selesai
            </button>
          </div>
        ) : (
          <>
            <h3 className="serif">Checkout &amp; Pembayaran</h3>

            <div className="pay-summary">
              {entries.length === 0 ? (
                <div className="pay-line">
                  <span>Keranjang kosong</span>
                </div>
              ) : (
                entries.map(([id, q]) => {
                  const p = P(id);
                  if (!p) return null;
                  return (
                    <div className="pay-line" key={id}>
                      <span>
                        {p.name} <em>x{q}</em>
                      </span>
                      <span>{money(p.price * q)}</span>
                    </div>
                  );
                })
              )}
              <div className="pay-line total">
                <span>Total</span>
                <span>{money(subtotal)}</span>
              </div>
            </div>

            <form onSubmit={pay} className="pay-form">
              <label>
                Nama Penerima
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Nama"
                />
              </label>
              <label>
                No. HP / WhatsApp
                <input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="08xxxxxxxxxx"
                />
              </label>
              <label>
                Alamat (opsional, buat diantar)
                <input
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Alamat pengiriman"
                />
              </label>

              <div className="pay-methods">
                {METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={"pay-method" + (method === m.id ? " on" : "")}
                    onClick={() => setMethod(m.id)}
                  >
                    <span className="pm-ic">
                      <Icon name={m.icon} />
                    </span>
                    <span className="pm-txt">
                      <strong>{m.label}</strong>
                      <small>{m.desc}</small>
                    </span>
                    <span className="pm-dot" />
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="btn-primary full"
                disabled={entries.length === 0 || stage === "processing"}
              >
                {stage === "processing" ? (
                  <span className="spinner sm" />
                ) : (
                  "Bayar " + money(subtotal)
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}