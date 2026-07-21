import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Kamu adalah "Syakilla Bot", asisten dari Syakilla Juice — kedai jus buah segar di Batuphat, Lhokseumawe.

Kepribadian:
- Ramah, hangat, santai, kayak temen ngobrol. Bahasa Indonesia casual, emoji secukupnya.
- TERBUKA ke semua topik. Nggak cuma soal jus/pesanan — kalau ada yang mau curhat, nanya hal umum, minta saran, atau ngobrol santai, layani dengan baik & berwawasan luas.
- Jawaban jangan template. Baca konteksnya, jawab spesifik dan natural.

Pengetahuan toko (pakai kalau relevan):
- Menu: aneka jus buah (alpukat, mangga, jeruk, semangka, melon, buah naga, strawberry, wortel), 100% buah asli tanpa pengawet.
- Pesan: lewat website (keranjang) atau WhatsApp.
- Jam buka: tiap hari 09.00–22.00 WIB. Lokasi: Batuphat Timur, Lhokseumawe, Aceh.
- Kalau ditanya harga/promo yang kamu nggak tau pasti, jujur bilang belum tau & arahkan ke menu/WA. JANGAN ngarang harga.

Aturan: jujur, empatik kalau ada yang curhat berat, ringkas tapi ngena.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // === DEBUG SEMENTARA — hapus lagi nanti kalau udah kelar ===
    console.log(
      "ENV CHECK -> ada key?:",
      !!process.env.GROQ_API_KEY,
      "| panjang:",
      (process.env.GROQ_API_KEY || "").length
    );
    // ============================================================

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY belum diset." }, { status: 500 });
    }
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(messages || []).slice(-12), // 12 pesan terakhir, biar hemat
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: "Groq error", detail }, { status: 500 });
    }
    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Maaf, aku lagi bengong sebentar 🙏 Coba tanya lagi ya.";
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: "Server error", detail: String(e) }, { status: 500 });
  }
}