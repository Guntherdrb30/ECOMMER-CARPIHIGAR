import { getConversations, getConversationWithMessages, sendMessageAction } from '@/server/actions/messaging';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function MensajeriaPage({ searchParams }: { searchParams?: { [k:string]: string|string[]|undefined } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return <div className="p-4">No autorizado</div> as any;
  }

  const convos = await getConversations();
  const selectedId = (searchParams?.id as string) || (convos[0]?.id || '');
  const selected = selectedId ? await getConversationWithMessages(selectedId) : null;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Mensajería (WhatsApp)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow divide-y max-h-[70vh] overflow-auto">
          {convos.length === 0 ? (
            <div className="p-4 text-gray-600">Aún no hay conversaciones.</div>
          ) : convos.map((c:any) => (
            <a key={c.id} href={`?id=${c.id}`} className={`block p-3 hover:bg-gray-50 ${c.id===selectedId?'bg-gray-100':''}`}>
              <div className="text-sm font-medium text-gray-800">{c.user?.name || c.phone}</div>
              <div className="text-xs text-gray-600">{new Date(c.lastMessageAt || c.createdAt).toLocaleString()}</div>
            </a>
          ))}
        </div>

        <div className="md:col-span-2 bg-white rounded shadow flex flex-col max-h-[70vh]">
          {!selected ? (
            <div className="p-4 text-gray-600">Selecciona una conversación</div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b">
                <div className="text-sm font-semibold">{selected.convo.user?.name || selected.convo.phone}</div>
                <div className="text-xs text-gray-600">{selected.convo.phone}</div>
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
                  <button className="bg-blue-600 text-white px-3 py-2 rounded">Enviar</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

