import { getConversations, getConversationWithMessages, sendMessageActionSafe as sendMessageAction, assignConversation, setConversationStatus, getAgents, getConversationStats, sendBulkAdvancedAction, sendDirectMessageAction, searchUsersForCampaign, sendAttachmentAction, sendProductLinkAction, saveConversationAsCustomer } from '@/server/actions/messaging';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PendingButton from '@/components/pending-button';
import UnreadBeacon from '@/components/messaging/unread-beacon';
import ChatMessages from '@/components/messaging/ChatMessages';
import ProductSharePicker from '@/components/messaging/ProductSharePicker';
import PhoneDisplay from '@/components/messaging/PhoneDisplay';

export const dynamic = 'force-dynamic';

type SearchParamsLike = { [k: string]: string | string[] | undefined };

export default async function MensajeriaPage(props: { searchParams?: SearchParamsLike | Promise<SearchParamsLike> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return <div className="p-4">No autorizado</div> as any;
  }

  const myId = (session?.user as any)?.id as string | undefined;

  const sp: any = typeof (props.searchParams as any)?.then === 'function' ? await (props.searchParams as any) : (props.searchParams || {});
  const status = (sp?.status as string) || '';
  const mine = (sp?.mine as string) === '1';
  const unassigned = (sp?.unassigned as string) === '1';
  const q = (sp?.q as string) || '';

  const convos = await getConversations({ status: status || undefined, mine, unassigned, q: q || undefined });
  const uq = (sp?.uq as string) || '';
  const userResults = uq ? await searchUsersForCampaign(uq) : ([] as any[]);
  const selectedId = (sp?.id as string) || (convos[0]?.id || '');
  const [selected, agents, stats] = await Promise.all([
    selectedId ? getConversationWithMessages(selectedId) : (null as any),
    getAgents(),
    getConversationStats(),
  ]);

  return (
    <div className="p-0">
      <UnreadBeacon />
      <div className="px-4 sm:px-6 md:px-8 pt-4">
        <h1 className="text-2xl font-bold mb-2">Mensajería (WhatsApp)</h1>
      </div>

      {/* Campaigns / Bulk sender */}
      {false && (
      <div className="mb-4 p-3 border rounded bg-white">
        <h2 className="font-semibold mb-2">Campañas / Envío masivo</h2>
        <form action={sendBulkAdvancedAction} className="space-y-2">
          <div className="grid md:grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-gray-600">Teléfonos (uno por línea o separados por coma)</label>
              <textarea name="phones" className="w-full border rounded p-2 h-24" placeholder="Ej:
04121234567
04141234567, 04161234567"></textarea>
            </div>
            <div>
              <label className="text-sm text-gray-600">Mensaje</label>
              <textarea name="text" className="w-full border rounded p-2 h-24" placeholder="Escribe tu mensaje"></textarea>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PendingButton className="px-3 py-2 bg-green-600 text-white rounded" pendingText="Enviando...">Enviar masivo</PendingButton>
            <span className="text-xs text-gray-500">Se crearán conversaciones si no existen.</span>
          </div>
        </form>
      </div>
      )}

      {/* Direct message to customer (search) */}
      <div className="mb-4 p-3 border rounded bg-white">
        <h2 className="font-semibold mb-2">Buscar cliente y escribirle</h2>
        <form method="get" className="flex items-center gap-2 mb-2">
          <input name="uq" defaultValue={uq} placeholder="Buscar por nombre, email o teléfono" className="border rounded px-3 py-2 flex-1" />
          <button className="px-3 py-2 bg-gray-800 text-white rounded">Buscar</button>
          {uq && <a href="/dashboard/admin/mensajeria" className="px-3 py-2 border rounded">Limpiar</a>}
        </form>
        {!!uq && (
          <div className="divide-y max-h-60 overflow-auto">
            {userResults.length === 0 ? (
              <div className="p-2 text-sm text-gray-600">No se encontraron usuarios.</div>
            ) : userResults.map((u:any) => (
              <div key={u.id} className="p-2 flex items-center gap-3 justify-between">
                <div className="text-sm">
                  <div className="font-medium">{u.name || u.email}</div>
                  <div className="text-gray-600">{u.email} · {u.phone || 'Sin teléfono'}</div>
                </div>
                <form action={sendDirectMessageAction} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <input name="text" placeholder="Escribir mensaje" className="border rounded px-2 py-1 text-sm" />
                  <PendingButton className="px-2 py-1 bg-blue-600 text-white rounded text-sm" pendingText="Enviando...">Enviar</PendingButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Abiertas</div><div className="text-xl font-semibold">{stats.counts.OPEN}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">En curso</div><div className="text-xl font-semibold">{stats.counts.IN_PROGRESS}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Pendientes</div><div className="text-xl font-semibold">{stats.counts.PENDING}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Finalizadas</div><div className="text-xl font-semibold">{stats.counts.RESOLVED}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Sin asignar</div><div className="text-xl font-semibold">{stats.unassigned}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">No leidos</div><div className="text-xl font-semibold">{stats.unread}</div></div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria">Todas</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=OPEN">Abiertas</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=IN_PROGRESS">En curso</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=PENDING">Pendientes</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=RESOLVED">Finalizadas</a>
        <span className="mx-2">|</span>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?mine=1">Asignadas a mi</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?unassigned=1">Sin asignar</a>
      </div>

      {/* Search */}
      <form method="get" className="mb-4 flex items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, email o telefono" className="border rounded px-3 py-2 flex-1" />
        {status && <input type="hidden" name="status" value={status} />}
        {mine && <input type="hidden" name="mine" value="1" />}
        {unassigned && <input type="hidden" name="unassigned" value="1" />}
        <button className="px-3 py-2 bg-gray-800 text-white rounded">Buscar</button>
        <a href="/dashboard/admin/mensajeria" className="px-3 py-2 border rounded">Limpiar</a>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4 px-4 sm:px-6 md:px-8 pb-4">
        {/* List */}
        <div className="bg-white rounded shadow divide-y max-h-[70vh] overflow-auto">
          {convos.length === 0 ? (
            <div className="p-4 text-gray-600">Aun no hay conversaciones.</div>
          ) : convos.map((c: any) => {
              const params = new URLSearchParams();
              if (status) params.set('status', status as any);
              if (mine) params.set('mine', '1');
              if (unassigned) params.set('unassigned', '1');
              if (q) params.set('q', q as any);
              params.set('id', c.id);
              const href = `?${params.toString()}`;
              const showAssign = !c.assignedToId || c.assignedToId !== myId;
              return (
                <div key={c.id}>
                  <a href={href} className={`block p-3 hover:bg-gray-50 ${c.id === selectedId ? 'bg-gray-100' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-gray-800 truncate flex items-center gap-2">
                        <span className="truncate">{c.user?.name || c.phone}</span>
                        {c.unreadAgent > 0 && (
                          <span className="text-[10px] bg-red-600 text-white rounded-full px-2 py-0.5">{c.unreadAgent}</span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100">{c.status}</span>
                    </div>
                    <div className="text-xs text-gray-600">{new Date(c.lastMessageAt || c.createdAt).toLocaleString()} • {c.assignedTo?.name || c.assignedTo?.email || 'Sin asignar'}</div>
                    <div className="text-xs text-gray-600">Tel: {c.phone}</div>
                  </a>
                  {showAssign && (
                    <form action={assignConversation} className="px-3 py-2 bg-gray-50 flex items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="assignedToId" value={myId || ''} />
                      {status && <input type="hidden" name="status" value={status} />}
                      {mine && <input type="hidden" name="mine" value="1" />}
                      {unassigned && <input type="hidden" name="unassigned" value="1" />}
                      {q && <input type="hidden" name="q" value={q} />}
                      <PendingButton className="px-2 py-1 border rounded text-xs" pendingText="Asignando...">Asignarme</PendingButton>
                    </form>
                  )}
                </div>
              );
            })}
        </div>

        {/* Detail */}
        <div className="md:col-span-2 bg-white rounded shadow flex flex-col max-h-[75vh] overflow-hidden">
          {!selected ? (
            <div className="p-4 text-gray-600">Selecciona una conversacion</div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header con datos del contacto y acciones */}
              <div className="p-3 border-b flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{selected.convo.user?.name || selected.convo.phone}</div>
                  <div className="text-xs text-gray-600">{selected.convo.user?.email || selected.convo.phone}</div>
                  <PhoneDisplay phone={selected.convo.phone} />
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-gray-600">Adjuntar / Compartir</summary>
                    <div className="mt-2 flex flex-col gap-3">
                      <ProductSharePicker toPhone={selected.convo.phone} />
                      <form action={sendAttachmentAction as any} className="flex items-center gap-2">
                        <input type="hidden" name="toPhone" value={selected.convo.phone} />
                        <input name="mediaUrl" className="border rounded px-2 py-1 text-xs flex-1" placeholder="URL imagen/video" />
                        <select name="mediaType" className="border rounded px-2 py-1 text-xs">
                          <option value="image">Imagen</option>
                          <option value="video">Video</option>
                        </select>
                        <input name="caption" className="border rounded px-2 py-1 text-xs" placeholder="Caption (opcional)" />
                        <PendingButton className="px-2 py-1 border rounded text-xs" pendingText="Adjuntando...">Enviar</PendingButton>
                      </form>
                    </div>
                  </details>
                </div>
                <div className="flex items-center gap-2">
                  {!selected.convo.user && (
                    <form action={saveConversationAsCustomer}>
                      <input type="hidden" name="id" value={selected.convo.id} />
                      <PendingButton className="px-2 py-1 border rounded text-sm" pendingText="Guardando...">Guardar en clientes</PendingButton>
                    </form>
                  )}
                  <form action={assignConversation} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={selected.convo.id} />
                    {status && <input type="hidden" name="status" value={status} />}
                    {mine && <input type="hidden" name="mine" value="1" />}
                    {unassigned && <input type="hidden" name="unassigned" value="1" />}
                    {q && <input type="hidden" name="q" value={q} />}
                    <select name="assignedToId" defaultValue={selected.convo.assignedTo?.id || ''} className="border rounded px-2 py-1 text-sm">
                      <option value="">Sin asignar</option>
                      {agents.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name || a.email}</option>
                      ))}
                    </select>
                    <PendingButton className="px-2 py-1 border rounded text-sm" pendingText="Asignando...">Asignar</PendingButton>
                  </form>
                  <form action={setConversationStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={selected.convo.id} />
                    {q && <input type="hidden" name="q" value={q} />}
                    {mine && <input type="hidden" name="mine" value="1" />}
                    {unassigned && <input type="hidden" name="unassigned" value="1" />}
                    <select name="status" defaultValue={selected.convo.status} className="border rounded px-2 py-1 text-sm">
                      <option value="OPEN">Abierta</option>
                      <option value="IN_PROGRESS">En curso</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="RESOLVED">Finalizada</option>
                      <option value="CLOSED">Cerrada</option>
                    </select>
                    <PendingButton className="px-2 py-1 border rounded text-sm" pendingText="Actualizando...">Actualizar</PendingButton>
                  </form>
                </div>
              </div>

              {/* Messages (auto-actualiza) */}
              <ChatMessages conversationId={selected.convo.id} initial={selected.messages as any} />

              {/* Composer */}
              <div className="p-3 border-t bg-white">
                <form action={sendMessageAction} className="flex items-center gap-2">
                  <input type="hidden" name="toPhone" value={selected.convo.phone} />
                  {selected.convo.userId && <input type="hidden" name="userId" value={selected.convo.userId} />}
                  <input name="text" placeholder="Escribe un mensaje" className="flex-1 border rounded-full px-4 py-2" />
                  <PendingButton className="bg-green-600 text-white px-4 py-2 rounded-full" pendingText="Enviando...">Enviar</PendingButton>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


