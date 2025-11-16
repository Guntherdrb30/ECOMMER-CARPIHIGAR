"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speak } from "./speech";
import { useCartStore } from "@/store/cart";

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

function mapStreamChunkToContent(raw: any): AssistantContent | null {
  if (!raw || typeof raw !== "object") return null;
  const t = String(raw.type || "").toLowerCase();

  // UI controls coming from /api/assistant/text (purchase flow)
  if (t === "ui_control") {
    const action = String(raw.action || "").toLowerCase();
    const payload = raw.payload || {};
    if (action === "add_to_cart_visual") {
      const p = payload.product;
      if (p && p.id && p.name) {
        try {
          const store = useCartStore.getState();
          const price = typeof p.priceUSD === "number" ? p.priceUSD : 0;
          const img =
            Array.isArray(p.images) && p.images.length ? p.images[0] : undefined;
          const qtyRaw = Number(payload.quantity || 1);
          const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
          store.addItem(
            { id: p.id, name: p.name, priceUSD: price, image: img },
            qty
          );
        } catch {
          // Si falla el sync local, seguimos sin romper el flujo
        }
        return { type: "rich", products: [p] };
      }
      return null;
    }
    if (action === "open_cart" || action === "show_cart") {
      // El contenido del carrito se renderiza desde el store local
      return { type: "rich", cart: payload.cart || {} };
    }
    // Otros ui_control (show_address_picker, tracking, etc.) no se manejan en este panel legacy
    return null;
  }

  if (t === "products") {
    const products = raw.products || raw.data || [];
    return { type: "rich", products };
  }

  if (t === "cart") {
    const cart = raw.data || raw.cart || {};
    return { type: "rich", cart };
  }

  if (t === "text" || typeof raw.message === "string" || typeof raw.content === "string") {
    return {
      type: "text",
      message: String(raw.message || raw.content || ""),
    };
  }

  if (t === "voice" || raw.audioBase64) {
    const c: AssistantContent = {
      type: "voice",
      audioBase64: String(raw.audioBase64 || ""),
    };
    if (typeof raw.message === "string") c.message = String(raw.message);
    return c;
  }

  if (raw.type === "rich" || raw.products || raw.cart) {
    return raw as AssistantContent;
  }

  return null;
}

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
            content: {
              type: "text",
              message:
                "Hola, soy tu asistente Carpihogar. ��QuǸ deseas comprar hoy?",
            },
          },
        ],
      }));
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const setOpen = useCallback(
    (v: boolean) => setState((s) => ({ ...s, open: v })),
    []
  );

  const append = useCallback(
    (m: AssistantMessage) =>
      setState((s) => ({ ...s, messages: [...s.messages, m] })),
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const sanitize = (s: string) => {
        try {
          const t = String(s).replace(/\s+/g, " ").trim();
          if (!t) return t;
          const out: string[] = [];
          for (const w of t.split(" ")) {
            const last = out[out.length - 1];
            if (last && last.toLowerCase() === w.toLowerCase()) continue;
            out.push(w);
          }
          return out.join(" ");
        } catch {
          return s;
        }
      };
      text = sanitize(text);
      const userMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        from: "user",
        at: Date.now(),
        content: { type: "text", message: text },
      };
      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg],
        loading: true,
      }));
      try {
        const res = await fetch("/api/assistant/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          let msg = "";
          try {
            const j = await res.json();
            msg = String((j as any)?.message || "");
          } catch {}
          append({
            id: crypto.randomUUID(),
            from: "agent",
            at: Date.now(),
            content: {
              type: "text",
              message:
                msg ||
                "Hubo un problema procesando tu mensaje. ��Puedes intentar de nuevo?",
            },
          });
          return;
        }
        if (!res.body) {
          const json = await res.json().catch(() => ({}));
          const msg = (json as any)?.message as string | undefined;
          append({
            id: crypto.randomUUID(),
            from: "agent",
            at: Date.now(),
            content: {
              type: "text",
              message: msg || "Estoy aqu�� para ayudarte.",
            },
          });
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
              const rawText = p.trim();
              if (!rawText) continue;
              try {
                const raw = JSON.parse(rawText);
                const content = mapStreamChunkToContent(raw);
                if (!content) continue;
                receivedAny = true;
                append({
                  id: crypto.randomUUID(),
                  from: "agent",
                  at: Date.now(),
                  content,
                });
                try {
                  const ttsOn =
                    typeof window !== "undefined" &&
                    (window as any).__assistant_tts_enabled === true;
                  if (ttsOn) {
                    if (
                      (content as any)?.products &&
                      Array.isArray((content as any).products) &&
                      (content as any).products.length
                    ) {
                      speak(
                        "Aqu�� tienes algunas opciones disponibles. ��Quieres que te ayude a elegir?"
                      );
                    } else if ((content as any)?.cart) {
                      speak("Te muestro tu carrito actualizado.");
                    } else if ((content as any)?.order) {
                      speak("Estas son las opciones de pago.");
                    } else if ((content as any)?.message) {
                      speak(String((content as any).message));
                    }
                  }
                } catch {}
              } catch {}
            }
          }
          if (!receivedAny) {
            append({
              id: crypto.randomUUID(),
              from: "agent",
              at: Date.now(),
              content: {
                type: "text",
                message:
                  "Recib�� tu mensaje, estoy aqu�� para ayudarte.",
              },
            });
          }
        }
      } catch (e) {
        append({
          id: crypto.randomUUID(),
          from: "agent",
          at: Date.now(),
          content: {
            type: "text",
            message: "Hubo un error. ��Puedes intentar de nuevo?",
          },
        });
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [append]
  );

  const sendAudio = useCallback(
    async (audioBase64: string) => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const res = await fetch("/api/assistant/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64 }),
        });
        if (!res.ok) {
          append({
            id: crypto.randomUUID(),
            from: "agent",
            at: Date.now(),
            content: { type: "text", message: "No pude procesar el audio." },
          });
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
              const rawText = p.trim();
              if (!rawText) continue;
              try {
                const raw = JSON.parse(rawText);
                const content = mapStreamChunkToContent(raw);
                if (!content) continue;
                receivedAny = true;
                append({
                  id: crypto.randomUUID(),
                  from: "agent",
                  at: Date.now(),
                  content,
                });
                try {
                  const ttsOn =
                    typeof window !== "undefined" &&
                    (window as any).__assistant_tts_enabled === true;
                  if (ttsOn) {
                    if (
                      (content as any)?.products &&
                      Array.isArray((content as any).products) &&
                      (content as any).products.length
                    ) {
                      speak(
                        "Aqu�� tienes algunas opciones disponibles. ��Quieres que te ayude a elegir?"
                      );
                    } else if ((content as any)?.cart) {
                      speak("Te muestro tu carrito actualizado.");
                    } else if ((content as any)?.order) {
                      speak("Estas son las opciones de pago.");
                    } else if ((content as any)?.message) {
                      speak(String((content as any).message));
                    }
                  }
                } catch {}
              } catch {}
            }
          }
          if (!receivedAny) {
            append({
              id: crypto.randomUUID(),
              from: "agent",
              at: Date.now(),
              content: {
                type: "text",
                message:
                  "Recib�� tu audio, estoy aqu�� para ayudarte.",
              },
            });
          }
        } else {
          const json = await res.json().catch(() => ({}));
          const content = mapStreamChunkToContent(json) || (json as any);
          append({
            id: crypto.randomUUID(),
            from: "agent",
            at: Date.now(),
            content: content as AssistantContent,
          });
          try {
            const ttsOn =
              typeof window !== "undefined" &&
              (window as any).__assistant_tts_enabled === true;
            if (ttsOn) {
              const c: any = content;
              if (c?.products && Array.isArray(c.products) && c.products.length) {
                speak(
                  "Aqu�� tienes algunas opciones disponibles. ��Quieres que te ayude a elegir?"
                );
              } else if (c?.cart) {
                speak("Te muestro tu carrito actualizado.");
              } else if (c?.order) {
                speak("Estas son las opciones de pago.");
              } else if (c?.message) {
                speak(String(c.message));
              }
            }
          } catch {}
        }
      } catch {
        append({
          id: crypto.randomUUID(),
          from: "agent",
          at: Date.now(),
          content: {
            type: "text",
            message: "No pude procesar el audio.",
          },
        });
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [append]
  );

  const reset = useCallback(() => {
    setState({
      open: true,
      loading: false,
      messages: [
        {
          id: crypto.randomUUID(),
          from: "agent",
          at: Date.now(),
          content: {
            type: "text",
            message:
              "Hola, soy tu asistente Carpihogar. ��QuǸ deseas comprar hoy?",
          },
        },
      ],
    });
  }, []);

  return useMemo(
    () => ({
      open: state.open,
      setOpen,
      messages: state.messages,
      loading: state.loading,
      customerId: state.customerId,
      setCustomerId: (id?: string | null) =>
        setState((s) => ({ ...s, customerId: id || null })),
      sendMessage,
      sendAudio,
      reset,
      append,
    }),
    [state, setOpen, sendMessage, sendAudio, reset, append]
  );
}

