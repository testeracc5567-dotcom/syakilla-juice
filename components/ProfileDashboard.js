"use client";
import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import {
  getCustomerOrders,
  getAllIncomingOrders,
  isOrderDone,
  isOrderCancelled,
  updateOrderStatus,
} from "@/lib/orders";
import { getReviewCountByEmail } from "@/lib/reviews";
import { money } from "@/lib/format";
import { Icon } from "./Icons";
import KelolaProduk from "./KelolaProduk";

const METHOD_LABEL = {
  transfer: "Transfer Bank",
  ewallet: "E-Wallet",
  cod: "COD",
};

// Tier loyalty: 1 poin = Rp 1.000 belanja.
const TIERS = [
  { name: "Bronze", min: 0, color: "#cd7f32" },
  { name: "Silver", min: 50, color: "#9aa0a6" },
  { name: "Gold", min: 150, color: "#f4a825" },
];

const STEPS = ["Dibayar", "Diproses", "Dikirim", "Selesai"];

// Pesanan dianggap dibayar kalau statusnya Dibayar / Dikirim / Selesai.
// COD baru dianggap dibayar kalau udah Selesai.
function isPaid(o) {
  const s = String((o && o.status) || "").toLowerCase();
  if (s.includes("batal") || s.includes("belum")) return false;
  if (o && o.method === "cod") return s.includes("selesai");
  return s.includes("dibayar") || s.includes("dikirim") || s.includes("selesai");
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
    return <span className="dash-cancelled-tag">Pesanan Dibatalkan</span>;
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
    showToast,
  } = useUI();
  const { user, isAdmin, logout } = useAuth();
  const { setActiveRoom } = useChat();
  const [, setTick] = useState(0);
  const [loyTab, setLoyTab] = useState("riwayat");

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("syk-orders-update", h);
    window.addEventListener("syk-reviews-update", h);
    return () => {
      window.removeEventListener("syk-orders-update", h);
      window.removeEventListener("syk-reviews-update", h);
    };
  }, []);

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
                        <div className="dash-order-actions">
                          <button className="dash-chat-btn" onClick={chatAdmin}>
                            <Icon name="chat" /> Chat Admin
                          </button>
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

                        <div className="ord-sts">
                          <span className="ord-sts-h">
                            Klik buat ubah status:
                          </span>
                          <div className="ord-sts-btns">
                            {STEPS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className={
                                  "ord-sts-btn" +
                                  (String(o.status || "") === s ? " on" : "")
                                }
                                onClick={() => setOrderStatus(roomId, o.id, s)}
                              >
                                {s}
                              </button>
                            ))}
                            <button
                              type="button"
                              className={
                                "ord-sts-btn cancel" + (cancelled ? " on" : "")
                              }
                              onClick={() =>
                                setOrderStatus(roomId, o.id, "Dibatalkan")
                              }
                            >
                              Dibatalkan
                            </button>
                          </div>
                        </div>

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