"use client";
// Nyalain sinkronisasi pesanan dari server (admin & pembeli selalu update).
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { startOrdersSync } from "@/lib/orders";

const GUEST_KEY = "syk_guest_v1";

export default function OrdersSync() {
  const { user, isAdmin } = useAuth();
  const email = user && user.email ? user.email : null;

  useEffect(() => {
    let room = null;
    if (!isAdmin) {
      try {
        room = email || localStorage.getItem(GUEST_KEY) || null;
      } catch (e) {
        room = email;
      }
    }
    return startOrdersSync(room, 6000);
  }, [email, isAdmin]);

  return null;
}
