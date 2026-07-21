"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SITE from "@/lib/data";
import { Icon } from "./Icons";
import Logo from "./Logo";
import { useUI } from "@/context/UIContext";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";

// Avatar: pakai foto kalau ada, kalau tidak pakai lingkaran huruf awal nama
// (monogram), biar tetap terisi rapi seperti referensi.
function Avatar({ user, size }) {
  const cls = "acct-ava" + (size === "lg" ? " lg" : "");
  if (user && user.photo) {
    return <img className={cls} src={user.photo} alt={user.name} />;
  }
  return (
    <span className={cls + " mono"}>
      {((user && user.name) || "?").charAt(0).toUpperCase()}
    </span>
  );
}

export default function Header() {
  const router = useRouter();
  const {
    openCart,
    startNavLoading,
    openAuth,
    openSearch,
    toggleChat,
    openDashboard,
  } = useUI();
  const { count } = useStore();
  const { user, isAdmin, logout } = useAuth();
  const { rooms } = useChat();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [acct, setAcct] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Badge jumlah chat pembeli (hanya buat admin).
  const chatCount = isAdmin && rooms ? rooms.length : 0;

  // Tiap klik navigasi di Header: loading 1,5 detik dulu, baru pindah halaman.
  const go = (href) => (e) => {
    if (e) e.preventDefault();
    setMobile(false);
    setAcct(false);
    startNavLoading(() => router.push(href));
  };

  const openDash = (section) => {
    setAcct(false);
    setMobile(false);
    openDashboard(section);
  };

  return (
    <>
      <header className={scrolled ? "scrolled" : ""}>
        <div className="wrap nav">
          <a
            href="/"
            aria-label="Beranda"
            className="brand-link"
            onClick={go("/")}
          >
            <Logo />
          </a>
          <nav className="nav-links">
            {SITE.nav.map((n) => (
              <a key={n.label} href={n.href} onClick={go(n.href)}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <button
              className="icon-btn"
              aria-label="Cari produk"
              onClick={openSearch}
            >
              <Icon name="search" />
            </button>

            <button
              className="icon-btn chat-hdr-btn"
              aria-label="Chat dengan Admin"
              onClick={toggleChat}
            >
              <Icon name="chat" />
              {chatCount > 0 ? (
                <span className="cart-badge">{chatCount}</span>
              ) : null}
            </button>

            <div className="acct">
              <button
                className="icon-btn acct-btn"
                aria-label="Akun"
                onClick={() => (user ? setAcct((v) => !v) : openAuth())}
              >
                {user ? <Avatar user={user} /> : <Icon name="user" />}
              </button>
              {user && acct ? (
                <div className="acct-menu">
                  <div className="acct-head">
                    <div className="acct-id">
                      <Avatar user={user} size="lg" />
                      <div className="acct-id-txt">
                        <strong>{user.name}</strong>
                        <span className="acct-email">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => openDash("dashboard")}>
                    <Icon name="user" /> Profil Saya
                  </button>
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setAcct(false);
                        toggleChat();
                      }}
                    >
                      <Icon name="chat" /> Chat Pembeli
                    </button>
                  ) : (
                    <>
                      <button onClick={() => openDash("pesanan")}>
                        <Icon name="wallet" /> Transaksi Anda
                      </button>
                      <button onClick={() => openDash("loyalty")}>
                        <Icon name="sparkle" /> Member Loyalty
                      </button>
                    </>
                  )}
                  <button
                    className="danger"
                    onClick={() => {
                      setAcct(false);
                      logout();
                    }}
                  >
                    <Icon name="logout" /> Keluar
                  </button>
                </div>
              ) : null}
            </div>

            <button
              className="icon-btn cart-btn"
              aria-label="Keranjang"
              onClick={openCart}
            >
              <Icon name="cart" />
              {count > 0 ? <span className="cart-badge">{count}</span> : null}
            </button>
            <button
              className="burger"
              aria-label="Menu"
              onClick={() => setMobile(true)}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>

      <div className={"mobile-menu" + (mobile ? " open" : "")}>
        <div className="mm-head">
          <Logo />
          <button
            className="icon-btn"
            aria-label="Tutup"
            onClick={() => setMobile(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        {SITE.nav.map((n) => (
          <a key={n.label} href={n.href} onClick={go(n.href)}>
            {n.label}
          </a>
        ))}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setMobile(false);
            openSearch();
          }}
        >
          Cari Produk
        </a>
        {!user ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMobile(false);
              openAuth();
            }}
          >
            Masuk / Daftar
          </a>
        ) : (
          <>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                openDash("dashboard");
              }}
            >
              Profil Saya
            </a>
            {isAdmin ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMobile(false);
                  toggleChat();
                }}
              >
                Chat Pembeli
              </a>
            ) : (
              <>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openDash("pesanan");
                  }}
                >
                  Transaksi Anda
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openDash("loyalty");
                  }}
                >
                  Member Loyalty
                </a>
              </>
            )}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMobile(false);
                logout();
              }}
            >
              Keluar ({user.name})
            </a>
          </>
        )}
      </div>
    </>
  );
}