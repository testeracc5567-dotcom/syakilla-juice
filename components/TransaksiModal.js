"use client";
import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { getCustomerOrders, isOrderDone } from "@/lib/orders";
import { money } from "@/lib/format";
import { Icon } from "./Icons";

const METHOD_LABEL = {
  transfer: "Transfer Bank",
  ewallet: "E-Wallet",
  cod: "COD",
};

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

export default function TransaksiModal() {
  const { ordersOpen, closeOrders } = useUI();
  const { user } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("syk-orders-update", h);
    return () => window.removeEventListener("syk-orders-update", h);
  }, []);

  if (!ordersOpen) return null;
  const orders = user ? getCustomerOrders(user.email).orders : [];

  return (
    <div className="modal-scrim show" onClick={closeOrders}>
      <div className="modal tx-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-x icon-btn"
          onClick={closeOrders}
          aria-label="Tutup"
        >
          <Icon name="close" />
        </button>
        <h3 className="serif">Transaksi Anda</h3>

        {!orders || !orders.length ? (
          <div className="tx-empty">
            Belum ada transaksi. Yuk pesan jus favoritmu!
          </div>
        ) : (
          <div className="tx-list">
            {orders.map((o) => {
              const done = isOrderDone(o.status);
              return (
                <div className="tx-item" key={o.id}>
                  <div className="tx-head">
                    <strong>#{o.id}</strong>
                    <span className={"tx-status " + (done ? "done" : "proc")}>
                      {o.status || "Diproses"}
                    </span>
                  </div>
                  <div className="tx-items">
                    {(o.items || [])
                      .map((it) => it.name + " x" + it.qty)
                      .join(", ")}
                  </div>
                  <div className="tx-foot">
                    <span>
                      {money(o.total || 0)} · {METHOD_LABEL[o.method] || o.method}
                    </span>
                    <span className="tx-date">{dateStr(o.ts)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}