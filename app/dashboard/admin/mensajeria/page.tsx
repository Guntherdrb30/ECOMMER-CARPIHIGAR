import { getConversations, getConversationWithMessages, sendMessageAction, assignConversation, setConversationStatus, getAgents, getConversationStats } from '@/server/actions/messaging';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PendingButton from '@/components/pending-button';
import UnreadBeacon from '@/components/messaging/unread-beacon';

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
  const q = (searchParams?.q as string) || '';
  const convos = await getConversations({ status: status || undefined, mine, unassigned, q: q || undefined });
  const selectedId = (searchParams?.id as string) || (convos[0]?.id || '');
  const [selected, agents, stats] = await Promise.all([
    selectedId ? getConversationWithMessages(selectedId) : (null as any),
    getAgents(),
    getConversationStats(),
  ]);

  const myId = (session?.user as any)?.id as string | undefined;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <UnreadBeacon />
      <h1 className="text-2xl font-bold mb-4">Mensajería (WhatsApp)</h1>
      <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Abiertas</div><div className="text-xl font-semibold">{stats.counts.OPEN}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">En curso</div><div className="text-xl font-semibold">{stats.counts.IN_PROGRESS}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Pendientes</div><div className="text-xl font-semibold">{stats.counts.PENDING}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Finalizadas</div><div className="text-xl font-semibold">{stats.counts.RESOLVED}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">Sin asignar</div><div className="text-xl font-semibold">{stats.unassigned}</div></div>
        <div className="border rounded p-2 bg-white"><div className="text-gray-500">No leídos</div><div className="text-xl font-semibold">{stats.unread}</div></div>
      </div>
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
            {c.unreadAgent > 0 && (
              <div className="px-3 pb-2 text-[10px] text-red-600">No leídos: {c.unreadAgent}</div>
            )}
            {((!c.assignedToId) || (c.assignedToId !== myId)) && (
              <form 
