"use client";
import { useUI } from "@/context/UIContext";
import { Icon } from "./Icons";

export default function Toaster() {
  const { toast } = useUI();
  return (
    <div
      className={"toast" + (toast.show ? " show" : "")}
      role="status"
      aria-live="polite"
    >
      <span className="ic">
        <Icon name="leaf" />
      </span>
      <span>{toast.text}</span>
    </div>
  );
}