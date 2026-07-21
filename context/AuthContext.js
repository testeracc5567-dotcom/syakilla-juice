"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const AuthContext = createContext(null);

// Bikin bentuk "user" yang sama seperti versi lama (localStorage), supaya
// semua komponen lain (Header, ProfileModal, ProfileDashboard, dst) yang
// sudah pakai useAuth() tidak perlu diubah sama sekali.
function mapSessionUser(session) {
  if (!session?.user) return null;
  const u = session.user;
  return {
    name: u.name || "",
    email: u.email || "",
    photo: u.image || "",
    phone: u.phone || "",
    addresses: u.addresses || [],
    selectedAddressId: u.selectedAddressId || null,
    role: u.isAdmin ? "admin" : "buyer",
  };
}

export function AuthProvider({ children }) {
  const { data: session, status, update } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status !== "loading") setReady(true);
  }, [status]);

  const user = mapSessionUser(session);
  const isAdmin = !!session?.user?.isAdmin;

  const login = async (email, password) => {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      return { ok: false, error: "Email atau password salah." };
    }
    return { ok: true };
  };

  const loginWithGoogle = () => {
    signIn("google");
  };

  const register = async (form) => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "Gagal mendaftar." };
      }
      // Habis daftar, langsung login otomatis.
      const loginRes = await login(form.email, form.password);
      return loginRes;
    } catch (e) {
      return { ok: false, error: "Gagal terhubung ke server." };
    }
  };

  const logout = () => {
    signOut({ redirect: false });
  };

  const updateProfile = async (patch) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "Gagal menyimpan profil." };
      }
      await update();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Gagal terhubung ke server." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        isAdmin,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}