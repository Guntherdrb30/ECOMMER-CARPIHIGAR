import { NextResponse } from "next/server";
import { refreshTasaFromBCVCron } from "@/server/actions/settings";

export async function GET(req: Request) {
  const token = process.env.CRON_SECRET_BCV || "";
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("token") ||
    req.headers.get("x-cron-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token || token !== provided) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await refreshTasaFromBCVCron();
    return NextResponse.json({ ok: true, tasa: res.tasaVES });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
