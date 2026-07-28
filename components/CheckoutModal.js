"use client";
import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { useStore } from "@/context/StoreContext";
import { useChat } from "@/context/ChatContext";
import { saveOrder } from "@/lib/orders";
import AddressPicker from "./AddressPicker";
import { money } from "@/lib/format";
import { SHIPPING_FEE, POINT_VOUCHERS, applyVoucher } from "@/lib/vouchers";
import { BANKS, EWALLETS, QRIS, isFilled } from "@/lib/payment";
import { useAuth } from "@/context/AuthContext";
import {
  getCustomerOrders,
  updateOrderStatus,
  refreshOrders,
} from "@/lib/orders";
import { loadSnap } from "@/lib/snap";
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

// Batas waktu bayar: 20 menit.
const PAY_WINDOW_MS = 20 * 60 * 1000;

function mmss(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return (m < 10 ? "0" + m : "" + m) + ":" + (r < 10 ? "0" + r : "" + r);
}

export default function CheckoutModal() {
  const { checkoutOpen, closeCheckout, showToast } = useUI();
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

  const [expiresAt, setExpiresAt] = useState(0);
  const [left, setLeft] = useState(0);
  const [payStatus, setPayStatus] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payClicked, setPayClicked] = useState(false);

  // Selama nunggu bayar: hitung mundur + pantau status pesanan realtime.
  useEffect(() => {
    if (stage !== "waiting" || !orderId) return;

    const tick = () => {
      const ms = expiresAt - Date.now();
      setLeft(Math.ceil(Math.max(0, ms) / 1000));

      const list = getCustomerOrders(myRoom).orders || [];
      const cur = list.find((o) => o.id === orderId);
      const st = String((cur && cur.status) || "").toLowerCase();

      if (st.includes("batal")) {
        setPayStatus(ms <= 0 ? "expired" : "cancel");
        return;
      }
      if (st && !st.includes("belum") && !st.includes("menunggu")) {
        setPayStatus("paid");
        setStage("done");
        return;
      }
      if (ms <= 0) {
        setPayStatus("expired");
        updateOrderStatus(myRoom, orderId, "Dibatalkan (Waktu Bayar Habis)");
      }
    };

    tick();
    const iv = setInterval(() => {
      refreshOrders(myRoom);
      tick();
    }, 3000);
    window.addEventListener("syk-orders-update", tick);
    return () => {
      clearInterval(iv);
      window.removeEventListener("syk-orders-update", tick);
    };
  }, [stage, orderId, expiresAt, myRoom]);

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
      const exp = Date.now() + PAY_WINDOW_MS;
      setOrderId(newId);
      setExpiresAt(exp);
      setLeft(Math.ceil(PAY_WINDOW_MS / 1000));
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
          expiresAt: method === "cod" ? 0 : exp,
          status: method === "cod" ? "Diproses" : "Belum Dibayar",
        },
      });
      setPayStatus(method === "cod" ? "paid" : "");
      setStage(method === "cod" ? "done" : "waiting");
      clear();
    }, 2000);
  };

  // Bayar online (Midtrans Snap). Pembayaran masuk otomatis lewat webhook,
  // status pesanan langsung jadi Diproses tanpa konfirmasi admin.
  const payOnline = async () => {
    if (!orderId || payBusy) return;
    setPayBusy(true);
    try {
      const res = await fetch("/api/pay/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, roomId: myRoom }),
      });
      const out = await res.json();
      if (!out.ok || !out.token) {
        throw new Error(out.error || "Gagal buka pembayaran.");
      }
      const snap = await loadSnap(out.clientKey);
      if (!snap) {
        if (out.redirect_url) window.open(out.redirect_url, "_blank");
        return;
      }
      snap.pay(out.token, {
        onSuccess: () => {
          setPayStatus("checking");
          refreshOrders(myRoom);
        },
        onPending: () => {
          setPayStatus("checking");
          refreshOrders(myRoom);
        },
        onError: () => {
          if (showToast) showToast("Pembayaran gagal, coba lagi ya.");
        },
        onClose: () => {},
      });
    } catch (e) {
      if (showToast) showToast(e.message || "Gagal buka pembayaran.");
    } finally {
      setPayBusy(false);
    }
  };

  const close = () => {
    closeCheckout();
    setTimeout(() => {
      setStage("form");
      setForm({ name: "", phone: "", address: "", note: "" });
      setMethod("qris");
      setExpiresAt(0);
      setLeft(0);
      setPayStatus("");
      setPayClicked(false);
      setPayBusy(false);
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

        {stage === "waiting" ? (
          <div className="co-wait">
            <div className="co-wait-clock">
              <strong>{mmss(left)}</strong>
              <small>sisa waktu bayar</small>
            </div>
            <h2 className="serif">Menunggu Pembayaran</h2>
            <p>
              Pesanan <strong>#{orderId}</strong> udah masuk. Selesaikan
              pembayaran sebelum waktunya habis ya.
            </p>

            <div className="co-wait-amount">
              <span className="cwa-h">Jumlah yang harus dibayar</span>
              <strong className="cwa-total">
                {money(receipt ? receipt.total : total)}
              </strong>
              {receipt ? (
                <div className="cwa-rinci">
                  <div className="cwa-row">
                    <span>Total belanja</span>
                    <span>{money(receipt.subtotal)}</span>
                  </div>
                  <div className="cwa-row">
                    <span>
                      {receipt.delivery === "kirim"
                        ? "Ongkir"
                        : "Ambil di tempat"}
                    </span>
                    <span>
                      {receipt.shipping > 0
                        ? money(receipt.shipping)
                        : "Gratis"}
                    </span>
                  </div>
                  {receipt.discount > 0 ? (
                    <div className="cwa-row disc">
                      <span>Voucher {receipt.voucher}</span>
                      <span>{"-" + money(receipt.discount)}</span>
                    </div>
                  ) : null}
                  <div className="cwa-row total">
                    <span>Total bayar</span>
                    <span>{money(receipt.total)}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {payStatus === "expired" ? (
              <div className="co-wait-bad">
                Waktu pembayaran habis. Pesanan otomatis dibatalkan, silakan
                pesan lagi.
              </div>
            ) : payStatus === "cancel" ? (
              <div className="co-wait-bad">
                Pesanan ini dibatalkan oleh admin.
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="co-wait-online"
                  onClick={payOnline}
                  disabled={payBusy}
                >
                  {payBusy
                    ? "Membuka pembayaran..."
                    : "Bayar Online " + money(receipt ? receipt.total : total)}
                </button>
                <p className="co-wait-hint">
                  QRIS, GoPay, ShopeePay, Virtual Account, kartu. Pembayaran
                  masuk otomatis dan pesanan langsung diproses sistem, tanpa
                  konfirmasi admin.
                </p>
                <div className="co-wait-or">atau bayar manual</div>

                {method === "qris" ? (
                  <div className="co-pay">
                    <div className="co-pay-h">Scan QRIS ini</div>
                    {isFilled(QRIS.image) ? (
                      <img
                        className="co-qris"
                        src={QRIS.image}
                        alt="QRIS Syakilla Juice"
                      />
                    ) : (
                      <div className="co-pay-empty">
                        QRIS belum tersedia. Hubungi admin lewat chat ya.
                      </div>
                    )}
                    {isFilled(QRIS.merchant) ? (
                      <div className="co-pay-row">
                        <span>Merchant</span>
                        <strong>{QRIS.merchant}</strong>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {method === "transfer" ? (
                  <div className="co-pay">
                    <div className="co-pay-h">Transfer ke</div>
                    {BANKS.filter((b) => isFilled(b.number)).map((b) => (
                      <div className="co-pay-row" key={b.bank}>
                        <span>{b.bank}</span>
                        <strong>{b.number}</strong>
                        <small>a.n. {b.holder}</small>
                      </div>
                    ))}
                  </div>
                ) : null}

                {method === "ewallet" ? (
                  <div className="co-pay">
                    <div className="co-pay-h">Kirim ke</div>
                    {EWALLETS.filter((w) => isFilled(w.number)).map((w) => (
                      <div className="co-pay-row" key={w.name}>
                        <span>{w.name}</span>
                        <strong>{w.number}</strong>
                        <small>a.n. {w.holder}</small>
                      </div>
                    ))}
                  </div>
                ) : null}

                {payStatus === "checking" ? (
                  <div className="co-wait-ok">
                    Bukti bayar kamu sedang dicek admin. Halaman ini update
                    sendiri begitu pembayaran masuk.
                  </div>
                ) : (
                  <button
                    type="button"
                    className="co-wait-btn"
                    disabled={payClicked}
                    onClick={() => {
                      if (payClicked) return;
                      setPayClicked(true);
                      updateOrderStatus(myRoom, orderId, "Menunggu Konfirmasi");
                      setPayStatus("checking");
                    }}
                  >
                    {payClicked ? "Menunggu Konfirmasi..." : "Saya Sudah Bayar (sekali aja)"}
                  </button>
                )}

                <p className="co-wait-note">
                  Begitu pembayaran masuk dan dikonfirmasi admin, tulisan di
                  sini otomatis berubah jadi Pesanan Berhasil Dibayar. Nggak
                  perlu refresh.
                </p>
              </>
            )}

            <button type="button" className="co-wait-x" onClick={close}>
              Tutup
            </button>
          </div>
        ) : stage === "done" ? (

          <div className="co-done">
            <div className="co-check">
              <Icon name="check" />
            </div>
            <h2 className="serif">
              {payStatus === "paid" && method !== "cod"
                ? "Pesanan Berhasil Dibayar!"
                : "Pesanan Berhasil Dibuat!"}
            </h2>
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
