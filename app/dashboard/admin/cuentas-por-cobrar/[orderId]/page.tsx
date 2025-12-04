import prisma from '@/lib/prisma';
import { addReceivablePayment, addReceivableNote, updateReceivableNote, deleteReceivableNote, updateReceivableDueDate, markReceivablePaid, updateReceivableNotes, sendReceivableReminder, recordReceivableShare, updateReceivableEntry, deleteReceivableEntry } from '@/server/actions/receivables';
import SecretDeleteButton from '@/components/admin/secret-delete-button';

export default async function ReceivableDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      seller: { select: { name: true, email: true } },
      receivable: { include: { entries: { orderBy: { createdAt: 'asc' } }, noteItems: true } },
    }
  });

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Cuenta por cobrar</h1>
        <div className="text-red-600">Orden no encontrada</div>
        <a href="/dashboard/admin/cuentas-por-cobrar" className="mt-4 inline-block px-3 py-1 border rounded">Volver</a>
      </div>
    );
  }

  const entries = order.receivable?.entries || [];
  const notes = (order.receivable as any)?.noteItems || [];
  const abonadoUSD = entries.reduce((a, e) => a + Number((e as any).amountUSD || 0), 0);
  const totalUSD = Number(order.totalUSD || 0);
  const creditsUSD = notes
    .filter((n: any) => String(n.type) === 'CREDITO')
    .reduce((acc: number, n: any) => acc + Number(n.amountUSD || 0), 0);
  const debitsUSD = notes
    .filter((n: any) => String(n.type) === 'DEBITO')
    .reduce((acc: number, n: any) => acc + Number(n.amountUSD || 0), 0);
  const adjustedTotalUSD = totalUSD + debitsUSD - creditsUSD;
  const saldoUSD = Math.max(0, adjustedTotalUSD - abonadoUSD);
  const vence = (order.receivable?.dueDate || (order as any).creditDueDate || null) as Date | null;
  const estado = (order.receivable?.status || 'PENDIENTE') as string;

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cuenta por cobrar</h1>
        <a href="/dashboard/admin/cuentas-por-cobrar" className="px-3 py-1 border rounded">Volver</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border rounded p-4">
          <div className="text-xs uppercase text-gray-500">Orden</div>
          <div className="font-mono">{order.id}</div>
          <div className="mt-2 text-xs text-gray-600">Fecha: {new Date(order.createdAt as any).toLocaleString()}</div>
          <div className="mt-2 text-xs text-gray-600">Vendedor: {order.seller?.name || order.seller?.email || '-'}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs uppercase text-gray-500">Cliente</div>
          <div>{order.user?.name || order.user?.email || 'N/A'}</div>
          <div className="text-xs text-gray-600">Email: {order.user?.email || '-'}</div>
          <div className="text-xs text-gray-600">Tel: {(order.user as any)?.phone || '-'}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs uppercase text-gray-500">Estado</div>
          <div className="text-lg font-semibold">{estado}</div>
          <div className="text-sm">Total original: ${totalUSD.toFixed(2)}</div>
          {creditsUSD > 0 && (
            <div className="text-sm">Notas de crédito: -${creditsUSD.toFixed(2)}</div>
          )}
          {debitsUSD > 0 && (
            <div className="text-sm">Notas de débito: +${debitsUSD.toFixed(2)}</div>
          )}
          <div className="text-sm">Total ajustado: ${adjustedTotalUSD.toFixed(2)}</div>
          <div className="text-sm">Abonado: ${abonadoUSD.toFixed(2)}</div>
          <div className="text-sm font-semibold">Saldo: ${saldoUSD.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Abonos</h2>
          {entries.length === 0 ? (
            <div className="text-sm text-gray-500">Sin abonos</div>
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
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t align-top">
                      <td className="px-3 py-2">{new Date(e.createdAt as any).toLocaleDateString()}</td>
                      <td className="px-3 py-2">${Number((e as any).amountUSD).toFixed(2)}</td>
                      <td className="px-3 py-2">{(e as any).currency}</td>
                      <td className="px-3 py-2">{(e as any).method || '-'}</td>
                      <td className="px-3 py-2">{(e as any).reference || '-'}</td>
                      <td className="px-3 py-2">{(e as any).notes || '-'}</td>
                      <td className="px-3 py-2">
                        <details>
                          <summary className="cursor-pointer text-sm text-blue-700">Editar</summary>
                          <form action={updateReceivableEntry as any} className="mt-2 grid grid-cols-1 md:grid-cols-6 gap-2">
                            <input type="hidden" name="entryId" value={e.id} />
                            <input type="hidden" name="orderId" value={order.id} />
                            <div>
                              <label className="block text-xs">Fecha</label>
                              <input name="paidAt" type="date" defaultValue={new Date(e.createdAt as any).toISOString().slice(0,10)} className="border rounded px-2 py-1 w-full" />
                            </div>
                            <div>
                              <label className="block text-xs">Monto</label>
                              <input name="amount" type="number" step="0.01" defaultValue={Number((e as any).amountUSD).toFixed(2)} className="border rounded px-2 py-1 w-full" />
                            </div>
                            <div>
                              <label className="block text-xs">Moneda</label>
                              <select name="currency" defaultValue={(e as any).currency} className="border rounded px-2 py-1 w-full">
                                <option value="USD">USD</option>
                                <option value="VES">VES</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs">Método</label>
                              <select name="method" defaultValue={(e as any).method || ''} className="border rounded px-2 py-1 w-full">
                                <option value="">-</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="PAGO_MOVIL">Pago Móvil</option>
                                <option value="ZELLE">Zelle</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs">Referencia</label>
                              <input name="reference" defaultValue={(e as any).reference || ''} className="border rounded px-2 py-1 w-full" />
                            </div>
                            <div className="md:col-span-6">
                              <label className="block text-xs">Notas</label>
                              <input name="notes" defaultValue={(e as any).notes || ''} className="border rounded px-2 py-1 w-full" />
                            </div>
                            <div className="md:col-span-6 flex gap-2">
                              <button className="px-2 py-1 border rounded">Guardar</button>
                            </div>
                          </form>
                        </details>
                        <div className="mt-2">
                          <SecretDeleteButton
                            action={deleteReceivableEntry as any}
                            hidden={{ entryId: e.id, orderId: order.id }}
                            label="Eliminar"
                            title="Eliminar abono"
                            description="Esta acción eliminará el abono seleccionado. Requiere clave secreta."
                            className="px-2 py-1 border rounded text-red-700"
                          />
                          <div className="text-xs text-gray-500 mt-1">Requiere clave secreta para eliminar abonos.</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="px-3 py-2">Totales</td>
                    <td className="px-3 py-2">${abonadoUSD.toFixed(2)}</td>
                    <td className="px-3 py-2" colSpan={4}></td>
                    <td className="px-3 py-2">Saldo: ${saldoUSD.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="bg-white border rounded p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Agregar abono</h3>
            <form action={addReceivablePayment as any} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label className="block text-sm">Fecha del abono</label>
                <input name="paidAt" type="date" className="border rounded px-2 py-1 w-full" defaultValue={new Date().toISOString().slice(0,10)} />
              </div>
              <div>
                <label className="block text-sm">Monto</label>
                <input name="amount" type="number" step="0.01" min="0" placeholder="0.00" className="border rounded px-2 py-1 w-full" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="currency" className="border rounded px-2 py-1">
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                </select>
                <select name="method" className="border rounded px-2 py-1">
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="PAGO_MOVIL">Pago Móvil</option>
                  <option value="ZELLE">Zelle</option>
                </select>
              </div>
              <input name="reference" placeholder="Referencia" className="border rounded px-2 py-1 w-full" />
              <input name="notes" placeholder="Notas" className="border rounded px-2 py-1 w-full" />
              <button className="w-full px-3 py-2 bg-green-600 text-white rounded">Agregar abono</button>
            </form>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Notas de crédito / débito</h3>
            <div className="space-y-2 mb-3 max-h-48 overflow-auto text-sm">
              {notes.length === 0 ? (
                <div className="text-gray-500 text-sm">Sin notas registradas</div>
              ) : (
                notes.map((n: any) => (
                  <div key={n.id} className="border rounded px-2 py-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span>
                        <span className="font-semibold mr-1">
                          {String(n.type) === 'CREDITO' ? 'Crédito' : 'Débito'}
                        </span>
                        {n.reason && (
                          <span className="text-gray-700">- {n.reason}</span>
                        )}
                      </span>
                      <span className="font-mono">
                        {String(n.type) === 'CREDITO' ? '-' : '+'}$
                        {Number(n.amountUSD || 0).toFixed(2)}
                      </span>
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-700">
                        Editar
                      </summary>
                      <form
                        action={updateReceivableNote as any}
                        className="mt-1 grid grid-cols-1 md:grid-cols-4 gap-2"
                      >
                        <input type="hidden" name="noteId" value={n.id} />
                        <input type="hidden" name="orderId" value={order.id} />
                        <div>
                          <label className="block text-[11px]">Tipo</label>
                          <select
                            name="type"
                            defaultValue={String(n.type)}
                            className="border rounded px-2 py-1 w-full"
                          >
                            <option value="CREDITO">Crédito</option>
                            <option value="DEBITO">Débito</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px]">Monto USD</label>
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={Number(n.amountUSD || 0).toFixed(2)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px]">Motivo</label>
                          <input
                            name="reason"
                            defaultValue={n.reason || ''}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div className="md:col-span-4">
                          <button className="px-2 py-1 border rounded">
                            Guardar cambios
                          </button>
                        </div>
                      </form>
                    </details>
                    <div className="flex justify-between items-center mt-1">
                      <SecretDeleteButton
                        action={deleteReceivableNote as any}
                        hidden={{ noteId: n.id, orderId: order.id }}
                        label="Eliminar nota"
                        title="Eliminar nota"
                        description="Requiere clave secreta, igual que los abonos."
                        className="px-2 py-1 border rounded text-red-700 text-xs"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <form action={addReceivableNote as any} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="grid grid-cols-2 gap-2">
                <select name="type" className="border rounded px-2 py-1">
                  <option value="CREDITO">Nota de crédito (-)</option>
                  <option value="DEBITO">Nota de débito (+)</option>
                </select>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Monto USD"
                  className="border rounded px-2 py-1 w-full"
                  required
                />
              </div>
              <input
                name="reason"
                placeholder="Motivo (opcional)"
                className="border rounded px-2 py-1 w-full"
              />
              <button className="w-full px-3 py-2 border rounded">
                Agregar nota
              </button>
            </form>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Compartir</h3>
            <div className="space-y-2">
              {/* WhatsApp */}
              <a
                className="w-full inline-block px-3 py-2 border rounded text-center"
                target="_blank"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Cuenta por cobrar - Orden ${order.id}\nCliente: ${order.user?.name || order.user?.email || 'N/A'}\nTotal original: $${totalUSD.toFixed(2)}${creditsUSD > 0 ? `\nNotas de crédito: -$${creditsUSD.toFixed(2)}` : ''}${debitsUSD > 0 ? `\nNotas de débito: +$${debitsUSD.toFixed(2)}` : ''}\nTotal ajustado: $${adjustedTotalUSD.toFixed(2)}\nAbonado: $${abonadoUSD.toFixed(2)}\nSaldo: $${saldoUSD.toFixed(2)}${vence ? `\nVence: ${new Date(vence as any).toLocaleDateString()}` : ''}\n\nEstado de cuenta (PDF): /api/receivables/${order.id}/statement/pdf`,
                )}`}
              >
                Compartir por WhatsApp
              </a>
              <form action={recordReceivableShare as any}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="via" value="WHATSAPP" />
                <button className="w-full px-3 py-2 border rounded" type="submit">Registrar envío por WhatsApp</button>
              </form>
              {/* Email */}
              <form action={sendReceivableReminder as any}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="w-full px-3 py-2 border rounded" type="submit">Enviar por Email</button>
              </form>
              <div className="grid grid-cols-2 gap-2">
                <a className="px-3 py-2 border rounded text-center" target="_blank" href={`/api/receivables/${order.id}/statement/csv`}>Descargar CSV</a>
                <a className="px-3 py-2 border rounded text-center" target="_blank" href={`/api/receivables/${order.id}/statement/pdf`}>Descargar PDF</a>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Vencimiento</h3>
            <form action={updateReceivableDueDate as any} className="flex gap-2 items-end">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="flex-1">
                <label className="block text-sm">Fecha de vencimiento</label>
                <input name="dueDate" type="date" defaultValue={vence ? new Date(vence as any).toISOString().slice(0,10) : ''} className="border rounded px-2 py-1 w-full" />
              </div>
              <button className="px-3 py-2 border rounded">Guardar</button>
            </form>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Observaciones</h3>
            <form action={updateReceivableNotes as any} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea name="notes" rows={4} defaultValue={order.receivable?.notes || ''} className="border rounded px-2 py-1 w-full"></textarea>
              <button className="px-3 py-2 border rounded">Guardar notas</button>
            </form>
          </div>
          {saldoUSD > 0 && (
            <form action={markReceivablePaid as any}>
              <input type="hidden" name="orderId" value={order.id} />
              <button className="w-full px-3 py-2 border rounded">Marcar Pagado</button>
            </form>
          )}
        </div>
      </div>

      {/* Historial combinado */}
      <div className="bg-white border rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Historial</h2>
        {(() => {
          const logsPromise = prisma.auditLog.findMany({
            where: {
              OR: [
                { action: 'RECEIVABLE_REMINDER_SENT' },
                { action: 'RECEIVABLE_SHARED' },
              ],
              details: { contains: `order:${order.id}` },
            },
            orderBy: { createdAt: 'asc' },
          });
          return (
            <HistoryList orderId={order.id} entries={entries} logsPromise={logsPromise} />
          );
        })()}
      </div>
    </div>
  );
}

// Async child to render history list
async function HistoryList({ orderId, entries, logsPromise }: { orderId: string; entries: any[]; logsPromise: Promise<any[]> }) {
  const logs = await logsPromise;
  type Hist = { when: Date; kind: 'ABONO'|'EMAIL'|'WHATSAPP'; desc: string };
  const rows: Hist[] = [];
  for (const e of (entries || [])) {
    rows.push({ when: new Date((e as any).createdAt as any), kind: 'ABONO', desc: `$${Number((e as any).amountUSD).toFixed(2)} ${(e as any).currency} ${(e as any).method || ''} ${(e as any).reference || ''}`.trim() });
  }
  for (const l of (logs || [])) {
    const via = /via:(\w+)/.exec(String((l as any).details || ''))?.[1] || '';
    const kind = via === 'EMAIL' ? 'EMAIL' : 'WHATSAPP';
    rows.push({ when: new Date((l as any).createdAt as any), kind, desc: `Compartido por ${kind} (${String((l as any).details || '')})` });
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
