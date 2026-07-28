// API otak AI (Groq). Dipanggil sama komponen AIAssistant.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = [
  "Kamu Syakilla Bot, asisten toko jus online Syakilla Juice di Batuphat Timur, Lhokseumawe, Aceh.",
  "Gaya bahasa: Indonesia santai dan ramah, singkat (maksimal 3 kalimat), boleh pakai emoji seperlunya.",
  "Jam buka: setiap hari 09.00-22.00 WIB.",
  "Kategori menu: Alpukat Kocok, Squash, Tea Series, Milkshake Series, Milky Series.",
  "Kisaran harga: Rp 8.000 sampai Rp 15.000 per gelas.",
  "Pembayaran: QRIS, transfer bank, e-wallet, dan COD.",
  "Pengiriman: sekitar Batuphat dan Lhokseumawe.",
  "Kalau ditanya hal di luar toko, tetap layani dengan ramah.",
  "Jangan mengarang stok, promo, atau harga pasti yang tidak kamu ketahui.",
].join(" ");

export async function POST(req) {
  try {
    const key = process.env.GROQ_API_KEY || "";
    if (!key) {
      return NextResponse.json({ error: "GROQ_API_KEY belum diisi." }, { status: 500 });
    }

    const body = await req.json();
    const raw = Array.isArray(body.messages) ? body.messages : [];
    const history = raw
      .filter(function (m) {
        return m && m.content;
      })
      .slice(-12)
      .map(function (m) {
        return {
          role: m.role === "user" ? "user" : "assistant",
          content: String(m.content).slice(0, 2000),
        };
      });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 400,
        messages: [{ role: "system", content: SYSTEM }].concat(history),
      }),
      cache: "no-store",
    });

    const out = await res.json();
    if (!res.ok) {
      const msg = (out && out.error && out.error.message) || "Groq menolak permintaan.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const choice = out && out.choices && out.choices[0];
    const reply = choice && choice.message ? String(choice.message.content || "").trim() : "";
    if (!reply) return NextResponse.json({ error: "Balasan kosong." }, { status: 500 });

    return NextResponse.json({ ok: true, reply: reply });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal menghubungi AI." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, keyTerpasang: !!process.env.GROQ_API_KEY });
}