"use client";
import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { getReviews, addReview, getRating, hasReviewed } from "@/lib/reviews";
import { getPurchasedProductIds, getSoldCount } from "@/lib/orders";
import { money } from "@/lib/format";
import { Icon } from "./Icons";
import Photo from "./Photo";
import { productImage } from "@/lib/productImage";

function Stars({ value, size }) {
  const full = Math.round(value || 0);
  return (
    <span className={"rv-stars" + (size === "lg" ? " lg" : "")}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "on" : ""}>
          {"\u2605"}
        </span>
      ))}
    </span>
  );
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

export default function ProductModal() {
  const { product, closeProduct, openAuth } = useUI();
  const { add } = useStore();
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const [tab, setTab] = useState("desc");
  const [qty, setQty] = useState(1);
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("syk-reviews-update", h);
    window.addEventListener("syk-orders-update", h);
    return () => {
      window.removeEventListener("syk-reviews-update", h);
      window.removeEventListener("syk-orders-update", h);
    };
  }, []);

  const pid = product && product.id;
  useEffect(() => {
    setTab("desc");
    setQty(1);
    setStars(5);
    setHover(0);
    setText("");
  }, [pid]);

  if (!product) return null;
  const p = product;
  const reviews = getReviews(p.id);
  const rating = getRating(p.id);
  const sold = getSoldCount(p.id);
  const displayAvg = rating.count ? rating.avg : p.stars;
  const purchased = user ? getPurchasedProductIds(user.email) : new Set();
  const eligible = !!user && purchased.has(p.id);
  const already = !!user && hasReviewed(p.id, user.email);
  const stock = Number(p.stock || 0);
  const out = stock <= 0;

  const submit = (e) => {
    e.preventDefault();
    if (!eligible || already) return;
    const t = text.trim();
    if (!t) return;
    addReview(p.id, {
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: user.name,
      email: user.email,
      stars,
      text: t,
      ts: Date.now(),
    });
    setText("");
    setStars(5);
  };

  const addToCart = () => {
    if (out) return;
    const n = Math.min(qty, stock);
    for (let i = 0; i < n; i++) add(p.id);
    closeProduct();
  };

  return (
    <div className="modal-scrim show" onClick={closeProduct}>
      <div className="modal product-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-x icon-btn"
          onClick={closeProduct}
          aria-label="Tutup"
        >
          <Icon name="close" />
        </button>

        <div className="pm-top">
          <div className="pm-media">
            {p.tag ? <span className="tag">{p.tag}</span> : null}
            <Photo
              src={productImage(p)}
              alt={p.name}
              fallback={p.img}
              className="pm-photo"
            />
          </div>
          <div className="pm-info">
            <span className="card-cat">{p.cat}</span>
            <h3 className="serif">{p.name}</h3>
            <div className="pm-rate">
              <Stars value={displayAvg} />
              <span className="pm-rate-txt">
                <b>{Number(displayAvg).toFixed(1)}</b> ({rating.count} ulasan)
              </span>
              <span className="pm-rate-sep">·</span>
              <span className="pm-sold">{sold} terjual</span>
              <span className="pm-rate-sep">{"\u00b7"}</span>
              {out ? (
                <span className="pm-stok out">Stok habis</span>
              ) : (
                <span className="pm-stok">Stok {stock}</span>
              )}
            </div>
            <div className="pm-price-lg">{money(p.price)}</div>

            <div className="pm-qty">
              <span className="pm-qty-label">Jumlah</span>
              <div className="pm-stepper">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Kurangi"
                >
                  {"\u2212"}
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1))}
                  disabled={out || qty >= stock}
                  aria-label="Tambah"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pm-cta">
              <button className="btn-primary" onClick={addToCart} disabled={out}>
                <Icon name="cart" />{" "}
                {out ? "Stok Habis" : "Masukkan Keranjang"}
              </button>
            </div>
          </div>
        </div>

        <div className="pm-tabs">
          <button
            className={tab === "desc" ? "on" : ""}
            onClick={() => setTab("desc")}
          >
            Deskripsi
          </button>
          <button
            className={tab === "reviews" ? "on" : ""}
            onClick={() => setTab("reviews")}
          >
            Ulasan ({rating.count})
          </button>
        </div>

        <div className="pm-tab-body">
          {tab === "desc" ? (
            <p className="pm-tab-desc">{p.desc}</p>
          ) : (
            <div className="pm-reviews">
              {reviews.length ? (
                <div className="rv-list">
                  {reviews.map((r) => (
                    <div className="rv-item" key={r.id}>
                      <div className="rv-head">
                        <span className="rv-ava">
                          {(r.name || "P").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{r.name}</strong>
                          <Stars value={r.stars} />
                        </div>
                        <span className="rv-date">{dateStr(r.ts)}</span>
                      </div>
                      <p>{r.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rv-empty">
                  Belum ada ulasan. Jadilah yang pertama!
                </div>
              )}

              {!user ? (
                <div className="rv-note">
                  Masuk dulu buat kasih ulasan.{" "}
                  <button
                    className="link-gold"
                    onClick={() => {
                      closeProduct();
                      openAuth();
                    }}
                  >
                    Masuk
                  </button>
                </div>
              ) : already ? (
                <div className="rv-note">
                  Makasih! Kamu udah kasih ulasan buat produk ini.
                </div>
              ) : eligible ? (
                <form className="rv-form" onSubmit={submit}>
                  <div className="rv-form-title">Tulis ulasanmu</div>
                  <div className="rv-star-pick">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        type="button"
                        key={i}
                        className={(hover || stars) >= i ? "on" : ""}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setStars(i)}
                        aria-label={i + " bintang"}
                      >
                        {"\u2605"}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Gimana rasanya? Ceritain dong..."
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!text.trim()}
                  >
                    Kirim Ulasan
                  </button>
                </form>
              ) : (
                <div className="rv-note">
                  Ulasan cuma bisa ditulis pembeli yang pesanannya udah{" "}
                  <strong>Selesai</strong>. Yuk pesan dulu!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}