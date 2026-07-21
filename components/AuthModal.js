"use client";
import { useState } from "react";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "./Icons";

export default function AuthModal() {
  const { authOpen, closeAuth } = useUI();
  const { login, loginWithGoogle, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authOpen) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const res =
      tab === "login"
        ? await login(form.email, form.password)
        : await register(form);
    setLoading(false);
    if (res.ok) {
      closeAuth();
      setForm({ name: "", email: "", password: "" });
    } else {
      setMsg(res.error || "Terjadi kesalahan.");
    }
  };

  const handleGoogle = () => {
    setMsg("");
    loginWithGoogle();
  };

  return (
    <div className="modal-scrim show" onClick={closeAuth}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-x icon-btn"
          onClick={closeAuth}
          aria-label="Tutup"
        >
          <Icon name="close" />
        </button>
        <h3 className="serif">{tab === "login" ? "Masuk" : "Daftar Akun"}</h3>
        <div className="auth-tabs">
          <button
            className={tab === "login" ? "on" : ""}
            onClick={() => {
              setTab("login");
              setMsg("");
            }}
          >
            Masuk
          </button>
          <button
            className={tab === "register" ? "on" : ""}
            onClick={() => {
              setTab("register");
              setMsg("");
            }}
          >
            Daftar
          </button>
        </div>

        <button
          type="button"
          className="btn-google full"
          onClick={handleGoogle}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.26h2.92c1.71-1.57 2.69-3.88 2.69-6.63z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.93v2.33C2.44 15.98 5.48 18 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71V4.96H.93A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.93 4.04l3.04-2.33z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.93 4.96l3.04 2.33C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          Masuk dengan Google
        </button>

        <div className="auth-or">
          <span>atau</span>
        </div>

        <form onSubmit={submit} className="auth-form">
          {tab === "register" ? (
            <label>
              Nama
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Nama kamu"
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="email@contoh.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Password"
            />
          </label>
          {msg ? <div className="auth-msg">{msg}</div> : null}
          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? "Memproses..." : tab === "login" ? "Masuk" : "Buat Akun"}
          </button>
        </form>
        <div className="auth-hint">
          <span>Akun admin demo:</span>
          <code>admin@syakilla.id / admin123</code>
        </div>
      </div>
    </div>
  );
}