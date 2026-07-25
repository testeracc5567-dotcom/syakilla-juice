import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Cek sesi admin. Aman walau "role" belum ada di session (fallback ke email admin).
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const u = session?.user;
  const ok = !!u && (u.role === "admin" || u.email === "admin@syakilla.id");
  return ok ? session : null;
}