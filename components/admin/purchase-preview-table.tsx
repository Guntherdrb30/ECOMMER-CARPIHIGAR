"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type CompareItem = {
  input: { code?: string | null; name: string; quantity: number; unitCost: number };
  code?: string | null;
  name: string;
  quantity: number;
  costUSD: number;
  marginClientPct: number;
  marginAllyPct: number;
  marginWholesalePct: number;
  priceClientUSD: number;
  priceAllyUSD: number;
  priceWholesaleUSD: number;
  product?: { id: string; name: string } | null;
  // Metadatos adicionales del producto
  supplierCode?: string | null;
  description?: string | null;
  weightKg?: number | null;
  soldBy?: 'UNIT' | 'PACKAGE' | 'BOTH' | null;
  unitsPerPackage?: number | null;
  estadoIA: 'EXISTENTE' | 'NUEVO';
  accion: 'ACTUALIZAR' | 'CREAR';
};

type ProdSearch = {
  id: string;
  name: string;
  sku: string | null;
  priceUSD: number | null;
};

export default function PurchasePreviewTable({
  items: initialItems,
  supplierId,
  currency,
  tasaVES,
  invoiceNumber,
  invoiceDate,
  invoiceImageUrl,
  defaultIvaPercent,
  paymentCurrency,
  bankAccountId,
  paymentReference,
  onCancel,
}: {
  items: CompareItem[];
  supplierId?: string;
  currency: 'USD' | 'VES';
  tasaVES?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceImageUrl?: string;
  defaultIvaPercent: number;
  paymentCurrency: 'USD' | 'VES' | 'USDT';
  bankAccountId?: string;
  paymentReference?: string;
  onCancel?: () => void;
}) {
  const [rows, setRows] = useState<(CompareItem & { selected: boolean })[]>(() =>
    initialItems.map((it) => ({ ...it, selected: true })),
  );

  const [baseAmountUSD, setBaseAmountUSD] = useState<number>(() => {
    const total = initialItems.reduce(
      (a, r) => a + Number(r.quantity || 0) * Number(r.costUSD || 0),
      0,
    );
    return Number(total.toFixed(2));
  });
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [ivaPercent, setIvaPercent] = useState<number>(defaultIvaPercent || 16);
  const [paymentMode, setPaymentMode] = useState<
    'CONTADO' | 'CREDITO_SIN_ABONO' | 'CREDITO_CON_ABONO'
  >('CONTADO');
  const [paidAmountUSD, setPaidAmountUSD] = useState<number | ''>('');
  const [igtfPercent, setIgtfPercent] = useState<number>(
    paymentCurrency === 'USD' ? 3 : 0,
  );
  const [searchQ, setSearchQ] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ProdSearch[]>([]);
  const [newName, setNewName] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newCostUSD, setNewCostUSD] = useState<number>(0);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = searchQ.trim();
      if (!q) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(q)}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json)) {
          setSearchResults(
            json.map((p: any) => ({
              id: String(p.id),
              name: String(p.name || ""),
              sku: (p.sku as string | null) ?? null,
              priceUSD:
                typeof p.priceUSD === "number"
                  ? p.priceUSD
                  : Number(p.priceUSD || 0),
            })),
          );
        }
      } catch {
        // ignorar errores del buscador
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const setField = (idx: number, patch: Partial<CompareItem>) => {
    setRows((prev) => {
      const next = [...prev];
      const current = { ...next[idx], ...patch } as any;
      const cost = Number(current.costUSD || 0);
      const mc = Number(current.marginClientPct || 0);
      const ma = Number(current.marginAllyPct || 0);
      const mw = Number(current.marginWholesalePct || 0);
      current.priceClientUSD = Number((cost * (1 + mc / 100)).toFixed(2));
      current.priceAllyUSD = Number((cost * (1 + ma / 100)).toFixed(2));
      current.priceWholesaleUSD = Number((cost * (1 + mw / 100)).toFixed(2));
      next[idx] = current;
      return next;
    });
  };

  const setSelected = (idx: number, v: boolean) =>
    setRows((prev) => {
      const next = [...prev];
      (next[idx] as any).selected = v;
      return next;
    });

  const addExistingProduct = (p: ProdSearch) => {
    const costUSD = Number(p.priceUSD || 0);
    const marginClientPct = 40;
    const marginAllyPct = 30;
    const marginWholesalePct = 20;
    const priceClientUSD = Number(
      (costUSD * (1 + marginClientPct / 100)).toFixed(2),
    );
    const priceAllyUSD = Number(
      (costUSD * (1 + marginAllyPct / 100)).toFixed(2),
    );
    const priceWholesaleUSD = Number(
      (costUSD * (1 + marginWholesalePct / 100)).toFixed(2),
    );

    setRows((prev) => [
      ...prev,
      {
        input: {
          code: p.sku || null,
          name: p.name,
          quantity: 1,
          unitCost: costUSD,
        },
        code: p.sku || null,
        name: p.name,
        quantity: 1,
        costUSD,
        marginClientPct,
        marginAllyPct,
        marginWholesalePct,
        priceClientUSD,
        priceAllyUSD,
        priceWholesaleUSD,
        product: { id: p.id, name: p.name },
        supplierCode: null,
        description: null,
        weightKg: null,
        soldBy: 'UNIT',
        unitsPerPackage: null,
        estadoIA: 'EXISTENTE',
        accion: 'ACTUALIZAR',
        selected: true,
      },
    ]);
    setSearchQ("");
    setSearchResults([]);
  };

  const addManualProductFromQuery = () => {
    const name = searchQ.trim();
    if (!name) return;
    const costUSD = 0;
    const marginClientPct = 40;
    const marginAllyPct = 30;
    const marginWholesalePct = 20;

    setRows((prev) => [
      ...prev,
      {
        input: { code: null, name, quantity: 1, unitCost: costUSD },
        code: null,
        name,
        quantity: 1,
        costUSD,
        marginClientPct,
        marginAllyPct,
        marginWholesalePct,
        priceClientUSD: 0,
        priceAllyUSD: 0,
        priceWholesaleUSD: 0,
        product: undefined,
        supplierCode: null,
        description: null,
        weightKg: null,
        soldBy: 'UNIT',
        unitsPerPackage: null,
        estadoIA: 'NUEVO',
        accion: 'CREAR',
        selected: true,
      },
    ]);
    setSearchQ("");
    setSearchResults([]);
  };

  const addNewProduct = () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Escribe un nombre para el producto nuevo');
      return;
    }
    const quantity = newQuantity > 0 ? newQuantity : 1;
    const costUSD = newCostUSD >= 0 ? newCostUSD : 0;

    const marginClientPct = 40;
    const marginAllyPct = 30;
    const marginWholesalePct = 20;

    setRows((prev) => [
      ...prev,
      {
        input: { code: null, name, quantity, unitCost: costUSD },
        code: null,
        name,
        quantity,
        costUSD,
        marginClientPct,
        marginAllyPct,
        marginWholesalePct,
        priceClientUSD: 0,
        priceAllyUSD: 0,
        priceWholesaleUSD: 0,
        product: undefined,
        supplierCode: null,
        description: null,
        weightKg: null,
        soldBy: 'UNIT',
        unitsPerPackage: null,
        estadoIA: 'NUEVO',
        accion: 'CREAR',
        selected: true,
      },
    ]);

    setNewName("");
    setNewQuantity(1);
    setNewCostUSD(0);
  };

  const totals = useMemo(() => {
    const sel = rows.filter((r) => r.selected);
    const qty = sel.reduce((a, r) => a + Number(r.quantity || 0), 0);
    const usd = sel.reduce(
      (a, r) => a + Number(r.quantity || 0) * Number(r.costUSD || 0),
      0,
    );
    return { qty, usd };
  }, [rows]);

  const discountAmountUSD = useMemo(
    () => Number((baseAmountUSD * (discountPercent / 100)).toFixed(2)),
    [baseAmountUSD, discountPercent],
  );
  const taxableBase = useMemo(
    () => Number((baseAmountUSD - discountAmountUSD).toFixed(2)),
    [baseAmountUSD, discountAmountUSD],
  );
  const ivaAmountUSD = useMemo(
    () => Number((taxableBase * (ivaPercent / 100)).toFixed(2)),
    [taxableBase, ivaPercent],
  );
  const totalInvoiceUSD = useMemo(
    () => Number((taxableBase + ivaAmountUSD).toFixed(2)),
    [taxableBase, ivaAmountUSD],
  );

  const igtfAmountUSD = useMemo(() => {
    if (paymentCurrency !== 'USD' || !igtfPercent) return 0;
    const paid =
      paymentMode === 'CONTADO'
        ? totalInvoiceUSD
        : paymentMode === 'CREDITO_CON_ABONO' && typeof paidAmountUSD === 'number'
          ? Math.max(0, Math.min(totalInvoiceUSD, paidAmountUSD))
          : 0;
    if (!paid) return 0;
    return Number((paid * (igtfPercent / 100)).toFixed(2));
  }, [paymentCurrency, igtfPercent, paymentMode, paidAmountUSD, totalInvoiceUSD]);

  const save = async (selectedOnly: boolean) => {
    const pick = rows.filter((r) => (selectedOnly ? r.selected : true));
    if (!pick.length) {
      toast.error('No hay filas seleccionadas');
      return;
    }

    const paid =
      paymentMode === 'CONTADO'
        ? totalInvoiceUSD
        : paymentMode === 'CREDITO_CON_ABONO' && typeof paidAmountUSD === 'number'
          ? Math.max(0, Math.min(totalInvoiceUSD, paidAmountUSD))
          : 0;

    const payload = {
      supplierId: supplierId || null,
      currency,
      tasaVES: tasaVES || 0,
      invoiceNumber: invoiceNumber || null,
      invoiceDate: invoiceDate || null,
      invoiceImageUrl: invoiceImageUrl || null,
      baseAmountUSD,
      discountPercent,
      discountAmountUSD,
      ivaPercent,
      ivaAmountUSD,
      totalInvoiceUSD,
      itemsCount: pick.length,
      paymentCurrency,
      bankAccountId: bankAccountId || null,
      paymentReference: paymentReference || null,
      igtfPercent,
      igtfAmountUSD,
      paymentMode,
      paidAmountUSD: paid,
      items: pick.map((r) => ({
        productId: r.product?.id || null,
        code: r.code || null,
        name: r.name,
        quantity: Number(r.quantity || 0),
        costUSD: Number(r.costUSD || 0),
        marginClientPct: Number(r.marginClientPct || 0),
        marginAllyPct: Number(r.marginAllyPct || 0),
        marginWholesalePct: Number(r.marginWholesalePct || 0),
        supplierCode: r.supplierCode || null,
        description: r.description || null,
        weightKg: typeof r.weightKg === 'number' ? r.weightKg : null,
        soldBy: r.soldBy || null,
        unitsPerPackage:
          typeof r.unitsPerPackage === 'number' ? r.unitsPerPackage : null,
      })),
    };

    try {
      const res = await fetch('/api/purchases/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');
      toast.success('Compra guardada');
      window.location.href =
        '/dashboard/admin/compras?message=Compra%20guardada';
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo guardar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-semibold">
          Agregar productos desde inventario
        </div>
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Buscar por nombre, SKU o código de barras"
          className="w-full border rounded px-2 py-1 text-sm"
        />
        {searchResults.length > 0 && (
          <div className="border rounded bg-white divide-y max-h-64 overflow-auto text-sm">
            {searchResults.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-2 py-1 hover:bg-gray-50 flex justify-between"
                onClick={() => addExistingProduct(p)}
              >
                <span>
                  {p.name}{" "}
                  <span className="text-gray-500">
                    ({p.sku || "sin SKU"})
                  </span>
                </span>
                <span className="text-gray-600">
                  ${Number(p.priceUSD || 0).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
        {searchQ.trim() && searchResults.length === 0 && (
          <div className="text-xs text-gray-600">
            No se encontraron productos con ese texto. Puedes crear un
            producto nuevo en el formulario de abajo.
          </div>
        )}
      </div>

      <div className="space-y-2 border rounded p-3 bg-gray-50">
        <div className="text-sm font-semibold">
          Crear producto nuevo en esta factura
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          <div>
            <label className="block text-xs text-gray-600">Nombre</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Nombre del producto"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              value={newQuantity}
              onChange={(e) =>
                setNewQuantity(
                  Math.max(1, parseInt(e.target.value || "1", 10)),
                )
              }
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600">
              Costo USD
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={newCostUSD}
              onChange={(e) =>
                setNewCostUSD(Number(e.target.value || 0))
              }
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={addNewProduct}
              className="w-full bg-green-600 text-white px-3 py-1 rounded"
            >
              Agregar a la factura
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1 text-left">C��digo / Nombre / Detalles</th>
              <th className="px-2 py-1">Cantidad</th>
              <th className="px-2 py-1">Costo USD</th>
              <th className="px-2 py-1">% Cliente</th>
              <th className="px-2 py-1">% Aliado</th>
              <th className="px-2 py-1">% Mayorista</th>
              <th className="px-2 py-1">Precio Cliente</th>
              <th className="px-2 py-1">Precio Aliado</th>
              <th className="px-2 py-1">Precio Mayorista</th>
              <th className="px-2 py-1">Estado IA</th>
              <th className="px-2 py-1">Acci��n</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.code || r.name}-${idx}`}>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={r.selected}
                    onChange={(e) => setSelected(idx, e.target.checked)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <div className="font-medium truncate" title={r.name}>
                    {r.name}
                  </div>
                  <div className="text-xs text-gray-500">{r.code || '�?"'}</div>
                  <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-1 text-[11px] text-gray-600">
                    <label className="flex flex-col">
                      <span>C�d. proveedor</span>
                      <input
                        type="text"
                        value={r.supplierCode || ''}
                        onChange={(e) =>
                          setField(idx, {
                            supplierCode: e.target.value || null,
                          })
                        }
                        className="border rounded px-1 py-0.5 text-[11px]"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span>Peso (kg unidad)</span>
                      <input
                        type="number"
                        min={0}
                        step={0.001}
                        value={typeof r.weightKg === 'number' ? r.weightKg : ''}
                        onChange={(e) =>
                          setField(idx, {
                            weightKg:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        className="border rounded px-1 py-0.5 text-[11px]"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span>Unidad venta</span>
                      <select
                        value={r.soldBy || 'UNIT'}
                        onChange={(e) =>
                          setField(idx, { soldBy: e.target.value as any })
                        }
                        className="border rounded px-1 py-0.5 text-[11px]"
                      >
                        <option value="UNIT">Pieza</option>
                        <option value="PACKAGE">Paquete/Caja</option>
                        <option value="BOTH">Ambos</option>
                      </select>
                    </label>
                  </div>
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="number"
                    min={1}
                    value={r.quantity}
                    onChange={(e) =>
                      setField(idx, {
                        quantity: Math.max(
                          1,
                          parseInt(e.target.value || '1', 10),
                        ),
                      })
                    }
                    className="w-20 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={r.costUSD}
                    onChange={(e) =>
                      setField(idx, {
                        costUSD: Math.max(
                          0,
                          parseFloat(e.target.value || '0'),
                        ),
                      })
                    }
                    className="w-24 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={r.marginClientPct}
                    onChange={(e) =>
                      setField(idx, {
                        marginClientPct: Math.max(
                          0,
                          parseFloat(e.target.value || '0'),
                        ),
                      })
                    }
                    className="w-20 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={r.marginAllyPct}
                    onChange={(e) =>
                      setField(idx, {
                        marginAllyPct: Math.max(
                          0,
                          parseFloat(e.target.value || '0'),
                        ),
                      })
                    }
                    className="w-20 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={r.marginWholesalePct}
                    onChange={(e) =>
                      setField(idx, {
                        marginWholesalePct: Math.max(
                          0,
                          parseFloat(e.target.value || '0'),
                        ),
                      })
                    }
                    className="w-20 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="border px-2 py-1 text-right">
                  {r.priceClientUSD.toFixed(2)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {r.priceAllyUSD.toFixed(2)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {r.priceWholesaleUSD.toFixed(2)}
                </td>
                <td className="border px-2 py-1 text-center">{r.estadoIA}</td>
                <td className="border px-2 py-1 text-center">{r.accion}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-2 py-2 text-sm text-gray-500"
                  colSpan={12}
                >
                  No hay productos detectados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">
          Seleccionados: {rows.filter((r) => r.selected).length} | Cantidad total:{" "}
          {totals.qty} | Costo USD: ${totals.usd.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => save(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Guardar seleccionado
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            Guardar todo
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border px-3 py-1 rounded"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="border rounded p-3 bg-gray-50 space-y-3 text-sm">
        <div className="font-semibold">Datos de la factura</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-gray-600">Moneda factura</div>
            <div className="font-semibold">{currency}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Tasa VES/USD</div>
            <div className="font-semibold">
              {currency === 'VES' ? (tasaVES || 0).toFixed(2) : '�?"'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">N�� factura</div>
            <div className="font-semibold">{invoiceNumber || '�?"'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Fecha factura</div>
            <div className="font-semibold">{invoiceDate || '�?"'}</div>
          </div>
        </div>
      </div>

      <div className="border rounded p-3 bg-gray-50 space-y-2 text-sm">
        <div className="font-semibold">Resumen de montos</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-600">Base imponible USD</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="w-full border rounded px-2 py-1"
              value={baseAmountUSD}
              onChange={(e) => setBaseAmountUSD(Number(e.target.value || 0))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">% Descuento</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="w-full border rounded px-2 py-1"
              value={discountPercent}
              onChange={(e) =>
                setDiscountPercent(Number(e.target.value || 0))
              }
            />
            <div className="text-xs text-gray-500 mt-1">
              Monto desc.: ${discountAmountUSD.toFixed(2)}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600">% IVA</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="w-full border rounded px-2 py-1"
              value={ivaPercent}
              onChange={(e) => setIvaPercent(Number(e.target.value || 0))}
            />
            <div className="text-xs text-gray-500 mt-1">
              Monto IVA: ${ivaAmountUSD.toFixed(2)}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600">Total factura USD</label>
            <div className="font-semibold mt-1">
              ${totalInvoiceUSD.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Items seleccionados: {rows.filter((r) => r.selected).length}
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded p-3 bg-gray-50 space-y-3 text-sm">
        <div className="font-semibold">Condiciones de pago y IGTF</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Tipo de pago</div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === 'CONTADO'}
                  onChange={() => setPaymentMode('CONTADO')}
                />
                <span>Contado (pago completo)</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === 'CREDITO_SIN_ABONO'}
                  onChange={() => setPaymentMode('CREDITO_SIN_ABONO')}
                />
                <span>Cr�dito (sin abono)</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === 'CREDITO_CON_ABONO'}
                  onChange={() => setPaymentMode('CREDITO_CON_ABONO')}
                />
                <span>Cr�dito con abono inicial</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">
              Monto abono USD (si aplica)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              disabled={paymentMode !== 'CREDITO_CON_ABONO'}
              className="w-full border rounded px-2 py-1 disabled:opacity-60"
              value={paidAmountUSD === '' ? '' : paidAmountUSD}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  setPaidAmountUSD('');
                  return;
                }
                const n = Number(v);
                setPaidAmountUSD(isNaN(n) ? '' : n);
              }}
            />
            <div className="text-xs text-gray-500 mt-1">
              Se usa para crear el abono inicial en cuentas por pagar.
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">
              IGTF (%) sobre pago en USD
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              disabled={paymentCurrency !== 'USD'}
              className="w-full border rounded px-2 py-1 disabled:opacity-60"
              value={igtfPercent}
              onChange={(e) => setIgtfPercent(Number(e.target.value || 0))}
            />
            <div className="text-xs text-gray-500 mt-1">
              Monto IGTF estimado: ${igtfAmountUSD.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
