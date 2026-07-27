"use client";
// Nyalain sinkronisasi ulasan dari server biar rating update sendiri (realtime).
import { useEffect } from "react";
import { startReviewsSync } from "@/lib/reviews";

export default function ReviewsSync() {
  useEffect(() => startReviewsSync(8000), []);
  return null;
}
