"use client";
import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useProducts } from "@/context/ProductsContext";
import {
  getCustomerOrders,
  getAllIncomingOrders,
  isOrderDone,
  isOrderCancelled,
  updateOrderStatus,
} from "@/lib/orders";
import { getReviewCountByEmail } from "@/lib/reviews";
import { money } from "@/lib/format";
import { BANKS, EWALLETS, QRIS, isFilled } from "@/lib/payment";
import { loadSnap } from "@/lib/snap";
import { Icon } from "./Icons";
import KelolaProduk from "./KelolaProduk";

const METHOD_LABEL = {
  qris: "QRIS",
  transfer: "Transfer Bank",
  ewallet: "E-Wallet",
  cod: "COD",
};

// Batas waktu bayar 20 menit, sama kayak di checkout.
const PAY_WINDOW_MS = 20 * 60 * 1000;

function mmss(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return (m < 10 ? "0" + m : "" + m) + ":" + (r < 10 ? "0" + r : "" + r);
}

// Tier loyalty: 1 poin = Rp 1.000 belanja.
const TIERS = [
  { name: "Bronze", min: 0, color: "#cd7f32" },
  { name: "Silver", min: 50, color: "#9aa0a6" },
  { name: "Gold", min: 150, color: "#f4a825" },
];

const STEPS = ["Dibayar", "Diproses", "Dikirim", "Selesai"];

// Pesanan dianggap dibayar kalau statusnya Dibayar / Dikirim / Selesai.
// COD baru dianggap dibayar kalau udah Selesai.
// Dibayar = Dibayar / Diproses / Dikirim / Selesai. COD baru pas Selesai.
function isPaid(arg) {
  const o = arg && typeof arg === "object" ? arg : { status: arg };
  const s = String(o.status || "").toLowerCase();
  if (s.includes("batal") || s.includes("belum") || s.includes("menunggu"))
    return false;
  if (o.method === "cod") return s.includes("selesai");
  return (
    s.includes("dibayar") ||
    s.includes("diproses") ||
    s.includes("dikirim") ||
    s.includes("selesai")
  );
}

// Pembeli cuma lihat tombol Bayar Sekarang kalau memang belum bayar.
function needsPay(o) {
  if (!o || o.method === "cod") return false;
  const s = String(o.status || "").toLowerCase();
  if (s.includes("batal")) return false;
  return s.includes("belum") || s.includes("menunggu");
}

// Admin cuma butuh 1 tombol: status berikutnya dari status sekarang.
function nextStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("batal") || s.includes("selesai")) return "";
  if (s.includes("dikirim")) return "Selesai";
  if (s.includes("diproses")) return "Dikirim";
  if (s.includes("dibayar")) return "Diproses";
  return "Dibayar";
}

// Label pembatalan biar pembeli tahu siapa yang batalin.
function cancelLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("penjual")) return "Dibatalkan oleh Penjual";
  if (s.includes("waktu")) return "Dibatalkan (Waktu Bayar Habis)";
  return "Pesanan Dibatalkan";
}
function dateStr(ts) {
  try {
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "";
  }
}

function stepIndex(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("selesai") || s.includes("berhasil")) return 3;
  if (s.includes("dikirim")) return 2;
  if (s.includes("diproses")) return 1;
  if (s.includes("belum")) return -1;
  if (s.includes("dibayar")) return 0;
  return 1;
}

// Titik-titik progres status pesanan. Kalau dibatalkan, tampilkan label khusus.
function OrderSteps({ status }) {
  if (isOrderCancelled(status)) {
    return <span className="dash-cancelled-tag">{cancelLabel(status)}</span>;
  }
  const idx = stepIndex(status);
  return (
    <div className="dash-steps">
      {STEPS.map((label, i) => (
        <div
          key={label}
          className={"dash-step" + (i < idx ? " done" : i === idx ? " on" : "")}
        >
          <span className="dot" />
          {label}
        </div>
      ))}
    </div>
  );
}

export default function ProfileDashboard() {
  const {
    dashboardOpen,
    dashboardSection,
    setDashboardSection,
    closeDashboard,
    openProfile,
    openChat,
    openProduct,
    showToast,
  } = useUI();
  const { user, isAdmin, logout } = useAuth();
  const { setActiveRoom } = useChat();
  const { products } = useProducts();
  const [, setTick] = useState(0);
  const [loyTab, setLoyTab] = useState("riwayat");
  const [payOrder, setPayOrder] = useState(null);
  const [payLeft, setPayLeft] = useState(0);
  const [payBusy, setPayBusy] = useState(false);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("syk-orders-update", h);
    window.addEventListener("syk-reviews-update", h);
    return () => {
      window.removeEventListener("syk-orders-update", h);
      window.removeEventListener("syk-reviews-update", h);
    };
  }, []);

  // Hitung mundur bayar buat pesanan yang dibuka dari tombol Bayar Sekarang.
  useEffect(() => {
    if (!payOrder) return;
    const exp = payOrder.expiresAt || (payOrder.ts || 0) + PAY_WINDOW_MS;
    const tick = () => {
      const ms = exp - Date.now();
      setPayLeft(Math.ceil(Math.max(0, ms) / 1000));
      if (ms <= 0 && user && user.email) {
        updateOrderStatus(
          user.email,
          payOrder.id,
          "Dibatalkan (Waktu Bayar Habis)",
        );
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [payOrder, user]);

  // Bayar online lewat Midtrans Snap.
  const payOnline = async () => {
    if (!payOrder || payBusy) return;
    setPayBusy(true);
    try {
      const res = await fetch("/api/pay/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: payOrder.id,
          roomId: user && user.email ? user.email : "",
        }),
      });
      const out = await res.json();
      if (!out.ok || !out.token) {
        throw new Error(out.error || "Gagal buka pembayaran.");
      }
      const snap = await loadSnap(out.clientKey);
      if (!snap) {
        if (out.redirect_url) {
          window.open(out.redirect_url, "_blank");
          setPayBusy(false);
          return;
        }
        throw new Error("Gagal memuat halaman pembayaran.");
      }
      setPayBusy(false);
      snap.pay(out.token, {
        onSuccess: () => {
          showToast("Pembayaran berhasil! Status pesanan otomatis diperbarui.");
          setPayOrder(null);
        },
        onPending: () => {
          showToast("Pembayaran belum masuk. Status berubah sendiri nanti.");
          setPayOrder(null);
        },
        onError: () => showToast("Pembayaran gagal, coba lagi ya."),
        onClose: () => {},
      });
    } catch (e) {
      showToast(e.message || "Gagal buka pembayaran.");
      setPayBusy(false);
    }
  };

  // Buka detail produk buat kasih rating setelah pesanan selesai.
  const rateItem = (item) => {
    const p = (products || []).find((x) => String(x.id) === String(item.id));
    if (!p) {
      showToast("Produknya udah gak ada di menu.");
      return;
    }
    closeDashboard();
    openProduct(p);
  };

  if (!dashboardOpen || !user) return null;

  const orders = !isAdmin ? getCustomerOrders(user.email).orders || [] : [];
  const totalSpend = orders.reduce((s, o) => s + (o.total || 0), 0);
  const points = Math.floor(totalSpend / 1000);
  const reviewCount = getReviewCountByEmail(user.email);
  const incoming = isAdmin ? getAllIncomingOrders() : [];

  let tier = TIERS[0];
  TIERS.forEach((t) => {
    if (points >= t.min) tier = t;
  });
  const next = TIERS.find((t) => t.min > points);
  const progress = next
    ? Math.min(100, Math.round((points / next.min) * 100))
    : 100;

  // Nav "Pesanan Masuk" cuma buat admin. Kalau pembeli (dashboardSection bisa
  // ke-set "masuk" secara tidak sengaja dari state lama), fallback ke dashboard.
  const section = isAdmin
    ? ["masuk", "produk"].includes(dashboardSection)
      ? dashboardSection
      : "dashboard"
    : dashboardSection || "dashboard";
  const go = (s) => setDashboardSection(s);

  // Buyer: buka chat dengan admin.
  const chatAdmin = () => {
    closeDashboard();
    openChat();
  };

  // Admin: buka chat dengan pembeli tertentu (dari Pesanan Masuk).
  const chatWith = (roomId) => {
    setActiveRoom(roomId);
    closeDashboard();
    openChat();
  };

  const cancelOrder = (orderId) => {
    updateOrderStatus(user.email, orderId, "Dibatalkan");
    showToast("Pesanan dibatalkan.");
  };

  const markDone = (roomId, orderId) => {
    updateOrderStatus(roomId, orderId, "Selesai");
    showToast("Pesanan ditandai selesai.");
  };

  // Admin: ubah status pesanan ke apa aja (termasuk Dibatalkan).
  const setOrderStatus = (roomId, orderId, status) => {
    updateOrderStatus(roomId, orderId, status);
    showToast("Status pesanan diubah jadi " + status + ".");
  };

  // Riwayat poin (buyer): tiap pesanan selesai kasih poin.
  const history = orders
    .filter((o) => isOrderDone(o.status))
    .map((o) => ({
      id: o.id,
      pts: Math.floor((o.total || 0) / 1000),
      ts: o.ts,
    }));

  return (
    <div className="dash-scrim" onClick={closeDashboard}>
      <div className="dash" onClick={(e) => e.stopPropagation()}>
        {payOrder ? (
          <div className="dpay-scrim" onClick={() => setPayOrder(null)}>
            <div className="dpay" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="dpay-x"
                onClick={() => setPayOrder(null)}
                aria-label="Tutup"
              >
                <Icon name="close" />
              </button>
              <div className="dpay-clock">
                <strong>{mmss(payLeft)}</strong>
                <small>sisa waktu bayar</small>
              </div>
              <h3 className="serif">Bayar Pesanan #{payOrder.id}</h3>
              <p className="dpay-total">
                Total <strong>{money(payOrder.total || 0)}</strong>
                {" \u00b7 "}
                {METHOD_LABEL[payOrder.method] || payOrder.method}
              </p>

              {payLeft <= 0 ? (
                <div className="dpay-bad">
                  Waktu pembayaran habis. Pesanan ini otomatis dibatalkan,
                  silakan pesan lagi ya.
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="dpay-btn dpay-online"
                    onClick={payOnline}
                    disabled={payBusy}
                  >
                    <Icon name="card" />{" "}
                    {payBusy ? "Membuka pembayaran..." : "Bayar Online"}
                  </button>
                  <div className="dpay-hint">
                    QRIS, GoPay, ShopeePay, Virtual Account, kartu, minimarket.
                    Status pesanan berubah sendiri begitu pembayaran masuk.
                  </div>
                  <div className="dpay-or">atau bayar manual</div>

                  {payOrder.method === "qris" ? (
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

                  {payOrder.method === "transfer" ? (
                    <div className="co-pay">
                      <div className="co-pay-h">Transfer ke</div>
                      {BANKS.filter((b) => isFilled(b.number)).map((b) => (
                        <div className="co-pay-row" key={b.bank}>
                          <span>{b.bank}</span>
                          <strong>{b.number}</strong>
                          <small>a.n. {b.holder}</small>
                        </div>
                      ))}
                      {!BANKS.filter((b) => isFilled(b.number)).length ? (
                        <div className="co-pay-empty">
                          Nomor rekening belum diisi admin. Chat admin dulu ya.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {payOrder.method === "ewallet" ? (
                    <div className="co-pay">
                      <div className="co-pay-h">Kirim ke</div>
                      {EWALLETS.filter((w) => isFilled(w.number)).map((w) => (
                        <div className="co-pay-row" key={w.name}>
                          <span>{w.name}</span>
                          <strong>{w.number}</strong>
                          <small>a.n. {w.holder}</small>
                        </div>
                      ))}
                      {!EWALLETS.filter((w) => isFilled(w.number)).length ? (
                        <div className="co-pay-empty">
                          Nomor e-wallet belum diisi admin. Chat admin dulu ya.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {String(payOrder.status || "")
                    .toLowerCase()
                    .includes("menunggu") ? (
                    <div className="dpay-ok">
                      Bukti bayar kamu sedang dicek admin. Status pesanan
                      berubah sendiri begitu pembayaran masuk.
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="dpay-btn"
                      onClick={() => {
                        updateOrderStatus(
                          user.email,
                          payOrder.id,
                          "Menunggu Konfirmasi",
                        );
                        setPayOrder(
                          Object.assign({}, payOrder, {
                            status: "Menunggu Konfirmasi",
                          }),
                        );
                        showToast("Makasih! Pembayaran kamu sedang dicek.");
                      }}
                    >
                      <Icon name="check" /> Saya Sudah Bayar
                    </button>
                  )}

                  <button
                    type="button"
                    className="dpay-later"
                    onClick={() => setPayOrder(null)}
                  >
                    Nanti aja
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        <button
          className="dash-x icon-btn"
          onClick={closeDashboard}
          aria-label="Tutup"
        >
          <Icon name="close" />
        </button>

        <aside className="dash-side">
          <button
            className="dash-back"
            onClick={closeDashboard}
            aria-label="Kembali ke website"
          >
            <span aria-hidden="true">{"\u2190"}</span> Kembali
          </button>
          <div className="dash-brand">Syakilla Juice</div>
          <div className="dash-brand-sub">
            Kelola akun, pesanan, dan poin kamu di satu tempat.
          </div>
          <nav className="dash-nav">
            <button
              className={section === "dashboard" ? "on" : ""}
              onClick={() => go("dashboard")}
            >
              <Icon name="user" /> Dashboard
            </button>
            {!isAdmin ? (
              <>
                <button
                  className={section === "pesanan" ? "on" : ""}
                  onClick={() => go("pesanan")}
                >
                  <Icon name="wallet" /> Pesanan Saya
                </button>
                <button
                  className={section === "loyalty" ? "on" : ""}
                  onClick={() => go("loyalty")}
                >
                  <Icon name="sparkle" /> Hadiah Member
                </button>
              </>
            ) : (
              <button
                className={section === "masuk" ? "on" : ""}
                onClick={() => go("masuk")}
              >
                <Icon name="inbox" /> Pesanan Masuk
                {incoming.length ? " (" + incoming.length + ")" : ""}
              </button>
            )}
            <button onClick={openProfile}>
              <Icon name="edit" /> Pengaturan Akun
            </button>
            {isAdmin ? (
              <button
                className={section === "produk" ? "on" : ""}
                onClick={() => go("produk")}
              >
                <Icon name="store" /> Kelola Produk
              </button>
            ) : null}
            <button
              className="dash-logout"
              onClick={() => {
                closeDashboard();
                logout();
              }}
            >
              <Icon name="logout" /> Keluar
            </button>
          </nav>
        </aside>

        <div className="dash-main">
          {section === "produk" && isAdmin ? <KelolaProduk /> : null}
          {section === "dashboard" ? (
            <>
              <h3 className="serif">Dashboard</h3>
              <div className="dash-user">
                <div className={"dash-ava" + (user.photo ? "" : " mono")}>
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="dash-user-txt">
                  <strong>{user.name}</strong>
                  <span className="dash-badge">
                    {isAdmin ? "Administrator" : tier.name + " Member"}
                  </span>
                </div>
                <button className="btn-ghost dash-edit" onClick={openProfile}>
                  <Icon name="edit" /> Edit Profil
                </button>
              </div>

              {!isAdmin ? (
                <>
                  <div className="dash-poin">
                    <div className="dash-poin-main">
                      <div className="dash-poin-lbl">POIN SYAKILLA</div>
                      <div className="dash-poin-num">
                        {points} <span>Poin</span>
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>
                        Total belanja {money(totalSpend)}
                      </div>
                      <button
                        className="dash-poin-btn"
                        onClick={() =>
                          showToast("Fitur tukar poin segera hadir!")
                        }
                      >
                        <Icon name="sparkle" /> Tukar Poin
                      </button>
                    </div>
                    <div className="dash-poin-tier">
                      <b style={{ color: tier.color }}>{tier.name} Member</b>
                      {next ? (
                        <>
                          Kurang {next.min - points} poin lagi ke {next.name}
                          <div className="dash-bar">
                            <span style={{ width: progress + "%" }} />
                          </div>
                        </>
                      ) : (
                        "Tier tertinggi. Mantap!"
                      )}
                      <button
                        className="dash-level-link"
                        onClick={() => go("loyalty")}
                      >
                        Lihat Level Lainnya
                      </button>
                    </div>
                  </div>

                  <div className="dash-stats">
                    <div className="dash-stat">
                      <Icon name="wallet" />
                      <div>
                        <b>{orders.length}</b>
                        <small>Total Pesanan</small>
                      </div>
                    </div>
                    <div className="dash-stat">
                      <Icon name="sparkle" />
                      <div>
                        <b>{reviewCount}</b>
                        <small>Ulasan Diberikan</small>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rv-note">
                    Pantau pesanan pembeli lewat menu{" "}
                    <strong>Pesanan Masuk</strong>, dan balas chat mereka lewat
                    tombol chat di header.
                  </div>
                  <div className="dash-stats">
                    <div className="dash-stat">
                      <Icon name="inbox" />
                      <div>
                        <b>{incoming.length}</b>
                        <small>Total Pesanan Masuk</small>
                      </div>
                    </div>
                    <div className="dash-stat">
                      <Icon name="wallet" />
                      <div>
                        <b>
                          {
                            incoming.filter((x) => isOrderDone(x.order.status))
                              .length
                          }
                        </b>
                        <small>Pesanan Selesai</small>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}

          {section === "pesanan" && !isAdmin ? (
            <>
              <h3 className="serif">Pesanan Saya</h3>
              {!orders.length ? (
                <div className="tx-empty">
                  Belum ada transaksi. Yuk pesan jus favoritmu!
                </div>
              ) : (
                <div className="tx-list">
                  {orders.map((o) => {
                    const done = isOrderDone(o.status);
                    const cancelled = isOrderCancelled(o.status);
                    return (
                      <div className="dash-order-card" key={o.id}>
                        <div className="dash-order-top">
                          <strong>#{o.id}</strong>
                          <span
                            className={"tx-status " + (done ? "done" : "proc")}
                          >
                            {o.status || "Diproses"}
                          </span>
                        </div>
                        <div className="tx-items">
                          {(o.items || [])
                            .map((it) => it.name + " x" + it.qty)
                            .join(", ")}
                        </div>
                        <OrderSteps status={o.status} />
                        <div className="tx-foot">
                          <span>
                            {money(o.total || 0)} ·{" "}
                            {METHOD_LABEL[o.method] || o.method}
                          </span>
                          <span className="tx-date">{dateStr(o.ts)}</span>
                        </div>
                        {!done && !cancelled ? (
                          <div className="dash-earn-note">
                            Dapat +{Math.floor((o.total || 0) / 1000)} poin
                            setelah pesanan selesai
                          </div>
                        ) : null}
                        {done ? (
                          <div className="dash-rate-row">
                            <span className="dash-rate-h">
                              Udah selesai! Kasih rating minumannya:
                            </span>
                            {(o.items || []).map((it) => (
                              <button
                                type="button"
                                key={it.id}
                                className="dash-rate-btn"
                                onClick={() => rateItem(it)}
                              >
                                {"\u2605"} Nilai {it.name}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <div className="dash-order-actions">
                          <button className="dash-chat-btn" onClick={chatAdmin}>
                            <Icon name="chat" /> Chat Admin
                          </button>
                          {needsPay(o) ? (
                            <button
                              className="dash-pay-btn"
                              onClick={() => setPayOrder(o)}
                            >
                              <Icon name="card" /> Bayar Sekarang
                            </button>
                          ) : null}
                          {!done && !cancelled ? (
                            <button
                              className="dash-cancel-btn"
                              onClick={() => cancelOrder(o.id)}
                            >
                              <Icon name="close" /> Batalkan Pesanan
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}

          {section === "masuk" && isAdmin ? (
            <>
              <h3 className="serif">Pesanan Masuk</h3>
              <div className="dash-realtime-note">
                Pesanan dari pembeli untuk semua produk. Update otomatis
                (realtime).
              </div>
              {!incoming.length ? (
                <div className="dash-empty-ill">
                  <span className="ico">
                    <Icon name="inbox" />
                  </span>
                  Belum ada pesanan masuk. Pesanan baru muncul otomatis di sini.
                </div>
              ) : (
                <div className="tx-list">
                  {incoming.map(({ roomId, customer, order: o }) => {
                    const done = isOrderDone(o.status);
                    const cancelled = isOrderCancelled(o.status);
                    return (
                      <div
                        className="dash-order-card"
                        key={roomId + "_" + o.id}
                      >
                        <div className="dash-order-top">
                          <div>
                            <strong>#{o.id}</strong>
                            <div className="dash-order-buyer">
                              {(customer && customer.name) || roomId}
                            </div>
                          </div>
                          <span
                            className={"tx-status " + (done ? "done" : "proc")}
                          >
                            {o.status || "Diproses"}
                          </span>
                        </div>
                        <div className="tx-items">
                          {(o.items || [])
                            .map((it) => it.name + " x" + it.qty)
                            .join(", ")}
                        </div>
                        <OrderSteps status={o.status} />
                        <div className="tx-foot">
                          <span>
                            {money(o.total || 0)} ·{" "}
                            {METHOD_LABEL[o.method] || o.method}
                          </span>
                          <span className="tx-date">{dateStr(o.ts)}</span>
                        </div>
                        <div className="ord-pay">
                          <span
                            className={
                              "ord-pay-tag" + (isPaid(o) ? " ok" : " wait")
                            }
                          >
                            {isPaid(o) ? "Sudah Dibayar" : "Belum Dibayar"}
                          </span>
                          <small>
                            {o.method === "cod"
                              ? "COD, dibayar pas pesanan diterima"
                              : "Cek bukti transfer di chat pembeli"}
                          </small>
                        </div>

                        {nextStatus(o.status) ? (
                          <div className="ord-sts">
                            <span className="ord-sts-h">
                              Status sekarang: {o.status || "Belum Dibayar"}
                            </span>
                            <button
                              type="button"
                              className="ord-next-btn"
                              onClick={() =>
                                setOrderStatus(roomId, o.id, nextStatus(o.status))
                              }
                            >
                              <Icon name="check" /> Tandai {nextStatus(o.status)}
                            </button>
                          </div>
                        ) : null}

                        <div className="dash-order-actions">
                          <button
                            className="dash-chat-btn"
                            onClick={() => chatWith(roomId)}
                          >
                            <Icon name="chat" /> Chat Pembeli
                          </button>
                          {!done && !cancelled ? (
                            <button
                              className="dash-mark-btn"
                              onClick={() => markDone(roomId, o.id)}
                            >
                              <Icon name="check" /> Tandai Selesai
                            </button>
                          ) : null}
                          {!cancelled ? (
                            <button
                              className="dash-cancel-btn"
                              onClick={() =>
                                setOrderStatus(
                                  roomId,
                                  o.id,
                                  "Dibatalkan oleh Penjual",
                                )
                              }
                            >
                              <Icon name="close" /> Batalkan Pesanan
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}

          {section === "loyalty" && !isAdmin ? (
            <>
              <div className="dash-welcome">
                <h4>Selamat Datang Kembali, {user.name}</h4>
                <div className="dash-poin-num">
                  {points} <span>Poin</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                  {tier.name} Member
                  {next
                    ? " · Kurang " +
                      (next.min - points) +
                      " poin lagi ke " +
                      next.name
                    : " · Tier tertinggi"}
                </div>
                {next ? (
                  <div className="dash-bar" style={{ marginTop: 10 }}>
                    <span style={{ width: progress + "%" }} />
                  </div>
                ) : null}
              </div>

              <div className="dash-tabs">
                <button
                  className={loyTab === "riwayat" ? "on" : ""}
                  onClick={() => setLoyTab("riwayat")}
                >
                  Riwayat Poin
                </button>
                <button
                  className={loyTab === "tukar" ? "on" : ""}
                  onClick={() => setLoyTab("tukar")}
                >
                  Tukar Poin
                </button>
              </div>

              {loyTab === "riwayat" ? (
                history.length ? (
                  <div>
                    {history.map((h) => (
                      <div className="dash-history-item" key={h.id}>
                        <span>
                          Poin dari pesanan #{h.id}
                          <br />
                          <small style={{ color: "var(--muted)" }}>
                            {dateStr(h.ts)}
                          </small>
                        </span>
                        <span className="dash-history-pts">+{h.pts} poin</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-history-empty">
                    Belum ada riwayat poin.
                  </div>
                )
              ) : (
                <div className="dash-history-empty">
                  Belum ada hadiah yang bisa ditukar saat ini. Kumpulin terus
                  poinmu ya!
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}