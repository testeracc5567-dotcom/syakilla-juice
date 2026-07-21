"use client";
import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { getCustomerOrders } from "@/lib/orders";
import { money } from "@/lib/format";
import { Icon } from "./Icons";

const TIERS = [
  { name: "Bronze", min: 0, color: "#cd7f32" },
  { name: "Silver", min: 50, color: "#9aa0a6" },
  { name: "Gold", min: 150, color: "#f4a825" },
];

export default function LoyaltyModal() {
  const { loyaltyOpen, closeLoyalty } = useUI();
  const { user } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("syk-orders-update", h);
    return () => window.removeEventListener("syk-orders-update", h);
  }, []);

  if (!loyaltyOpen) return null;
  const orders = user ? getCustomerOrders(user.email).orders : [];
  const totalSpend = orders.reduce((s, o) => s + (o.total || 0), 0);
  const points = Math.floor(totalSpend / 1000);

  let tier = TIERS[0];
  TIERS.forEach((t) => {
    if (points >= t.min) tier = t;
  });
  const next = TIERS.find((t) => t.min > points);
  const progress = next
    ? Math.min(100, Math.round((points / next.min) * 100))
    : 100;

  return (
    <div className="modal-scrim show" onClick={closeLoyalty}>
      <div className="modal loy-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-x icon-btn"
          onClick={closeLoyalty}
          aria-label="Tutup"
        >
          <Icon name="close" />
        </button>
        <h3 className="serif">Member Loyalty</h3>

        <div className="loy-card" style={{ borderColor: tier.color }}>
          <div className="loy-tier" style={{ color: tier.color }}>
            {tier.name} Member
          </div>
          <div className="loy-points">
            {points} <span>poin</span>
          </div>
          <div className="loy-spend">
            Total belanja: {money(totalSpend)} · {orders.length} transaksi
          </div>
        </div>

        {next ? (
          <div className="loy-progress">
            <div className="loy-bar">
              <span style={{ width: progress + "%" }} />
            </div>
            <div className="loy-next">
              Kurang {next.min - points} poin lagi buat naik ke {next.name}!
            </div>
          </div>
        ) : (
          <div className="loy-next">Kamu udah di tier tertinggi. Mantap!</div>
        )}

        <div className="loy-info">
          Tiap belanja Rp 1.000 = 1 poin. Kumpulin poin buat naik tier &amp;
          dapetin perk spesial.
        </div>
      </div>
    </div>
  );
}