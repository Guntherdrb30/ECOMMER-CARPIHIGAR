"use client";
import { Button, Chip, Input } from "@heroui/react";
import { useMemo } from "react";

type Stats = {
  counts?: Record<string, number>;
  mine?: number;
  unassigned?: number;
  unread?: number;
};

export default function InboxFilters({
  status,
  mine,
  unassigned,
  q,
  ai,
  stats,
}: {
  status?: string;
  mine?: boolean;
  unassigned?: boolean;
  q?: string;
  ai?: boolean;
  stats?: Stats;
}) {
  const s = String(status || "").toUpperCase();

  const makeHref = (
    next: Partial<{ status: string; mine: boolean; unassigned: boolean; q: string; ai: boolean }>
  ) => {
    const p = new URLSearchParams();
    const st = typeof next.status === "string" ? next.status : s;
    const mn = typeof next.mine === "boolean" ? next.mine : !!mine;
    const ua = typeof next.unassigned === "boolean" ? next.unassigned : !!unassigned;
    const qq = typeof next.q === "string" ? next.q : (q || "");
    const aiOnly = typeof next.ai === "boolean" ? next.ai : !!ai;
    if (st) p.set("status", st);
    if (mn) p.set("mine", "1");
    if (ua) p.set("unassigned", "1");
    if (qq) p.set("q", qq);
    if (aiOnly) p.set("ai", "1");
    return `?${p.toString()}`;
  };

  const tabs = useMemo(
    () => [
      { key: "", label: "Todas" },
      { key: "OPEN", label: "Abiertas" },
      { key: "IN_PROGRESS", label: "En curso" },
      { key: "PENDING", label: "Pendientes" },
      { key: "RESOLVED", label: "Finalizadas" },
      { key: "CLOSED", label: "Cerradas" },
    ],
    []
  );

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {tabs.map((t) => {
          const selected = (s || "") === t.key;
          const href = makeHref({ status: t.key });
          const count = (t.key ? stats?.counts?.[t.key] : undefined) as number | undefined;
          return (
            <Button
              as="a"
              key={t.key || "all"}
              href={href}
              size="sm"
              variant={selected ? "solid" : "flat"}
            >
              <span className="mr-1">{t.label}</span>
              {typeof count === "number" && (
                <Chip size="sm" variant={selected ? "flat" : "dot"}>
                  {count}
                </Chip>
              )}
            </Button>
          );
        })}
        <span className="mx-1 text-default-400">|</span>
        <Button
          as="a"
          size="sm"
          href={makeHref({ mine: !mine })}
          variant={mine ? "solid" : "flat"}
        >
          Asignadas a mí {typeof stats?.mine === "number" && (
            <Chip size="sm" className="ml-1" variant={mine ? "flat" : "dot"}>
              {stats?.mine}
            </Chip>
          )}
        </Button>
        <Button
          as="a"
          size="sm"
          href={makeHref({ unassigned: !unassigned })}
          variant={unassigned ? "solid" : "flat"}
        >
          Sin asignar {typeof stats?.unassigned === "number" && (
            <Chip size="sm" className="ml-1" variant={unassigned ? "flat" : "dot"}>
              {stats?.unassigned}
            </Chip>
          )}
        </Button>
      </div>

      <form method="get" className="flex items-center gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, email o teléfono"
          size="sm"
          className="flex-1"
        />
        {s && <input type="hidden" name="status" value={s} />}
        {!!mine && <input type="hidden" name="mine" value="1" />}
        {!!unassigned && <input type="hidden" name="unassigned" value="1" />}
        {!!ai && <input type="hidden" name="ai" value="1" />}
        <Button type="submit" color="primary" size="sm">
          Buscar
        </Button>
        <Button as="a" href="/dashboard/admin/mensajeria" size="sm" variant="flat">
          Limpiar
        </Button>
      </form>

      <div className="mt-3 flex items-center gap-2">
        <Button as="a" size="sm" href={makeHref({ ai: !ai })} variant={ai ? "solid" : "flat"}>
          Solo IA {typeof (stats as any)?.ai === "number" && (
            <Chip size="sm" className="ml-1" variant={ai ? "flat" : "dot"}>
              {(stats as any)?.ai}
            </Chip>
          )}
        </Button>
      </div>
    </div>
  );
}
