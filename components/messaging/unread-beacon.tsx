"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function UnreadBeacon({ pollMs = 15000 }: { pollMs?: number }) {
  const prev = useRef<number>(0);
  useEffect(() => {
    let alive = true;
    let t: any;
    const beep = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; g.gain.value = 0.05; o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 180);
      } catch {}
    };
    const run = async () => {
      try {
        const res = await fetch('/api/messaging/unread', { cache: 'no-store' });
        const json = await res.json();
        const unread = Number(json?.unread || 0);
        if (!alive) return;
        if (unread > prev.current) {
          beep();
          try { toast.info(`Nuevo mensaje (${unread} sin leer)`); } catch {}
          try { document.title = `(${unread}) Mensajería — Carpihogar`; } catch {}
        } else if (unread === 0) {
          try { document.title = `Mensajería — Carpihogar`; } catch {}
        }
        prev.current = unread;
      } catch {}
      t = setTimeout(run, pollMs);
    };
    run();
    return () => { alive = false; if (t) clearTimeout(t); };
  }, [pollMs]);
  return null;
}

