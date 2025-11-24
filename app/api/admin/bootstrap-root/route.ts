import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

// Aseguramos runtime Node.js para que bcrypt funcione bien
export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.ROOT_BOOTSTRAP_SECRET;

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falta configurar ROOT_BOOTSTRAP_SECRET en las variables de entorno",
      },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const token =
    url.searchParams.get("token") ||
    req.headers.get("x-bootstrap-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token || token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const email = (
    process.env.ROOT_BOOTSTRAP_EMAIL ||
    process.env.ROOT_EMAIL ||
    "root@carpihogar.com"
  ).toLowerCase();
  const plain =
    process.env.ROOT_BOOTSTRAP_PASSWORD ||
    process.env.ROOT_PASSWORD ||
    "";

  if (!plain) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta configurar ROOT_BOOTSTRAP_PASSWORD o ROOT_PASSWORD en las variables de entorno",
      },
      { status: 500 }
    );
  }

  try {
    const password = await bcrypt.hash(plain, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password,
        role: "ADMIN" as any,
        alliedStatus: "NONE" as any,
        name: "Root",
      },
      create: {
        name: "Root",
        email,
        password,
        role: "ADMIN" as any,
        alliedStatus: "NONE" as any,
      },
    });

    return NextResponse.json({
      ok: true,
      email: user.email,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e || "Error desconocido") },
      { status: 500 }
    );
  }
}

