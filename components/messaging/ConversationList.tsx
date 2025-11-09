"use client";
import { Listbox, ListboxItem, Avatar, Chip, Badge } from "@heroui/react";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ConversationItem = {
  id: string;
  phone: string;
  status: string;
  unreadAgent?: number;
  lastMessageAt?: string | null;
  createdAt?: string;
  user?: { name?: string | null; email?: string | null } | null;
  assignedTo?: { name?: string | null; email?: string | null } | null;
};

export default function ConversationList({
  items,
  selectedId,
  filters,
}: {
  items: ConversationItem[];
  selectedId?: string;
  filters?: { status?: string; mine?: boolean; unassigned?: boolean; q?: string };
}) {
  const router = useRouter();
  const params = useSearchParams();

  const onAction = useCallback(
    (key: React.Key) => {
      const p = new URLSearchParams(params?.toString() || "");
      p.set("id", String(key));
      router.push(`?${p.toString()}`);
    },
    [params, router]
  );

  const timeText = (d?: string | null) => {
    try {
      if (!d) return "";
      const dt = new Date(d);
      return dt.toLocaleString();
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      {items.length === 0 ? (
        <div className="p-4 text-default-500">Aún no hay conversaciones.</div>
      ) : (
        <Listbox
          aria-label="Conversaciones"
          selectedKeys={new Set(selectedId ? [selectedId] : [])}
          onAction={onAction}
          className="max-h-[70vh] overflow-auto divide-y"
        >
          {items.map((c) => {
            const name = c.user?.name || c.phone;
            const sub = c.assignedTo?.name || c.assignedTo?.email || "Sin asignar";
            const ts = timeText(c.lastMessageAt || c.createdAt || null);
            const isNew = (c.unreadAgent || 0) > 0;
            return (
              <ListboxItem
                key={c.id}
                textValue={name || c.phone}
                startContent={<Avatar size="sm" name={name || c.phone} />}
                endContent={
                  <div className="flex items-center gap-2">
                    {c.unreadAgent && c.unreadAgent > 0 ? (
                      <Badge color="danger" content={c.unreadAgent} />
                    ) : null}
                    <Chip size="sm" variant="flat">
                      {c.status}
                    </Chip>
                  </div>
                }
                className="py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className={`truncate text-sm ${isNew ? 'font-semibold' : 'font-medium'}`}>{name}</div>
                    <div className="text-xs text-default-500 truncate">
                      {sub}
                    </div>
                  </div>
                  <div className="text-[10px] text-default-400 ml-2">{ts}</div>
                </div>
                {isNew && (
                  <div className="mt-1">
                    <Chip size="sm" color="primary" variant="flat">Nuevo</Chip>
                  </div>
                )}
              </ListboxItem>
            );
          })}
        </Listbox>
      )}
    </div>
  );
}
