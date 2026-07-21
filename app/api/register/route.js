import { findUserByEmail, createUser } from "@/lib/serverStore";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");

  if (!name || !email || !password) {
    return Response.json({ error: "Lengkapi semua data." }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json(
      { error: "Password minimal 6 karakter." },
      { status: 400 },
    );
  }
  if (findUserByEmail(email)) {
    return Response.json(
      { error: "Email sudah terdaftar." },
      { status: 409 },
    );
  }

  createUser({
    name,
    email,
    password,
    role: "buyer",
    provider: "credentials",
  });
  return Response.json({ ok: true });
}