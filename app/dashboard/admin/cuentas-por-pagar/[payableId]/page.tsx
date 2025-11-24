import prisma from '@/lib/prisma';
import SecretDeleteButton from '@/components/admin/secret-delete-button';
import {
  addPayablePayment,
  updatePayableDueDate,
  updatePayableNotes,
  updatePayableEntry,
  deletePayableEntry,
  markPayablePaid,
  recordPayableShare,
  sendPayableStatement,
} from '@/server/actions/payables';
import { getBankAccounts } from '@/server/actions/banking';

export default async function PayableDetailPage({
  params,
}: {
  params: Promise<{ payableId: string }>;
}) {
  const { payableId } = await params;

  const payable = await prisma.payable.findUnique({
    where: { id: payableId },
    include: {
      entries: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!payable) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Cuenta por pagar</h1>
        <div className="text-red-600">Cuenta por pagar no encontrada</div>
        <a
          href="/dashboard/admin/cuentas-por-pagar"
          className="mt-4 inline-block px-3 py-1 border rounded"
        >
          Volver
        </a>
      </div>
    );
  }

  const [purchase, bankAccounts] = await Promise.all([
    payable.purchaseId
      ? prisma.purchase.findUnique({
          where: { id: payable.purchaseId },
          include: { supplier: true },
        })
      : Promise.resolve(null),
    getBankAccounts().catch(() => [] as any[]),
  ]);

  const supplier = purchase?.supplier || null;
  const entries = payable.entries || [];
  const abonadoUSD = entries.reduce(
    (a: number, e: any) => a + Number(e.amountUSD || 0),
    0,
  );
  const totalUSD = Number(
    payable.totalUSD || (purchase as any)?.totalUSD || 0,
  );
  const saldoUSD = Math.max(0, totalUSD - abonadoUSD);
  const vence = (payable.dueDate || null) as Date | null;
  const estado = String(payable.status || 'PENDIENTE');

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cuenta por pagar</h1>
        <a
          href="/dashboard/admin/cuentas-por-pagar"
          className="px-3 py-1 border rounded"
        >
          Volver
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border rounded p-4">
          <div className="text-xs uppercase text-gray-500">Compra</div>
          <div className="font-mono">
            {purchase?.id || payable.purchaseId || '(sin compra)'}
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Factura:{' '}
            {purchase?.invoiceNumber
              ? String(purchase.invoiceNumber)
              : 'Sin número'}
          </div>
          {purchase?.invoiceDate && (
            <div className="mt-1 text-xs text-gray-600">
              Fecha factura:{' '}
              {new Date(purchase.invoiceDate as any).toLocaleDateString()}
            </div>
          )}
          <div className="mt-1 text-xs text-gray-600">
            Creada:{' '}
            {new Date(payable.createdAt as any).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs uppercase text-gray-500">Proveedor</div>
          <div>{supplier?.name || '(sin proveedor)'}</div>
          {supplier?.taxId && (
            <div className="text-xs text-gray-600">RIF: {supplier.taxId}</div>
          )}
          {supplier?.email && (
            <div className="text-xs text-gray-600">
              Email: {supplier.email}
            </div>
          )}
          {supplier?.phone && (
            <div className="text-xs text-gray-600">
              Tel: {supplier.phone}
            </div>
          )}
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs uppercase text-gray-500">Estado</div>
          <div className="text-lg font-semibold">{estado}</div>
          <div className="text-sm">Total: ${totalUSD.toFixed(2)}</div>
          <div className="text-sm">Pagado: ${abonadoUSD.toFixed(2)}</div>
          <div className="text-sm font-semibold">
            Saldo: ${saldoUSD.toFixed(2)}
          </div>
          {vence && (
            <div className="mt-1 text-xs text-gray-600">
              Vence: {new Date(vence as any).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Pagos / Abonos</h2>
          {entries.length === 0 ? (
            <div className="text-sm text-gray-500">Sin pagos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Monto USD</th>
                    <th className="px-3 py-2">Moneda</th>
                    <th className="px-3 py-2">Método</th>
                    <th className="px-3 py-2">Referencia</th>
                    <th className="px-3 py-2">Notas</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e: any) => (
                    <tr key={e.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        {new Date(e.createdAt as any).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        ${Number(e.amountUSD).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">{e.currency}</td>
                      <td className="px-3 py-2">{e.method || '-'}</td>
                      <td className="px-3 py-2">{e.reference || '-'}</td>
                      <td className="px-3 py-2">{e.notes || '-'}</td>
                      <td className="px-3 py-2">
                        <details>
                          <summary className="cursor-pointer text-sm text-blue-700">
                            Editar
                          </summary>
                          <form
                            action={updatePayableEntry as any}
                            className="mt-2 grid grid-cols-1 md:grid-cols-6 gap-2"
                          >
                            <input
                              type="hidden"
                              name="entryId"
                              value={e.id}
                            />
                            <input
                              type="hidden"
                              name="payableId"
                              value={payable.id}
                            />
                            <div>
                              <label className="block text-xs">Fecha</label>
                              <input
                                name="paidAt"
                                type="date"
                                defaultValue={new Date(
                                  e.createdAt as any,
                                )
                                  .toISOString()
                                  .slice(0, 10)}
                                className="border rounded px-2 py-1 w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs">Monto</label>
                              <input
                                name="amount"
                                type="number"
                                step="0.01"
                                defaultValue={Number(e.amountUSD).toFixed(2)}
                                className="border rounded px-2 py-1 w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs">Moneda</label>
                              <select
                                name="currency"
                                defaultValue={e.currency}
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="USD">USD</option>
                                <option value="VES">VES</option>
                                <option value="USDT">USDT</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs">Método</label>
                              <select
                                name="method"
                                defaultValue={e.method || ''}
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="">-</option>
                                <option value="TRANSFERENCIA">
                                  Transferencia
                                </option>
                                <option value="PAGO_MOVIL">Pago Móvil</option>
                                <option value="ZELLE">Zelle</option>
                                <option value="EFECTIVO">Efectivo</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs">
                                Referencia
                              </label>
                              <input
                                name="reference"
                                defaultValue={e.reference || ''}
                                className="border rounded px-2 py-1 w-full"
                              />
                            </div>
                            <div className="md:col-span-6">
                              <label className="block text-xs">Notas</label>
                              <input
                                name="notes"
                                defaultValue={e.notes || ''}
                                className="border rounded px-2 py-1 w-full"
                              />
                            </div>
                            <div className="md:col-span-6 flex gap-2">
                              <button className="px-2 py-1 border rounded">
                                Guardar
                              </button>
                            </div>
                          </form>
                        </details>
                        <div className="mt-2">
                          <SecretDeleteButton
                            action={deletePayableEntry as any}
                            hidden={{
                              entryId: e.id,
                              payableId: payable.id,
                            }}
                            label="Eliminar"
                            title="Eliminar pago"
                            description="Esta acción eliminará el pago seleccionado. Requiere clave secreta."
                            className="px-2 py-1 border rounded text-red-700"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Requiere clave secreta para eliminar pagos.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="px-3 py-2">Totales</td>
                    <td className="px-3 py-2">
                      ${abonadoUSD.toFixed(2)}
                    </td>
                    <td className="px-3 py-2" colSpan={4}></td>
                    <td className="px-3 py-2">
                      Saldo: ${saldoUSD.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="bg-white border rounded p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Agregar pago</h3>
            <form action={addPayablePayment as any} className="space-y-2">
              <input type="hidden" name="payableId" value={payable.id} />
              <div>
                <label className="block text-sm">Monto</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="border rounded px-2 py-1 w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="currency"
                  className="border rounded px-2 py-1"
                  defaultValue="USD"
                >
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                  <option value="USDT">USDT</option>
                </select>
                <select
                  name="method"
                  className="border rounded px-2 py-1"
                  defaultValue="TRANSFERENCIA"
                >
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="PAGO_MOVIL">Pago Móvil</option>
                  <option value="ZELLE">Zelle</option>
                  <option value="EFECTIVO">Efectivo</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <select
                  name="bankAccountId"
                  defaultValue=""
                  className="border rounded px-2 py-1 w-full bg-white"
                >
                  <option value="">Sin banco</option>
                  {bankAccounts.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.currency})
                    </option>
                  ))}
                </select>
                <input
                  name="reference"
                  placeholder="Referencia"
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <input
                name="notes"
                placeholder="Notas"
                className="border rounded px-2 py-1 w-full"
              />
              <button className="w-full px-3 py-2 bg-green-600 text-white rounded">
                Registrar pago
              </button>
            </form>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Compartir</h3>
            <div className="space-y-2">
              <a
                className="w-full inline-block px-3 py-2 border rounded text-center"
                target="_blank"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Cuenta por pagar - Compra ${
                    purchase?.id || payable.purchaseId || ''
                  }\nProveedor: ${
                    supplier?.name || supplier?.contactName || 'N/A'
                  }\nTotal: $${totalUSD.toFixed(
                    2,
                  )}\nPagado: $${abonadoUSD.toFixed(
                    2,
                  )}\nSaldo: $${saldoUSD.toFixed(2)}${
                    vence
                      ? `\nVence: ${new Date(vence as any).toLocaleDateString()}`
                      : ''
                  }\n\nEstado de cuenta (PDF): /api/payables/${
                    payable.id
                  }/statement/pdf`,
                )}`}
              >
                Compartir por WhatsApp
              </a>
              <form action={recordPayableShare as any}>
                <input type="hidden" name="payableId" value={payable.id} />
                <input type="hidden" name="via" value="WHATSAPP" />
                <button
                  className="w-full px-3 py-2 border rounded"
                  type="submit"
                >
                  Registrar envío por WhatsApp
                </button>
              </form>
              <form action={sendPayableStatement as any}>
                <input type="hidden" name="payableId" value={payable.id} />
                <button
                  className="w-full px-3 py-2 border rounded"
                  type="submit"
                >
                  Enviar por Email
                </button>
              </form>
              <div className="grid grid-cols-1 gap-2">
                <a
                  className="px-3 py-2 border rounded text-center"
                  target="_blank"
                  href={`/api/payables/${payable.id}/statement/pdf`}
                >
                  Descargar PDF
                </a>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Vencimiento</h3>
            <form
              action={updatePayableDueDate as any}
              className="flex gap-2 items-end"
            >
              <input type="hidden" name="payableId" value={payable.id} />
              <div className="flex-1">
                <label className="block text-sm">Fecha de vencimiento</label>
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={
                    vence
                      ? new Date(vence as any).toISOString().slice(0, 10)
                      : ''
                  }
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <button className="px-3 py-2 border rounded">Guardar</button>
            </form>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Observaciones</h3>
            <form
              action={updatePayableNotes as any}
              className="space-y-2"
            >
              <input type="hidden" name="payableId" value={payable.id} />
              <textarea
                name="notes"
                rows={4}
                defaultValue={payable.notes || ''}
                className="border rounded px-2 py-1 w-full"
              ></textarea>
              <button className="px-3 py-2 border rounded">
                Guardar notas
              </button>
            </form>
          </div>
          {saldoUSD > 0 && (
            <form action={markPayablePaid as any}>
              <input type="hidden" name="payableId" value={payable.id} />
              <button className="w-full px-3 py-2 border rounded">
                Marcar Pagado
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Historial</h2>
        {(() => {
          const logsPromise = prisma.auditLog.findMany({
            where: {
              OR: [
                { action: 'PAYABLE_SHARED' },
                { action: 'PAYABLE_STATEMENT_SENT' },
              ],
              details: { contains: `payable:${payable.id}` },
            },
            orderBy: { createdAt: 'asc' },
          });
          return (
            <HistoryList
              payableId={payable.id}
              entries={entries as any[]}
              logsPromise={logsPromise}
            />
          );
        })()}
      </div>
    </div>
  );
}

async function HistoryList({
  payableId,
  entries,
  logsPromise,
}: {
  payableId: string;
  entries: any[];
  logsPromise: Promise<any[]>;
}) {
  const logs = await logsPromise;
  type Hist = { when: Date; kind: 'PAGO' | 'EMAIL' | 'WHATSAPP'; desc: string };
  const rows: Hist[] = [];

  for (const e of entries || []) {
    rows.push({
      when: new Date((e as any).createdAt as any),
      kind: 'PAGO',
      desc: `$${Number((e as any).amountUSD).toFixed(2)} ${(e as any).currency} ${(e as any).method || ''} ${(e as any).reference || ''}`.trim(),
    });
  }
  for (const l of logs || []) {
    const via =
      /via:(\w+)/.exec(String((l as any).details || ''))?.[1] || '';
    const kind: 'EMAIL' | 'WHATSAPP' =
      via === 'EMAIL' ? 'EMAIL' : 'WHATSAPP';
    rows.push({
      when: new Date((l as any).createdAt as any),
      kind,
      desc: `Compartido por ${kind} (${String((l as any).details || '')})`,
    });
  }
  rows.sort((a, b) => a.when.getTime() - b.when.getTime());

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-3 py-2">{r.when.toLocaleString()}</td>
              <td className="px-3 py-2">{r.kind}</td>
              <td className="px-3 py-2">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

