import { NextResponse } from "next/server";
import { refreshTasaFromBCVCron } from "@/server/actions/settings";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET_BCV;

  // Requests coming from Vercel Cron include this header by default.
  // We allow them even if CRON_SECRET_BCV is definido, para que el cron
  // configurado en vercel.json funcione sin tener que pasar el token.
  const isVercelCron = !!req.headers.get("x-vercel-cron");

  if (secret && !isVercelCron) {
    const url = new URL(req.url);
    const provided =
      url.searchParams.get("token") ||
      req.headers.get("x-cron-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!provided || provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const res = await refreshTasaFromBCVCron();
  // Nunca devolvemos 500 para que Vercel Cron no marque el job como fallo,
  // pero en el JSON puedes ver si ok=false y el mensaje de error.
  return NextResponse.json(
    res.ok ? { ok: true, tasa: res.tasaVES } : { ok: false, error: res.error },
    { status: 200 }
  );
}
