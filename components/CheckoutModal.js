"use client";
import { useState } from "react";
import { useUI } from "@/context/UIContext";
import { useStore } from "@/context/StoreContext";
import { useChat } from "@/context/ChatContext";
import { saveOrder } from "@/lib/orders";
import AddressPicker from "./AddressPicker";
import { money } from "@/lib/format";
import { SHIPPING_FEE, POINT_VOUCHERS, applyVoucher } from "@/lib/vouchers";
import { BANKS, EWALLETS, QRIS, isFilled } from "@/lib/payment";
import { useAuth } from "@/context/AuthContext";
import { getCustomerOrders } from "@/lib/orders";
import { Icon } from "./Icons";

const METHODS = [
  {
    id: "qris",
    label: "QRIS",
    desc: "Scan pakai bank / e-wallet apa aja",
    icon: "card",
  },
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

const DELIVERY = [
  { id: "kirim", label: "Diantar ke Alamat", icon: "pin" },
  { id: "ambil", label: "Ambil di Tempat", icon: "store" },
];

const METHOD_NOTE = {
  qris: "Scan QRIS di bawah, lalu kirim bukti bayar lewat chat.",
  transfer: "Transfer ke salah satu rekening di bawah, lalu kirim buktinya lewat chat.",
  ewallet: "Kirim ke salah satu e-wallet di bawah, lalu kirim buktinya lewat chat.",
  cod: "Siapkan uang pas ya biar cepat.",
};

export default function CheckoutModal() {
  const { checkoutOpen, closeCheckout } = useUI();
  const { cart, subtotal, P, clear, changeQty } = useStore();
  const { myRoom } = useChat();
  const { user } = useAuth();

  const [method, setMethod] = useState("qris");
  const [delivery, setDelivery] = useState("kirim");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const pickAddress = (a) =>
    setForm((f) =>
      Object.assign({}, f, {
        name: a.name || f.name,
        phone: a.phone || f.phone,
        address: a.address || f.address,
      }),
    );
  const [codeInput, setCodeInput] = useState("");
  const [applied, setApplied] = useState("");
  const [vErr, setVErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [stage, setStage] = useState("form"); // form | processing | done
  const [orderId, setOrderId] = useState("");
  const [receipt, setReceipt] = useState(null);

  if (!checkoutOpen) return null;

  const entries = Object.entries(cart);

  // Poin loyalty: 1 poin = Rp 1.000 dari pesanan yang udah Selesai.
  const myOrders =
    user && user.email ? getCustomerOrders(user.email).orders || [] : [];
  const doneSpend = myOrders
    .filter((o) => String(o.status || "").toLowerCase().includes("selesai"))
    .reduce((s, o) => s + (o.total || 0), 0);
  const points = Math.floor(doneSpend / 1000);

  const shipping = delivery === "kirim" ? SHIPPING_FEE : 0;
  const vres = applyVoucher(applied, subtotal, shipping);
  const discount = vres.ok ? vres.discount : 0;
  const shipDisc = vres.ok ? vres.shippingDiscount : 0;
  const total = Math.max(0, subtotal + shipping - discount - shipDisc);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Tukar poin jadi voucher.
  const redeem = (v) => {
    if (applied === v.code) {
      setApplied("");
      setVErr("");
      return;
    }
    if (points < v.cost) {
      setApplied("");
      setVErr(
        "Poin kamu " + points + ", butuh " + v.cost + " poin buat tukar voucher ini.",
      );
      return;
    }
    const r = applyVoucher(v.code, subtotal, shipping);
    if (!r.ok) {
      setApplied("");
      setVErr(r.error || "Voucher belum bisa dipakai.");
      return;
    }
    setApplied(v.code);
    setCodeInput(v.code);
    setVErr("");
  };

  const clearCode = () => {
    setApplied("");
    setCodeInput("");
    setVErr("");
  };

  const pay = (e) => {
    e.preventDefault();
    if (entries.length === 0) return;
    if (!form.name.trim() || !form.phone.trim()) {
      setFormErr("Nama dan nomor HP wajib diisi.");
      return;
    }
    if (delivery === "kirim" && !form.address.trim()) {
      setFormErr("Alamat wajib diisi kalau mau diantar.");
      return;
    }
    setFormErr("");
    setStage("processing");

    // Rekam isi pesanan SEBELUM keranjang dikosongkan.
    const items = entries.map(([id, q]) => {
      const p = P(id);
      return { id, name: p ? p.name : id, qty: q, price: p ? p.price : 0 };
    });
    const snap = {
      items,
      subtotal,
      shipping: Math.max(0, shipping - shipDisc),
      discount,
      total,
      method,
      delivery,
      voucher: vres.ok && vres.voucher ? vres.voucher.code : "",
    };
    const cust = {
      name: form.name,
      phone: form.phone,
      address: form.address,
    };

    setTimeout(() => {
      const newId = "SYK" + Math.floor(100000 + Math.random() * 900000);
      setOrderId(newId);
      setReceipt(snap);
      saveOrder(myRoom, {
        customer: cust,
        order: {
          id: newId,
          items: snap.items,
          subtotal: snap.subtotal,
          shipping: snap.shipping,
          discount: snap.discount,
          voucher: snap.voucher,
          delivery: snap.delivery,
          total: snap.total,
          method: snap.method,
          note: form.note,
          ts: Date.now(),
          status: method === "cod" ? "Diproses" : "Belum Dibayar",
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
      setForm({ name: "", phone: "", address: "", note: "" });
      setMethod("transfer");
      setDelivery("kirim");
      setApplied("");
      setCodeInput("");
      setVErr("");
      setFormErr("");
      setReceipt(null);
    }, 300);
  };

  return (
    <div className="co-scrim">
      <div className="co">
        <header className="co-top">
          <button type="button" className="co-back" onClick={close}>
            <span aria-hidden="true">{"\u2190"}</span> Lanjut Belanja
          </button>
          <div className="co-title">
            <strong className="serif">Checkout &amp; Pembayaran</strong>
            <small>Syakilla Juice</small>
          </div>
          <button
            type="button"
            className="co-x"
            onClick={close}
            aria-label="Tutup"
          >
            <Icon name="close" />
          </button>
        </header>

        {stage === "done" ? (
          <div className="co-done">
            <div className="co-check">
              <Icon name="check" />
            </div>
            <h2 className="serif">Pesanan Berhasil Dibuat!</h2>
            <p>
              Nomor pesanan <strong>#{orderId}</strong>. Kami langsung siapin
              jusnya. Makasih udah belanja di Syakilla Juice!
            </p>

            {receipt ? (
              <div className="co-receipt">
                {receipt.items.map((it) => (
                  <div className="co-line" key={it.id}>
                    <span>
                      {it.name} <em>x{it.qty}</em>
                    </span>
                    <span>{money(it.price * it.qty)}</span>
                  </div>
                ))}
                <div className="co-line">
                  <span>Subtotal</span>
                  <span>{money(receipt.subtotal)}</span>
                </div>
                <div className="co-line">
                  <span>
                    {receipt.delivery === "kirim"
                      ? "Ongkir"
                      : "Ambil di tempat"}
                  </span>
                  <span>
                    {receipt.shipping > 0 ? money(receipt.shipping) : "Gratis"}
                  </span>
                </div>
                {receipt.discount > 0 ? (
                  <div className="co-line disc">
                    <span>Voucher {receipt.voucher}</span>
                    <span>{"-" + money(receipt.discount)}</span>
                  </div>
                ) : null}
                <div className="co-line total">
                  <span>Total Bayar</span>
                  <span>{money(receipt.total)}</span>
                </div>
              </div>
            ) : null}

            <button type="button" className="btn-primary full" onClick={close}>
              Selesai
            </button>
          </div>
        ) : (
          <form className="co-body" onSubmit={pay}>
            <div className="co-main">
              <section className="co-card">
                <div className="co-step">
                  <span className="co-num">1</span>
                  <h3>Metode Pengambilan</h3>
                </div>
                <div className="co-opts two">
                  {DELIVERY.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={"co-opt" + (delivery === d.id ? " on" : "")}
                      onClick={() => setDelivery(d.id)}
                    >
                      <span className="co-opt-ic">
                        <Icon name={d.icon} />
                      </span>
                      <span className="co-opt-txt">
                        <strong>{d.label}</strong>
                        <small>
                          {d.id === "kirim"
                            ? "Ongkir " + money(SHIPPING_FEE)
                            : "Gratis, ambil di outlet"}
                        </small>
                      </span>
                      <span className="co-dot" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="co-card">
                <div className="co-step">
                  <span className="co-num">2</span>
                  <h3>Data Penerima</h3>
                </div>
                <div className="co-grid2">
                  <label className="co-field">
                    <span>Nama Penerima</span>
                    <input
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Nama lengkap"
                    />
                  </label>
                  <label className="co-field">
                    <span>No. HP / WhatsApp</span>
                    <input
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="08xxxxxxxxxx"
                    />
                  </label>
                </div>
                {delivery === "kirim" ? (
                  <AddressPicker
                    owner={myRoom}
                    value={form.address}
                    onChange={pickAddress}
                    onManualChange={set("address")}
                  />
                ) : null}
                <label className="co-field">
                  <span>Catatan (opsional)</span>
                  <input
                    value={form.note}
                    onChange={set("note")}
                    placeholder="Misal: es dikit, gula setengah"
                  />
                </label>
                {formErr ? <div className="co-err">{formErr}</div> : null}
              </section>

              <section className="co-card">
                <div className="co-step">
                  <span className="co-num">3</span>
                  <h3>Metode Pembayaran</h3>
                </div>
                <div className="co-opts">
                  {METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      className={"co-opt" + (method === m.id ? " on" : "")}
                      onClick={() => setMethod(m.id)}
                    >
                      <span className="co-opt-ic">
                        <Icon name={m.icon} />
                      </span>
                      <span className="co-opt-txt">
                        <strong>{m.label}</strong>
                        <small>{m.desc}</small>
                      </span>
                      <span className="co-dot" />
                    </button>
                  ))}
                </div>
                <p className="co-hint">{METHOD_NOTE[method]}</p>

                {method === "qris" ? (
                  <div className="co-pay">
                    <div className="co-pay-h">Bayar pakai QRIS</div>
                    {isFilled(QRIS.image) ? (
                      <img className="co-qris" src={QRIS.image} alt="QRIS Syakilla Juice" />
                    ) : (
                      <div className="co-pay-empty">
                        QRIS sedang disiapkan. Sementara pilih Transfer Bank /
                        E-Wallet dulu ya.
                      </div>
                    )}
                    {isFilled(QRIS.merchant) ? (
                      <div className="co-pay-row">
                        <span>Merchant</span>
                        <strong>{QRIS.merchant}</strong>
                      </div>
                    ) : null}
                    <small className="co-pay-note">{QRIS.note}</small>
                  </div>
                ) : null}

                {method === "transfer" ? (
                  <div className="co-pay">
                    <div className="co-pay-h">Nomor Rekening</div>
                    {BANKS.filter((b) => isFilled(b.number)).length ? (
                      BANKS.filter((b) => isFilled(b.number)).map((b) => (
                        <div className="co-pay-row" key={b.bank}>
                          <span>{b.bank}</span>
                          <strong>{b.number}</strong>
                          <small>a.n. {b.holder}</small>
                        </div>
                      ))
                    ) : (
                      <div className="co-pay-empty">
                        Nomor rekening belum diisi. Nomor akan dikirim lewat chat
                        setelah pesanan masuk.
                      </div>
                    )}
                  </div>
                ) : null}

                {method === "ewallet" ? (
                  <div className="co-pay">
                    <div className="co-pay-h">Nomor E-Wallet</div>
                    {EWALLETS.filter((w) => isFilled(w.number)).length ? (
                      EWALLETS.filter((w) => isFilled(w.number)).map((w) => (
                        <div className="co-pay-row" key={w.name}>
                          <span>{w.name}</span>
                          <strong>{w.number}</strong>
                          <small>a.n. {w.holder}</small>
                        </div>
                      ))
                    ) : (
                      <div className="co-pay-empty">
                        Nomor e-wallet belum diisi. Nomor akan dikirim lewat chat
                        setelah pesanan masuk.
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="co-side">
              <div className="co-card">
                <h3 className="co-side-h">Ringkasan Pesanan</h3>

                {entries.length === 0 ? (
                  <p className="co-empty">
                    Keranjang masih kosong. Balik dulu yuk pilih jusnya.
                  </p>
                ) : (
                  <div className="co-items">
                    {entries.map(([id, q]) => {
                      const p = P(id);
                      if (!p) return null;
                      return (
                        <div className="co-item" key={id}>
                          <div className="co-item-txt">
                            <strong>{p.name}</strong>
                            <small>{money(p.price)}</small>
                          </div>
                          <div className="co-qty">
                            <button
                              type="button"
                              onClick={() => changeQty(id, -1)}
                              aria-label="Kurangi"
                            >
                              {"\u2212"}
                            </button>
                            <span>{q}</span>
                            <button
                              type="button"
                              onClick={() => changeQty(id, 1)}
                              aria-label="Tambah"
                            >
                              +
                            </button>
                          </div>
                          <div className="co-item-sum">
                            {money(p.price * q)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="co-vou">
                  <div className="co-vou-h">
                    <Icon name="sparkle" /> Tukar Poin Jadi Voucher
                  </div>
                  <div className="co-poin">
                    Poin kamu: <strong>{points}</strong> poin
                  </div>

                  {vErr ? <div className="co-err">{vErr}</div> : null}
                  {applied && vres.ok ? (
                    <div className="co-ok">
                      Voucher <strong>{vres.voucher.label}</strong> kepakai.{" "}
                      <button
                        type="button"
                        className="co-vou-btn ghost"
                        onClick={clearCode}
                      >
                        Batal
                      </button>
                    </div>
                  ) : null}

                  <div className="co-chips">
                    {POINT_VOUCHERS.map((v) => {
                      const enough = points >= v.cost;
                      return (
                        <button
                          type="button"
                          key={v.code}
                          className={
                            "co-chip" +
                            (applied === v.code ? " on" : "") +
                            (enough ? "" : " off")
                          }
                          onClick={() => redeem(v)}
                          title={
                            v.desc + (v.min ? ", min. belanja " + money(v.min) : "")
                          }
                        >
                          <strong>{v.label}</strong>
                          <small>{v.cost} poin</small>
                        </button>
                      );
                    })}
                  </div>
                  <small className="co-poin-note">
                    Poin didapat dari pesanan yang udah Selesai. Tiap Rp 1.000 = 1
                    poin.
                  </small>
                </div>

                <div className="co-lines">
                  <div className="co-line">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="co-line">
                    <span>
                      {delivery === "kirim" ? "Ongkir" : "Ambil di tempat"}
                    </span>
                    <span>{shipping > 0 ? money(shipping) : "Gratis"}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="co-line disc">
                      <span>Diskon voucher</span>
                      <span>{"-" + money(discount)}</span>
                    </div>
                  ) : null}
                  {shipDisc > 0 ? (
                    <div className="co-line disc">
                      <span>Gratis ongkir</span>
                      <span>{"-" + money(shipDisc)}</span>
                    </div>
                  ) : null}
                  <div className="co-line total">
                    <span>Total Bayar</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary full"
                  disabled={entries.length === 0 || stage === "processing"}
                >
                  {stage === "processing" ? (
                    <span className="spinner sm" />
                  ) : (
                    "Bayar " + money(total)
                  )}
                </button>
                <p className="co-safe">
                  <Icon name="shield" /> Pesanan kamu aman &amp; dikonfirmasi
                  lewat chat.
                </p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
