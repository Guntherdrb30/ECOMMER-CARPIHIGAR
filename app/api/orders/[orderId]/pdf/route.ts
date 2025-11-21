import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

// Ensure Node.js runtime for pdfkit on Vercel/Next.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchLogoBuffer(logoUrl?: string): Promise<Buffer | null> {
  try {
    if (!logoUrl) return null;
    if (logoUrl.startsWith("http")) {
      const res = await fetch(logoUrl);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    }
    const trimmed = logoUrl.startsWith("/") ? logoUrl.slice(1) : logoUrl;
    const fs = await import("fs");
    const path = await import("path");
    const p = path.join(process.cwd(), "public", trimmed);
    if (fs.existsSync(p)) {
      return fs.readFileSync(p);
    }
  } catch {
    // ignore
  }
  return null;
}

function formatAmount(v: number) {
  return v.toFixed(2);
}

function padLeft(num: number, width: number) {
  const s = String(num);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function buildBaseUrl() {
  const direct = process.env.NEXT_PUBLIC_URL;
  if (direct) return direct.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "";
}

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const url = new URL(req.url);
    const tipoRaw = (url.searchParams.get("tipo") || "recibo").toLowerCase();
    const monedaRaw = (url.searchParams.get("moneda") || "USD").toUpperCase();
    const login = new URL("/auth/login", url.origin);
    const callbackUrl = new URL(`/api/orders/${params.orderId}/pdf`, url.origin);
    callbackUrl.searchParams.set("tipo", tipoRaw);
    callbackUrl.searchParams.set("moneda", monedaRaw);
    login.searchParams.set("callbackUrl", callbackUrl.toString());
    return NextResponse.redirect(login);
  }

  const url = new URL(req.url);
  const tipoRaw = (url.searchParams.get("tipo") || "recibo").toLowerCase();
  const allowedDocs = ["recibo", "factura"];
  const tipo = (allowedDocs.includes(tipoRaw) ? tipoRaw : "recibo") as "recibo" | "factura";
  const moneda: "VES" = "VES";

  const orderId = params.orderId;
  try {
    // Allow: owner (userId), seller (sellerId), ADMIN/VENDEDOR/ALIADO (checked after fetch)
    const userId = (session.user as any)?.id;
    const role = (session.user as any)?.role;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, seller: true, items: true, payment: true, shipping: true },
    });
    if (!order) return new NextResponse("Not Found", { status: 404 });
    const isOwner = order.userId === userId;
    const isSeller = String(order.sellerId || "") === String(userId || "");
    const isAdminLike = ["ADMIN", "VENDEDOR", "ALIADO"].includes(String(role || ""));
    if (!(isOwner || isSeller || isAdminLike)) return new NextResponse("Forbidden", { status: 403 });

    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

    // Asignar correlativos de factura/recibo si aún no existen
    let invoiceNumber = (order as any).invoiceNumber as number | null | undefined;
    let receiptNumber = (order as any).receiptNumber as number | null | undefined;

    if (tipo === "factura" && !invoiceNumber) {
      invoiceNumber = await prisma.$transaction(async (tx) => {
        const s = await tx.siteSettings.findUnique({
          where: { id: 1 },
          select: { invoiceNextNumber: true },
        });
        const next = Number((s as any)?.invoiceNextNumber ?? 1) || 1;
        await tx.siteSettings.update({
          where: { id: 1 },
          data: { invoiceNextNumber: next + 1 },
        });
        await tx.order.update({ where: { id: orderId }, data: { invoiceNumber: next } });
        return next;
      });
    }

    if (tipo === "recibo" && !receiptNumber) {
      receiptNumber = await prisma.$transaction(async (tx) => {
        const s = await tx.siteSettings.findUnique({
          where: { id: 1 },
          select: { receiptNextNumber: true },
        });
        const next = Number((s as any)?.receiptNextNumber ?? 1) || 1;
        await tx.siteSettings.update({
          where: { id: 1 },
          data: { receiptNextNumber: next + 1 },
        });
        await tx.order.update({ where: { id: orderId }, data: { receiptNumber: next } });
        return next;
      });
    }

    // Logo: primero el configurado, luego intentamos uno fijo de Trends172
    const logoBuf =
      (await fetchLogoBuffer((settings as any)?.logoUrl)) ||
      (await fetchLogoBuffer("/trends172-logo.png"));

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Uint8Array[] = [];
    doc.on("data", (c: any) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: any) => reject(err));
    });

    const ivaPercent = Number(order.ivaPercent || (settings as any)?.ivaPercent || 16);
    const tasaVES = Number(order.tasaVES || (settings as any)?.tasaVES || 40);
    const toMoney = (v: number) => v * tasaVES;
    const money = (v: number) => `Bs ${formatAmount(v)}`;

    // Totales base (en USD)
    let subtotalUSD = 0;
    for (const it of order.items as any[]) {
      const p = Number((it as any).priceUSD || 0);
      const q = Number((it as any).quantity || 0);
      subtotalUSD += p * q;
    }
    const deliveryFeeUSD = Number((order as any).shipping?.deliveryFeeUSD || 0);
    subtotalUSD += deliveryFeeUSD;
    const ivaUSD = subtotalUSD * (ivaPercent / 100);

    const paymentCurrency = String((order.payment as any)?.currency || "USD").toUpperCase();
    const isDivisa = paymentCurrency === "USD" || paymentCurrency === "USDT";
    const totalSinIgtfUSD = subtotalUSD + ivaUSD;
    const igtfUSD = isDivisa ? totalSinIgtfUSD * 0.03 : 0;
    const totalOperacionUSD = totalSinIgtfUSD + igtfUSD;

    const user = order.user as any;
    const seller = order.seller as any;

    const legalName = (settings as any)?.legalCompanyName || "Trends172, C.A";
    const legalRif = (settings as any)?.legalCompanyRif || "J-31758009-5";
    const legalAddress =
      (settings as any)?.legalCompanyAddress ||
      "Av. Industrial, Edificio Teka, Ciudad Barinas, Estado Barinas";
    const legalPhone = (settings as any)?.legalCompanyPhone || "04245192679";

    const brandName = settings?.brandName || "Carpihogar.ai";
    const contactPhone = (settings as any)?.contactPhone || "";
    const contactEmail = (settings as any)?.contactEmail || "";

    const baseUrl = buildBaseUrl();

    // Header
    if (logoBuf) {
      try {
        doc.image(logoBuf, 40, 30, { height: 40 });
      } catch {
        // ignore
      }
    }

    if (tipo === "factura") {
      // Encabezado legal Trends172
      doc.fontSize(14).fillColor("#111").text(legalName, logoBuf ? 100 : 40, 30);
      doc.fontSize(10).fillColor("#444");
      doc.text(`RIF: ${legalRif}`, logoBuf ? 100 : 40);
      doc.text(legalAddress, logoBuf ? 100 : 40, doc.y);
      if (legalPhone) {
        doc.text(`Teléfono: ${legalPhone}`, logoBuf ? 100 : 40, doc.y);
      }
      const rightX = 420;
      const numStr = invoiceNumber ? padLeft(invoiceNumber, 6) : "000000";
      doc.fontSize(10).fillColor("#111").text("FORMA LIBRE", rightX, 30);
      doc.text(`N° DE CONTROL: 00-${numStr}`, rightX, doc.y);
      doc.text(`FACTURA ${numStr}`, rightX, doc.y + 10);
      doc.text(
        `Fecha: ${new Date(order.createdAt as any).toLocaleDateString("es-VE")}`,
        rightX,
        doc.y,
      );
    } else {
      // Recibo simple con datos de Carpihogar
      doc.fontSize(18).fillColor("#111").text(String(brandName), logoBuf ? 90 : 40, 35);
      doc.fontSize(10).fillColor("#444");
      if (contactEmail) doc.text(contactEmail, logoBuf ? 90 : 40);
      if (contactPhone) doc.text(contactPhone, logoBuf ? 90 : 40);
      if (receiptNumber) {
        const rec = padLeft(receiptNumber, 6);
        doc.text(`RECIBO ${rec}`, 420, 35);
      }
    }

    doc.moveDown();
    doc.moveTo(40, 90).lineTo(555, 90).strokeColor("#ddd").stroke();

    // Datos de la venta
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#111").text("Datos de la operación", 40, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#333");
    doc.text(`Cliente: ${user?.name || user?.email || "-"}`);
    if (order.customerTaxId) doc.text(`Cédula/RIF: ${order.customerTaxId}`);
    if (order.customerFiscalAddress) doc.text(`Dirección fiscal: ${order.customerFiscalAddress}`);
    const phone =
      (order as any)?.shippingAddress?.phone || (user?.phone as string | undefined) || "";
    if (phone) doc.text(`Teléfono: ${phone}`);
    if (seller) {
      doc.text(`Vendedor: ${seller.name || seller.email || ""}`);
    }
    doc.text(
      `Fecha: ${new Date(order.createdAt as any).toLocaleString("es-VE", {
        dateStyle: "short",
        timeStyle: "short",
      })}`,
    );
    doc.text(`Moneda: ${moneda}`);
    doc.text(`IVA: ${ivaPercent}%  -  Tasa: ${tasaVES}`);

    if (order.payment) {
      doc.moveDown(0.5);
      const pay = order.payment as any;
      doc.text(
        `Pago: ${pay.method || "-"} - ${pay.currency || "USD"}${
          pay.reference ? ` - Ref: ${pay.reference}` : ""
        }`,
      );
    }

    doc.moveDown(0.8);
    doc.fontSize(11).fillColor("#111").text("Productos", 40, doc.y);
    doc.moveDown(0.3);

    const startX = 40;
    const colWidths = [40, 80, 230, 70, 70, 70];
    const headers = ["Cant", "Código", "Descripción del Producto", "Precio", "Total", "Kg/Und"];
    doc.fontSize(9).fillColor("#333");
    headers.forEach((h, i) => {
      doc.text(h, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, {
        width: colWidths[i],
      });
    });
    doc.moveDown(0.3);
    doc.moveTo(startX, doc.y).lineTo(555, doc.y).strokeColor("#eee").stroke();

    for (const it of order.items as any[]) {
      const p = Number((it as any).priceUSD || 0);
      const q = Number((it as any).quantity || 0);
      const sub = p * q;
      const code =
        (it as any).product?.code || (it as any).product?.sku || (it as any).productId || "";
      const cols = [
        String(q),
        String(code || ""),
        (it as any).name || (it as any).product?.name || "Producto",
        money(toMoney(p)),
        money(toMoney(sub)),
        "", // Peso / unidad (no disponible por ahora)
      ];
      cols.forEach((c, i) => {
        doc
          .fillColor("#111")
          .text(c, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, {
            width: colWidths[i],
          });
      });
      doc.moveDown(0.2);
    }

    if (deliveryFeeUSD > 0) {
      const cols = [
        "1",
        "",
        "Delivery local (moto)",
        money(toMoney(deliveryFeeUSD)),
        money(toMoney(deliveryFeeUSD)),
        "",
      ];
      cols.forEach((c, i) => {
        doc
          .fillColor("#111")
          .text(c, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, {
            width: colWidths[i],
          });
      });
      doc.moveDown(0.2);
    }

    doc.moveDown(1);

    // Totales (en Bs)
    const subtotalBs = toMoney(subtotalUSD);
    const ivaBs = toMoney(ivaUSD);
    const igtfBs = toMoney(igtfUSD);
    const totalOperacionBs = toMoney(totalOperacionUSD);

    doc.fontSize(10).fillColor("#111");
    doc.text(`Base imponible: ${money(subtotalBs)}`, { align: "right" });
    doc.text(`I.V.A. (${ivaPercent}%): ${money(ivaBs)}`, { align: "right" });
    doc.text(`I.G.T.F. 3%: ${money(igtfBs)}`, { align: "right" });
    doc
      .font("Helvetica-Bold")
      .text(`Total operación: ${money(totalOperacionBs)}`, { align: "right" })
      .font("Helvetica");

    doc.moveDown(1);
    doc.fontSize(9).fillColor("#555");

    if (tipo === "factura") {
      doc.text(
        "Documento generado por sistemas Carpihogar / Trends172, C.A. SOLO EL ORIGINAL DA DERECHO A CRÉDITO FISCAL.",
        40,
        doc.y,
        { width: 515 },
      );
    } else {
      doc.text(
        "Recibo informativo generado por sistemas Carpihogar. No constituye factura fiscal.",
        40,
        doc.y,
        { width: 515 },
      );
    }

    doc.end();
    const pdfBuf = await done;
    const fname =
      tipo === "factura" && invoiceNumber
        ? `factura_${padLeft(invoiceNumber, 6)}.pdf`
        : `${tipo}_${order.id}.pdf`;
    const resp = new NextResponse(new Uint8Array(pdfBuf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fname}"`,
        "Cache-Control": "no-store",
      },
    });
    return resp;
  } catch (e) {
    console.error("[orders/pdf] Error generating PDF:", e);
    return new NextResponse(`Error: ${String(e)}`, { status: 500 });
  }
}

