import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUser } from "@/lib/serverStore";

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Belum login." }, { status: 401 });
  }

  let patch;
  try {
    patch = await req.json();
  } catch (e) {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const allowed = ["name", "photo", "phone", "addresses", "selectedAddressId"];
  const safePatch = {};
  allowed.forEach((k) => {
    if (k in patch) safePatch[k] = patch[k];
  });

  const updated = updateUser(session.user.email, safePatch);
  if (!updated) {
    return Response.json({ error: "User tidak ditemukan." }, { status: 404 });
  }
  return Response.json({ ok: true });
}