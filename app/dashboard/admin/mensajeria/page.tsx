import { getConversations, getConversationWithMessages, sendMessageAction, assignConversation, setConversationStatus, getAgents, getConversationStats } from '@/server/actions/messaging';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PendingButton from '@/components/pending-button';

export const dynamic = 'force-dynamic';

export default async function MensajeriaPage({ searchParams }: { searchParams?: { [k:string]: string|string[]|undefined } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return <div className="p-4">No autorizado</div> as any;
  }

  const status = (searchParams?.status as string) || '';
  const mine = (searchParams?.mine as string) === '1';
  const unassigned = (searchParams?.unassigned as string) === '1';
  const q = (searchParams?.q as string) || '';\n  const convos = await getConversations({ status: status || undefined, mine, unassigned, q: q || undefined });
  const selectedId = (searchParams?.id as string) || (convos[0]?.id || '');
  const [selected, agents, stats] = await Promise.all([
    selectedId ? getConversationWithMessages(selectedId) : (null as any),
    getAgents(),
    getConversationStats(),
  ]);

  const myId = (session?.user as any)?.id as string | undefined;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Mensajería (WhatsApp)</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria">Todas</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=OPEN">Abiertas</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=IN_PROGRESS">En curso</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=PENDING">Pendientes</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?status=RESOLVED">Finalizadas</a>
        <span className="mx-2">|</span>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?mine=1">Asignadas a mÃ­</a>
        <a className="px-2 py-1 border rounded" href="/dashboard/admin/mensajeria?unassigned=1">Sin asignar</a>
      </div>
      <form method="get" className="mb-4 flex items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, email o teléfono" className="border rounded px-3 py-2 flex-1" />
        {status && <input type="hidden" name="status" value={status} />}
        {mine && <input type="hidden" name="mine" value="1" />}
        {unassigned && <input type="hidden" name="unassigned" value="1" />}
        <button className="px-3 py-2 bg-gray-800 text-white rounded">Buscar</button>
        <a href="/dashboard/admin/mensajeria" className="px-3 py-2 border rounded">Limpiar</a>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow divide-y max-h-[70vh] overflow-auto">
          {convos.length === 0 ? (
            <div className="p-4 text-gray-600">AÃºn no hay conversaciones.</div>
          ) : convos.map((c:any) => (
            <a key={c.id} href={`?id=${c.id}`} className={`block p-3 hover:bg-gray-50 ${c.id===selectedId?'bg-gray-100':''}`}>
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-800 truncate">{c.user?.name || c.phone}</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100">{c.status}</span>
              </div>
              <div className="text-xs text-gray-600">{new Date(c.lastMessageAt || c.createdAt).toLocaleString()} â€¢ {c.assignedTo?.name || c.assignedTo?.email || 'Sin asignar'}</div>
            </a>
          ))}
        </div>

        <div className="md:col-span-2 bg-white rounded shadow flex flex-col max-h-[70vh]">
          {!selected ? (
            <div className="p-4 text-gray-600">Selecciona una conversaciÃ³n</div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{selected.convo.user?.name || selected.convo.phone}</div>
                  <div className="text-xs text-gray-600">{selected.convo.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={assignConversation} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={selected.convo.id} />
                    <select name="assignedToId" defaultValue={selected.convo.assignedTo?.id || ''} className="border rounded px-2 py-1 text-sm">
                      <option value="">Sin asignar</option>
                      {agents.map((a:any) => (
                        <option key={a.id} value={a.id}>{a.name || a.email}</option>
                      ))}
                    </select>
                    <PendingButton className="px-2 py-1 border rounded text-sm" pendingText="Asignandoâ€¦">Asignar</PendingButton>
                  </form>
                  <form action={setConversationStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={selected.convo.id} />
                    <select name="status" defaultValue={selected.convo.status} className="border rounded px-2 py-1 text-sm">
                      <option value="OPEN">Abierta</option>
                      <option value="IN_PROGRESS">En curso</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="RESOLVED">Finalizada</option>
                      <option value="CLOSED">Cerrada</option>
                    </select>
                    <PendingButton className="px-2 py-1 border rounded text-sm" pendingText="Actualizandoâ€¦">Actualizar</PendingButton>
                  </form>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-2">
                {selected.messages.map((m:any) => (
                  <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded ${m.direction==='OUT'?'bg-blue-600 text-white ml-auto':'bg-gray-100 text-gray-900'}`}>
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <form action={sendMessageAction} className="flex items-center gap-2">
                  <input type="hidden" name="toPhone" value={selected.convo.phone} />
                  {selected.convo.userId && <input type="hidden" name="userId" value={selected.convo.userId} />}
                  <input name="text" placeholder="Escribe un mensaje" className="flex-1 border rounded px-3 py-2" />
                  <PendingButton className="bg-blue-600 text-white px-3 py-2 rounded" pendingText="Enviandoâ€¦">Enviar</PendingButton>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








