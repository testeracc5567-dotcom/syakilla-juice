import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const list = (authOptions?.providers || []).map((p) => ({
      id: p?.id,
      name: p?.name,
      type: p?.type,
    }));
    return Response.json({
      ok: true,
      count: list.length,
      providers: list,
      hasSecret: Boolean(process.env.NEXTAUTH_SECRET),
      nextauthUrl: process.env.NEXTAUTH_URL || null,
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
