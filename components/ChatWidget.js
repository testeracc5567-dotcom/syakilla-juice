"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { getCustomerOrders, updateOrderStatus, isOrderDone } from "@/lib/orders";
import { money } from "@/lib/format";
import { Icon } from "./Icons";

const METHOD_LABEL = {
  transfer: "Transfer Bank",
  ewallet: "E-Wallet",
  cod: "Bayar di Tempat (COD)",
};

function timeStr(ts) {
  try {
    return new Date(ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

function dateStr(ts) {
  try {
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch (e) {
    return "";
  }
}

// Label "terakhir online" buat admin.
function lastSeenLabel(ts) {
  if (!ts) return "Belum pernah online";
  const diff = Date.now() - ts;
  if (diff < 60000) return "Baru aja aktif";
  if (diff < 3600000) return "Aktif " + Math.floor(diff / 60000) + " menit lalu";
  if (diff < 86400000) return "Aktif " + Math.floor(diff / 3600000) + " jam lalu";
  return "Terakhir online " + dateStr(ts);
}

function initial(name) {
  return (name || "P").charAt(0).toUpperCase();
}

function readProfile(email) {
  if (typeof window === "undefined" || !email) return null;
  try {
    const all = JSON.parse(localStorage.getItem("syk_profiles_v1") || "{}");
    return all[email] || null;
  } catch (e) {
    return null;
  }
}

// Panel kanan (admin): profil + riwayat pesanan pembeli.
function ProfilePanel({ roomId, buyerName }) {
  const info = getCustomerOrders(roomId);
  const orders = info.orders || [];
  const cust = info.customer || {};
  const profile = readProfile(roomId);
  const photo = profile && profile.photo;
  const phone = cust.phone || (profile && profile.phone) || "";
  let address = cust.address || "";
  if (!address && profile && profile.addresses && profile.addresses.length) {
    const sel =
      profile.addresses.find((a) => a.id === profile.selectedAddressId) ||
      profile.addresses[0];
    address = sel ? sel.detail : "";
  }

  return (
    <div className="dm-profile">
      <div className="dm-prof-top">
        <div className="dm-prof-ava">
          {photo ? <img src={photo} alt={buyerName} /> : initial(buyerName)}
        </div>
        <h4>{buyerName}</h4>
        <div className="dm-prof-tag">{roomId}</div>
      </div>
      {phone ? (
        <div className="dm-prof-row">
          <Icon name="phone" />
          <span>
            <strong>Telepon</strong>
            {phone}
          </span>
        </div>
      ) : null}
      {address ? (
        <div className="dm-prof-row">
          <Icon name="pin" />
          <span>
            <strong>Alamat</strong>
            {address}
          </span>
        </div>
      ) : null}
      <div className="dm-prof-sec-title">Riwayat Pesanan</div>
      {orders.length ? (
        orders.map((o) => (
          <div className="dm-order" key={o.id}>
            <div className="dm-order-head">
              <strong>#{o.id}</strong>
              <span
                className={
                  "dm-order-status" + (isOrderDone(o.status) ? " done" : "")
                }
              >
                {o.status || "Diproses"}
              </span>
            </div>
            <div className="dm-order-items">
              {(o.items || []).map((it) => it.name + " x" + it.qty).join(", ")}
            </div>
            <div className="dm-order-total">
              {money(o.total || 0)}{" "}
              <span className="dm-order-meta">
                · {METHOD_LABEL[o.method] || o.method} · {dateStr(o.ts)}
              </span>
            </div>
            {!isOrderDone(o.status) ? (
              <button
                className="dm-done-btn"
                onClick={() => updateOrderStatus(roomId, o.id, "Selesai")}
              >
                <Icon name="check" /> Tandai Selesai
              </button>
            ) : null}
          </div>
        ))
      ) : (
        <div className="dm-none">Belum ada pesanan.</div>
      )}
    </div>
  );
}

export default function ChatWidget() {
  const { isAdmin } = useAuth();
  const { chatOpen, closeChat } = useUI();
  const {
    rooms,
    myMessages,
    activeRoom,
    setActiveRoom,
    sendMessage,
    adminOnline,
    isRoomOnline,
    roomLastSeen,
  } = useChat();
  const [text, setText] = useState("");
  const bodyRef = useRef(null);

  const activeRoomObj =
    isAdmin && activeRoom ? rooms.find((r) => r.id === activeRoom) : null;
  const adminMsgs = activeRoomObj ? activeRoomObj.messages || [] : [];
  const msgs = isAdmin ? adminMsgs : myMessages;

  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs.length, chatOpen, activeRoom]);

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (isAdmin) sendMessage(t, { room: activeRoom });
    else sendMessage(t);
    setText("");
  };

  if (!chatOpen) return null;

  // ---------- Tampilan ADMIN ----------
  if (isAdmin) {
    return (
      <>
        <div className="chat-dm-scrim" onClick={closeChat} />
        <div className="chat-dm">
          <div className="dm-head">
            <span className="fab-title">
              <Icon name="chat" /> Chat Pembeli
            </span>
            <button className="icon-btn" onClick={closeChat} aria-label="Tutup">
              <Icon name="close" />
            </button>
          </div>
          <div className="dm-body">
            <div className="dm-list">
              {!rooms.length ? (
                <div className="dm-empty sm">Belum ada chat masuk.</div>
              ) : (
                rooms.map((r) => (
                  <button
                    key={r.id}
                    className={"dm-room" + (r.id === activeRoom ? " on" : "")}
                    onClick={() => setActiveRoom(r.id)}
                  >
                    <span className="dm-ava-wrap">
                      <span className="dm-ava">{initial(r.buyerName)}</span>
                      <span
                        className={
                          "dm-ava-dot" + (isRoomOnline(r.id) ? " on" : "")
                        }
                      />
                    </span>
                    <span className="dm-room-txt">
                      <strong>{r.buyerName}</strong>
                      <small>{r.last ? r.last.text : "\u2014"}</small>
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="dm-thread">
              {!activeRoom ? (
                <div className="dm-empty">Pilih percakapan dulu di kiri.</div>
              ) : (
                <>
                  <div className="dm-thread-head">
                    <span className="dm-ava-wrap">
                      <span className="dm-ava sm">
                        {initial(activeRoomObj && activeRoomObj.buyerName)}
                      </span>
                      <span
                        className={
                          "dm-ava-dot" + (isRoomOnline(activeRoom) ? " on" : "")
                        }
                      />
                    </span>
                    <div className="dm-thread-head-txt">
                      <strong>
                        {activeRoomObj ? activeRoomObj.buyerName : "Pembeli"}
                      </strong>
                      <span className="pres-line">
                        <span
                          className={
                            "pres-dot" + (isRoomOnline(activeRoom) ? " on" : "")
                          }
                        />
                        {isRoomOnline(activeRoom)
                          ? "Online sekarang"
                          : lastSeenLabel(roomLastSeen(activeRoom))}
                      </span>
                    </div>
                  </div>
                  <div className="dm-msgs" ref={bodyRef}>
                    {adminMsgs.map((m) => (
                      <div
                        key={m.id}
                        className={
                          "bubble " + (m.from === "admin" ? "me" : "bot")
                        }
                      >
                        <span>{m.text}</span>
                        <span className="bubble-time">{timeStr(m.ts)}</span>
                      </div>
                    ))}
                  </div>
                  <form className="fab-input" onSubmit={submit}>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Balas pembeli..."
                    />
                    <button
                      className="icon-btn"
                      disabled={!text.trim()}
                      aria-label="Kirim"
                    >
                      <Icon name="send" />
                    </button>
                  </form>
                </>
              )}
            </div>
            {activeRoom ? (
              <ProfilePanel
                roomId={activeRoom}
                buyerName={activeRoomObj ? activeRoomObj.buyerName : "Pembeli"}
              />
            ) : (
              <div className="dm-profile">
                <div className="dm-none">
                  Pilih pembeli buat lihat profil &amp; pesanannya.
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

    // ---------- Tampilan PEMBELI (gaya WhatsApp) ----------
  return (
    <div className="wa">
      <div className="wa-head">
        <button className="wa-back" onClick={closeChat} aria-label="Kembali">
          {"\u2190"}
        </button>
        <span className="wa-ava">
          <Icon name="bot" />
        </span>
        <div className="wa-head-txt">
          <strong>Admin Syakilla Juice</strong>
          <small>{adminOnline ? "online" : "terakhir dilihat baru-baru ini"}</small>
        </div>
        <button className="wa-head-x" onClick={closeChat} aria-label="Tutup">
          <Icon name="close" />
        </button>
      </div>

      <div className="wa-body" ref={bodyRef}>
        <div className="wa-note">
          Pesan kamu dibalas langsung oleh admin Syakilla Juice.
        </div>
        {!myMessages.length ? (
          <div className="wa-row in">
            <div className="wa-b">
              <p className="wa-txt">
                Hai! Ada yang bisa kami bantu? Tulis pesanmu di bawah ya.
              </p>
              <span className="wa-meta">{timeStr(Date.now())}</span>
            </div>
          </div>
        ) : (
          myMessages.map((m) => (
            <div
              key={m.id}
              className={"wa-row " + (m.from === "buyer" ? "out" : "in")}
            >
              <div className="wa-b">
                <p className="wa-txt">{m.text}</p>
                <span className="wa-meta">
                  {timeStr(m.ts)}
                  {m.from === "buyer" ? (
                    <b className="wa-tick">{"\u2713\u2713"}</b>
                  ) : null}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="wa-input" onSubmit={submit}>
        <div className="wa-field">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis pesan"
          />
        </div>
        <button className="wa-send" aria-label="Kirim">
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}