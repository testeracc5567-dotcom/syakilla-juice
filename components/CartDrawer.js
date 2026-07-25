"use client";
import SITE from "@/lib/data";
import { useUI } from "@/context/UIContext";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { money } from "@/lib/format";
import { productDataUri } from "./Illustration";
import { Icon } from "./Icons";

export default function CartDrawer() {
  const { cartOpen, closeCart, openCheckout, openAuth, showToast } = useUI();
  const { user } = useAuth();
  const { cart, changeQty, remove, subtotal, P } = useStore();
  const entries = Object.entries(cart);

  // Wajib login dulu sebelum pesan, biar pesanan bisa dijangkau Admin/Penjual.
  const requireLogin = () => {
    if (user) return true;
    closeCart();
    showToast("Silakan masuk / daftar dulu sebelum memesan ya.");
    openAuth();
    return false;
  };

  const goCheckout = () => {
    if (!requireLogin()) return;
    openCheckout();
  };

  const wa = () => {
    if (!requireLogin()) return;
    const lines = entries.map(([id, q]) => {
      const p = P(id);
      return "- " + p.name + " x" + q + " (" + money(p.price * q) + ")";
    });
    const msg =
      SITE.cart.waIntro +
      "\n" +
      lines.join("\n") +
      "\n\nTotal: " +
      money(subtotal);
    const url =
      "https://wa.me/" +
      SITE.cart.whatsappNumber +
      "?text=" +
      encodeURIComponent(msg);
    if (typeof window !== "undefined") window.open(url, "_blank");
  };

  return (
    <>
      <div
        className={"scrim" + (cartOpen ? " open" : "")}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside className={"drawer" + (cartOpen ? " open" : "")}>
        <div className="drawer-head">
          <h3 className="serif">Keranjang</h3>
          <button className="icon-btn" aria-label="Tutup" onClick={closeCart}>
            <Icon name="close" />
          </button>
        </div>

        <div className="drawer-items">
          {entries.length === 0 ? (
            <div className="empty">
              <div className="ic">
                <Icon name="cart" />
              </div>
              <p>Keranjang masih kosong.</p>
            </div>
          ) : (
            entries.map(([id, q]) => {
              const p = P(id);
              if (!p) return null;
              return (
                <div className="ci" key={id}>
                  <img
                    className="ci-img"
                    src={productDataUri(p.img)}
                    alt={p.name}
                  />
                  <div className="ci-info">
                    <h4>{p.name}</h4>
                    <div className="c">{p.cat}</div>
                    <div className="p">{money(p.price)}</div>
                    <div className="ci-qty">
                      <button
                        onClick={() => changeQty(id, -1)}
                        aria-label="Kurangi"
                      >
                        &minus;
                      </button>
                      <span>{q}</span>
                      <button
                        onClick={() => changeQty(id, 1)}
                        aria-label="Tambah"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button className="ci-remove" onClick={() => remove(id)}>
                    Hapus
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="drawer-foot">
          <div className="tot-row">
            <span>Total</span>
            <span className="t">{money(subtotal)}</span>
          </div>
          <button
            className="checkout-btn"
            disabled={entries.length === 0}
            onClick={goCheckout}
          >
            Checkout &amp; Bayar
          </button>
          <button
            className="wa-btn"
            disabled={entries.length === 0}
            onClick={wa}
          >
            <Icon name="whatsapp" /> Pesan via WhatsApp
          </button>
          <small>Pilih bayar online atau lewat WhatsApp.</small>
        </div>
      </aside>
    </>
  );
}