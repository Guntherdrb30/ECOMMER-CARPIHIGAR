"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import PurchasePreviewTable, { type CompareItem } from "./purchase-preview-table";

type Supplier = {
  id: string;
  name: string;
  taxId?: string | null;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

type BankAccount = {
  id: string;
  name: string;
  bankName?: string | null;
  accountNumber?: string | null;
  currency: "USD" | "VES" | "USDT";
};

export default function PurchaseIAForm({
  suppliers,
  defaultTasa,
  defaultIvaPercent,
  bankAccounts,
}: {
  suppliers: Supplier[];
  defaultTasa: number;
  defaultIvaPercent: number;
  bankAccounts: BankAccount[];
}) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  // Tasa aplicada a la factura. Por defecto viene de ajustes (BCV),
  // pero se puede ajustar para reflejar la tasa real del día de pago.
  const [tasaVES, setTasaVES] = useState<number>(defaultTasa || 0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [supportUploading, setSupportUploading] = useState(false);
  const [invoiceImageUrl, setInvoiceImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CompareItem[] | null>(null);

  const [paymentCurrency, setPaymentCurrency] = useState<"USD" | "VES" | "USDT">(
    "USD",
  );
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState<string>("");

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId) || null,
    [supplierId, suppliers],
  );

  const canUpload = useMemo(() => !!file, [file]);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecciona un archivo");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("currency", currency);
      if (currency === "VES") fd.append("tasaVES", String(tasaVES || 0));
      const up = await fetch("/api/upload-invoice", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const parsed = await up.json();
      if (!up.ok) throw new Error(parsed?.error || "No se pudo leer el archivo");

      const compareRes = await fetch("/api/purchases/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currency: parsed.currency || currency,
          // Preferimos la tasa elegida por el usuario; si el PDF trae una tasa
          // distinta, solo se usa cuando no hay valor manual.
          tasaVES: tasaVES || parsed.tasaVES || 0,
          lines: parsed.lines || [],
        }),
      });
      const cmp = await compareRes.json();
      if (!compareRes.ok) throw new Error(cmp?.error || "Error comparando productos");
      const arr = Array.isArray(cmp.items) ? (cmp.items as CompareItem[]) : [];
      if (!arr.length) {
        toast.error("No se detectaron productos en el archivo");
        return;
      }
      setItems(arr);
      toast.success("Factura precargada");
    } catch (e: any) {
      toast.error(e?.message || "Error en carga");
    } finally {
      setLoading(false);
    }
  };

  const handleSupportUpload = async () => {
    if (!supportFile) {
      toast.error("Selecciona un archivo de soporte");
      return;
    }
    setSupportUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", supportFile);
      const isImage =
        typeof supportFile.type === "string" &&
        supportFile.type.toLowerCase().startsWith("image/");
      fd.append("type", isImage ? "image" : "file");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "No se pudo subir el soporte");
      }
      setInvoiceImageUrl(String(data.url));
      toast.success("Soporte subido");
    } catch (e: any) {
      toast.error(e?.message || "Error subiendo soporte");
    } finally {
      setSupportUploading(false);
    }
  };

  // Permitir registro manual sin archivo: arranca la tabla vacía.
  const startManual = () => {
    setItems([]);
  };

  if (items) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <div className="text-sm text-gray-600">Proveedor</div>
            <div className="font-semibold">
              {selectedSupplier?.name || "—"}
            </div>
            {selectedSupplier && (
              <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                {selectedSupplier.taxId && (
                  <div>RIF: {selectedSupplier.taxId}</div>
                )}
                {selectedSupplier.address && (
                  <div className="line-clamp-2">
                    {selectedSupplier.address}
                  </div>
                )}
                {selectedSupplier.contactName && (
                  <div>
                    Contacto: {selectedSupplier.contactName}
                    {selectedSupplier.contactPhone
                      ? ` (${selectedSupplier.contactPhone})`
                      : ""}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-gray-600">Moneda factura</div>
            <div>{currency}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tasa aplicada (VES→USD)</div>
            <div>{currency === "VES" ? tasaVES.toFixed(4) : "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">N° factura</div>
            <div>{invoiceNumber || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Fecha factura</div>
            <div>{invoiceDate || "—"}</div>
          </div>
        </div>
        <PurchasePreviewTable
          items={items}
          supplierId={supplierId || undefined}
          currency={currency}
          tasaVES={tasaVES}
          invoiceNumber={invoiceNumber || undefined}
          invoiceDate={invoiceDate || undefined}
          invoiceImageUrl={invoiceImageUrl || undefined}
          defaultIvaPercent={defaultIvaPercent}
          paymentCurrency={paymentCurrency}
          bankAccountId={bankAccountId || undefined}
          paymentReference={paymentReference || undefined}
          onCancel={() => setItems(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="form-label">Proveedor</label>
          <select
            className="form-select"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Moneda de la factura</label>
          <select
            className="form-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
          >
            <option value="USD">USD</option>
            <option value="VES">Bs</option>
          </select>
        </div>
        <div>
          <label className="form-label">Tasa aplicada (VES→USD)</label>
          <input
            className="form-input"
            type="number"
            step={0.0001}
            value={tasaVES}
            onChange={(e) => setTasaVES(Number(e.target.value || 0))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Por defecto usa la tasa BCV actual de ajustes. Si la factura fue
            pagada en otra fecha, ajusta este valor a la tasa de ese día.
          </p>
        </div>
        <div>
          <label className="form-label">N° factura</label>
          <input
            className="form-input"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Número de factura legal"
          />
        </div>
        <div>
          <label className="form-label">Fecha de la factura</label>
          <input
            className="form-input"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="form-label">Moneda del pago</label>
          <select
            className="form-select"
            value={paymentCurrency}
            onChange={(e) => setPaymentCurrency(e.target.value as any)}
          >
            <option value="USD">USD</option>
            <option value="VES">Bs</option>
            <option value="USDT">Binance / USDT</option>
          </select>
        </div>
        <div>
          <label className="form-label">Banco / cuenta</label>
          <select
            className="form-select"
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
          >
            <option value="">Sin vínculo de banco</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.bankName ? `- ${b.bankName}` : ""} ({b.currency})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Referencia de pago</label>
          <input
            className="form-input"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Ref. bancaria / TxID (opcional)"
          />
        </div>
      </div>

      <div>
        <label className="form-label">
          Factura o lista (PDF/CSV) para precargar (opcional)
        </label>
        <input
          className="form-input"
          type="file"
          accept="application/pdf,text/csv,.csv,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Si no tienes archivo estructurado, puedes omitir este paso y
          registrar la factura manualmente.
        </p>
      </div>

      <div className="space-y-1">
        <label className="form-label">
          Soporte de factura (imagen/PDF, opcional)
        </label>
        <input
          className="form-input"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setSupportFile(e.target.files?.[0] || null)}
        />
        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            disabled={!supportFile || supportUploading}
            onClick={handleSupportUpload}
            className="bg-emerald-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {supportUploading ? "Subiendo..." : "Subir soporte"}
          </button>
          {invoiceImageUrl && (
            <a
              href={invoiceImageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline break-all"
            >
              Ver soporte
            </a>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Puedes usar el mismo PDF de la factura o una foto/imagen como soporte
          legal. No es obligatorio si ya tienes el PDF arriba.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          disabled={!canUpload || loading}
          onClick={handleUpload}
          className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Subir y precargar"}
        </button>
        <button
          type="button"
          onClick={startManual}
          className="bg-gray-100 text-gray-800 px-3 py-1 rounded border border-gray-300"
        >
          Registrar manualmente sin archivo
        </button>
      </div>
    </div>
  );
}

