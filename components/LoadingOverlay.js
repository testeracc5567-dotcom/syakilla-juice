"use client";
import { useUI } from "@/context/UIContext";
import Logo from "./Logo";

export default function LoadingOverlay() {
  const { navLoading } = useUI();
  return (
    <div
      className={"nav-loader" + (navLoading ? " show" : "")}
      aria-hidden={!navLoading}
    >
      <div className="nav-loader-box">
        <span className="nav-loader-logo">
          <Logo />
        </span>
        <span className="nav-loader-text">Memuat halaman...</span>
      </div>
    </div>
  );
}