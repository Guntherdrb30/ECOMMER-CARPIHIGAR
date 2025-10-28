"use client";

import { useMemo, useState } from "react";
import { sendOrderWhatsAppPdfByForm } from "@/server/actions/sales";

type DocType = "recibo" | "nota" | "factura";
type Moneda = "USD" | "VES";

export default function PdfCopyMenu({ orderId, defaultTipo = "factura", defaultMoneda = "USD", className, hasPhone = false }: { orderId: string; defaultTipo?: DocType; defaultMoneda?: Moneda; className?: string; hasPhone?: boolean }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<DocType>(defaultTipo);
  const [moneda, setMoneda] = useState<Moneda>(defaultMoneda);
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => {
    const base = (process.env.NEXT_PUBLIC_URL as string) || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/api/orders/${orderId}/pdf?tipo=${tipo}&moneda=${moneda}`;
  }, [orderId, tipo, moneda]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className={className || "relative inline-block"}>
      <button type="button" className="px-2 py-0.5 border rounded text-sm" onClick={() => setOpen((v) => !v)}>
        Copiar enlace PDF
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-64 bg-white border rounded shadow p-3">
          <div className="text-xs text-gray-600 mb-2">Selecciona documento y moneda:</div>
          <div className="mb-2">
            <div className="text-xs text-gray-700 mb-1">Documento</div>
            <div className="flex gap-2">
              {(["recibo","nota","factura"] as DocType[]).map((t) => (
                <button key={t} type="button" onClick={() => setTipo(t)} className={`px-2 py-0.5 rounded border text-xs ${tipo===t? 'bg-gray-800 text-white' : ''}`}>{t[0].toUpperCase()+t.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="mb-2">
            <div className="text-xs text-gray-700 mb-1">Moneda</div>
            <div className="flex gap-2">
              {(["USD","VES"] as Moneda[]).map((m) => (
                <button key={m} type="button" onClick={() => setMoneda(m)} className={`px-2 py-0.5 rounded border text-xs ${moneda===m? 'bg-gray-800 text-white' : ''}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2"> 
            <button type="button" className="px-2 py-1 rounded border text-sm" onClick={copy}>{copied ? 'Copiado!' : 'Copiar'}</button>
            <a href={link} target="_blank" rel="noreferrer" className="px-2 py-1 rounded border text-sm">Abrir</a>
            {hasPhone ? (
              <form action={sendOrderWhatsAppPdfByForm}>
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="tipo" value={tipo} />
                <input type="hidden" name="moneda" value={moneda} />
                <input type="hidden" name="backTo" value="/dashboard/aliado/ventas" />
                <button type="submit" className="px-2 py-1 rounded border text-sm text-green-700">WhatsApp PDF</button>
              </form>
            ) : (
              <span className="text-xs text-gray-500">Cliente sin teléfono</span>
            )}
            <button type="button" className="ml-auto text-xs text-gray-600 hover:underline" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
