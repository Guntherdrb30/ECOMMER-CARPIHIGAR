"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speak } from "./speech";

export type AssistantContent = {
  type: "text" | "voice" | "rich";
  message?: string;
  audioBase64?: string;
  products?: any[];
  cart?: any;
  actions?: { key: string; label: string }[];
};

export type AssistantMessage = {
  id: string;
  from: "user" | "agent";
  content: AssistantContent;
  at: number;
};

type State = {
  open: boolean;
  messages: AssistantMessage[];
  loading: boolean;
  customerId?: string | null;
};

const STORAGE_KEY = "carpihogar.assistant.state.v1";

export function useAssistant() {
  const [state, setState] = useState<State>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { open: false, messages: [], loading: false } as State;
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Seed with greeting if empty
    if (!state.messages || state.messages.length === 0) {
      setState((s) => ({
        ...s,
        messages: [
          {
            id: crypto.randomUUID(),
            from: "agent",
            at: Date.now(),
            content: { type: "text", message: "Hola, soy tu asistente Carpihogar. ¿Qué deseas comprar hoy?" },
          },
        ],
      }));
    }
  }, []);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const setOpen = useCallback((v: boolean) => setState((s) => ({ ...s, open: v })), []);

  const append = useCallback((m: AssistantMessage) => setState((s) => ({ ...s, messages: [...s.messages, m] })), []);

  const sendMessage = useCallback(async (text: string) => {
    const sanitize = (s: string) => {
      try {
        const t = String(s).replace(/\s+/g, ' ').trim();
        if (!t) return t;
        const out: string[] = [];
        for (const w of t.split(' ')) {
          const last = out[out.length - 1];
          if (last && last.toLowerCase() === w.toLowerCase()) continue;
          out.push(w);
        }
        return out.join(' ');
      } catch { return s; }
    };
    text = sanitize(text);
    const userMsg: AssistantMessage = { id: crypto.randomUUID(), from: "user", at: Date.now(), content: { type: "text", message: text } };
    setState((s) => ({ ...s, messages: [...s.messages, userMsg], loading: true }));
    try {
      const res = await fetch("/api/assistant/text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) {
        let msg = "";
        try { const j = await res.json(); msg = String((j as any)?.message || ""); } catch {}
        append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: msg || "Hubo un problema procesando tu mensaje. ¿Puedes intentar de nuevo?" } });
        return;
      }
      if (!res.body) {
        const json = await res.json().catch(() => ({}));
        const msg = (json as any)?.message as string | undefined;
        append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: msg || "Estoy aquí para ayudarte." } });
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedAny = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const p of parts) {
            const t = p.trim();
            if (!t) continue;
            try {
              const payload = JSON.parse(t) as AssistantContent;
              receivedAny = true;
              append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: payload });
              try {
                const ttsOn = typeof window !== 'undefined' && (window as any).__assistant_tts_enabled === true;
                if (ttsOn) {
                  if ((payload as any)?.products && Array.isArray((payload as any).products) && (payload as any).products.length) {
                    speak('Aquí tienes algunas opciones disponibles. ¿Quieres que te ayude a elegir?');
                  } else if ((payload as any)?.cart) {
                    speak('Te muestro tu carrito actualizado.');
                  } else if ((payload as any)?.order) {
                    speak('Estas son las opciones de pago.');
                  } else if ((payload as any)?.message) {
                    speak(String((payload as any).message));
                  }
                }
              } catch {}
            } catch {}
          }
        }
        if (!receivedAny) {
          append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: "Recibí tu mensaje, estoy aquí para ayudarte." } });
        }
      }
    } catch (e) {
      append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: "Hubo un error. ¿Puedes intentar de nuevo?" } });
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [append]);

  const sendAudio = useCallback(async (audioBase64: string) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/assistant/audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audioBase64 }) });
      if (!res.ok) {
        append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: "No pude procesar el audio." } });
        return;
      }
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedAny = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const p of parts) {
            const t = p.trim(); if (!t) continue;
            try {
              const payload = JSON.parse(t) as AssistantContent;
              receivedAny = true;
              append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: payload });
              try {
                const ttsOn = typeof window !== 'undefined' && (window as any).__assistant_tts_enabled === true;
                if (ttsOn) {
                  if ((payload as any)?.products && Array.isArray((payload as any).products) && (payload as any).products.length) {
                    speak('Aquí tienes algunas opciones disponibles. ¿Quieres que te ayude a elegir?');
                  } else if ((payload as any)?.cart) {
                    speak('Te muestro tu carrito actualizado.');
                  } else if ((payload as any)?.order) {
                    speak('Estas son las opciones de pago.');
                  } else if ((payload as any)?.message) {
                    speak(String((payload as any).message));
                  }
                }
              } catch {}
            } catch {}
          }
        }
        if (!receivedAny) {
          append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: "Recibí tu audio, estoy aquí para ayudarte." } });
        }
      } else {
        const json = await res.json().catch(() => ({}));
        append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: json as any });
        try { const ttsOn = typeof window !== 'undefined' && (window as any).__assistant_tts_enabled === true; if (ttsOn) { const content: any = json; if (content?.products && Array.isArray(content.products) && content.products.length) { speak('Aquí tienes algunas opciones disponibles. ¿Quieres que te ayude a elegir?'); } else if (content?.cart) { speak('Te muestro tu carrito actualizado.'); } else if (content?.order) { speak('Estas son las opciones de pago.'); } else if (content?.message) { speak(String(content.message)); } } } catch {}
      }
    } catch {
      append({ id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: "No pude procesar el audio." } });
    } finally { setState((s) => ({ ...s, loading: false })); }
  }, [append]);

  const reset = useCallback(() => {
    setState({ open: true, loading: false, messages: [ { id: crypto.randomUUID(), from: "agent", at: Date.now(), content: { type: "text", message: "Hola, soy tu asistente Carpihogar. ¿Qué deseas comprar hoy?" } } ] });
  }, []);

  return useMemo(() => ({
    open: state.open,
    setOpen,
    messages: state.messages,
    loading: state.loading,
    customerId: state.customerId,
    setCustomerId: (id?: string | null) => setState((s) => ({ ...s, customerId: id || null })),
    sendMessage,
    sendAudio,
    reset,
    append,
  }), [state, setOpen, sendMessage, sendAudio, reset, append]);
}



