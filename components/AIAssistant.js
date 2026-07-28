"use client";
import { useState, useRef, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { Icon } from "./Icons";
import Photo from "./Photo";
import { aiPhoto } from "@/lib/photos";

// Rekomendasi pertanyaan yang muncul sebagai chip di bawah chat.
const QUICK = [
  "Menu paling laris?",
  "Berapa harga alpukat?",
  "Ada promo hari ini?",
  "Bisa diantar nggak?",
  "Jam buka kapan?",
  "Lokasinya di mana?",
];

// Jawaban cadangan — dipakai HANYA kalau koneksi ke AI (Groq) gagal.
function fallbackReply(msg) {
  const t = (msg || "").toLowerCase();
  if (t.includes("laris") || t.includes("rekomendasi") || t.includes("enak"))
    return "Yang paling laris: Alpukat Kocok Coklat & Chocobar Milkshake! Manis, creamy, bikin nagih.";
  if (t.includes("harga") || t.includes("berapa"))
    return "Harga mulai dari belasan ribu aja. Cek detail tiap produk di halaman Belanja ya.";
  if (t.includes("promo") || t.includes("diskon"))
    return "Lagi ada promo: hemat buat pembelian 2 Es Teh, plus gratis upsize tiap Jumat!";
  if (t.includes("antar") || t.includes("kirim") || t.includes("ongkir") || t.includes("delivery"))
    return "Bisa diantar ke sekitaran Batuphat/Lhokseumawe. Checkout dulu, nanti diarahkan ke WhatsApp buat ongkir.";
  if (t.includes("lokasi") || t.includes("alamat") || t.includes("dimana") || t.includes("di mana"))
    return "Kami di Batuphat Timur, Lhokseumawe, Aceh. Detail + peta ada di halaman Tentang.";
  if (t.includes("jam") || t.includes("buka") || t.includes("tutup"))
    return "Buka setiap hari jam 09.00 - 22.00 WIB. Mampir kapan aja!";
  if (t.includes("bayar") || t.includes("pembayaran"))
    return "Pembayaran bisa transfer bank, e-wallet (DANA/OVO/GoPay), atau COD.";
  return "Waduh, koneksi ke AI-nya lagi ngadat sebentar 🙏 Coba tanya lagi ya.";
}

export default function AIAssistant() {
  const { aiOpen, toggleAI, closeAI } = useUI();
  const [msgs, setMsgs] = useState([
    {
      id: "greet",
      from: "bot",
      text: "Halo! Aku Syakilla Bot 🍹 Mau nanya menu, harga, atau pesanan? Atau sekadar ngobrol / curhat juga boleh kok — santai aja.",
    },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [showQuick, setShowQuick] = useState(true); // buka/tutup Rekomendasi Pertanyaan
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, typing, aiOpen]);

  const push = (from, text) =>
    setMsgs((m) => [
      ...m,
      {
        id: Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        from,
        text,
      },
    ]);

  const ask = async (q) => {
    const question = (q || "").trim();
    if (!question || typing) return;

    const history = [
      ...msgs.map((m) => ({
        role: m.from === "me" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: question },
    ];

    push("me", question);
    setText("");
    setTyping(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setTyping(false);
      push("bot", data && data.reply ? data.reply : fallbackReply(question));
    } catch (e) {
      setTyping(false);
      push("bot", fallbackReply(question));
    }
  };

  return (
    <div className="fab-wrap ai-fab">
      {aiOpen ? (
        <div className="fab-panel ai-panel">
          <div className="fab-head ai-head ai-banner">
            <button
              className="icon-btn ai-x"
              onClick={closeAI}
              aria-label="Tutup"
            >
              <Icon name="close" />
            </button>
            <span className="ai-banner-photo">
              <Photo
                src={aiPhoto()}
                alt="Jus segar Syakilla"
                fallback="ak_special"
              />
            </span>
            <span className="ai-banner-txt">
              <strong>Syakilla Bot</strong>
              <span>
                Tanya apa aja &mdash; menu, harga, promo, atau sekadar ngobrol.
                Dibalas cepat, 24 jam nonstop!
              </span>
            </span>
          </div>
          <div className="fab-body" ref={bodyRef}>
            {msgs.map((m) => (
              <div
                key={m.id}
                className={"bubble " + (m.from === "me" ? "me" : "bot")}
              >
                {m.text}
              </div>
            ))}
            {typing ? <div className="bubble bot typing">...</div> : null}
          </div>
          <div className="ai-quick">
            <button
              type="button"
              onClick={() => setShowQuick((v) => !v)}
              aria-expanded={showQuick}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                font: "inherit",
              }}
            >
              <span className="ai-quick-label">Rekomendasi pertanyaan:</span>
              <span style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>
                {showQuick ? "Sembunyikan \u25B2" : "Tampilkan \u25BC"}
              </span>
            </button>
            {showQuick ? (
              <div className="ai-quick-chips">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <form
            className="fab-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pesan apa aja..."
            />
            <button type="submit" className="icon-btn" aria-label="Kirim">
              <Icon name="send" />
            </button>
          </form>
        </div>
      ) : null}
      <button
        className="fab-btn ai-btn"
        onClick={toggleAI}
        aria-label="AI Assistant"
      >
        <Icon name={aiOpen ? "close" : "bot"} />
      </button>
    </div>
  );
}