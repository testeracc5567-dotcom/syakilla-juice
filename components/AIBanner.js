"use client";
import { useUI } from "@/context/UIContext";
import { Icon } from "./Icons";
import Photo from "./Photo";
import { aiPhoto } from "@/lib/photos";

export default function AIBanner() {
  const { openAI } = useUI();
  return (
    <section className="ai-promo">
      <div className="wrap ai-promo-inner">
        <div className="ai-promo-media">
          <Photo src={aiPhoto()} alt="Syakilla Bot" fallback="ak_special" />
          <span className="ai-promo-badge">
            <Icon name="bot" />
          </span>
        </div>
        <div className="ai-promo-txt">
          <span className="eyebrow">Syakilla Bot &middot; AI Assistant</span>
          <h2 className="serif">Bingung mau pesan apa? Tanya Syakilla Bot aja!</h2>
          <p>
            Asisten AI kami siap bantu 24 jam nonstop: rekomendasi menu, cek
            harga, info promo, cara pesan, sampai lokasi. Dibalas cepat, nggak
            pakai nunggu lama.
          </p>
          <button className="btn-primary" onClick={openAI}>
            <Icon name="sparkle" /> Ngobrol sama Syakilla Bot
          </button>
        </div>
      </div>
    </section>
  );
}