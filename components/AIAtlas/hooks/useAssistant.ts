"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "ui";
  type: "text" | "audio" | "products" | "cart" | "address" | "rich";
  content?: string;
  audioBase64?: string;
  data?: any;
  ts: number;
};

type UiView = "chat" | "cart" | "address" | "products" | "payment_steps";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now();
}

type PurchaseStep =
  | "start"
  | "ensureAddress"
  | "shipping"
  | "createOrder"
  | "sendToken"
  | "validateToken"
  | "showPayment"
  | "submitPayment";

export function useAssistant() {
  const [open, setOpen] = useState<boolean>(false);
  const [view, setView] = useState<UiView>("chat");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string>("");
  const booted = useRef(false);

  // Load from localStorage
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    try {
      const saved = JSON.parse(
        localStorage.getItem("aiatlas_messages") || "[]",
      );
      const wasOpen = localStorage.getItem("aiatlas_open") === "1";
      if (Array.isArray(saved) && saved.length > 0) {
        setMessages(saved);
      } else {
        const welcome: AssistantMessage = {
          id: uid(),
          role: "assistant",
          type: "text",
          ts: Date.now(),
          content:
            "El gusto es mío.\nSoy tu asistente Carpihogar AI.\nTe ayudo a buscar productos, comparar opciones y completar tu compra.\n¿En qué puedo ayudarte hoy?",
        };
        setMessages([welcome]);
      }
      setOpen(wasOpen);
    } catch {
      // ignore
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem("aiatlas_messages", JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("aiatlas_open", open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [open]);

  const appendMessage = useCallback((m: AssistantMessage) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  // Añade texto del asistente evitando duplicados consecutivos
  const appendAssistantText = useCallback((raw: string) => {
    const text = String(raw || "").trim();
    if (!text) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.role === "assistant" &&
        last.type === "text" &&
        String(last.content || "").trim() === text
      ) {
        return prev;
      }
      const msg: AssistantMessage = {
        id: uid(),
        role: "assistant",
        type: "text",
        ts: Date.now(),
        content: text,
      };
      return [...prev, msg];
    });
  }, []);

  const handleUiControl = useCallback(
    (control: any) => {
      if (!control || control.type !== "ui_control") return;
      const a = String(control.action || "").toLowerCase();
      if (a === "open_cart" || a === "show_cart") setView("cart");
      if (a === "open_address_form" || a === "show_address_picker")
        setView("address");
      if (a === "show_products") setView("products");
      if (a === "show_payment_steps" || a === "show_payment_form")
        setView("payment_steps");
      if (a === "add_to_cart_visual") {
        const p = control.payload?.product;
        if (p) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              type: "products",
              ts: Date.now(),
              data: [p],
            },
          ]);
        }
      }
      if (a === "show_tracking") {
        setView("chat");
        const pld = control.payload || {};
        const status = String(pld.status ?? pld.estado ?? "");
        const state = String(pld.state ?? pld.detalle ?? "");
        appendAssistantText(`Tracking: ${status} - Estado: ${state}`);
      }
    },
    [appendAssistantText],
  );

  const continuePurchase = useCallback(
    async (step: PurchaseStep, input?: any) => {
      try {
        const res = await fetch("/api/flow/purchase/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step, input }),
        });
        const json = await res.json();
        if (json?.message) {
          appendAssistantText(json.message);
        }
        if (json?.ui?.type === "ui_control") {
          const a = String(json.ui.action || "").toLowerCase();
          if (a === "open_cart" || a === "show_cart") setView("cart");
          if (a === "open_address_form") setView("address");
          if (
            a === "show_products" ||
            a === "show_shipping" ||
            a === "show_order_summary"
          )
            setView("products");
          if (a === "await_token") setView("chat");
          if (a === "show_payment_methods") setView("payment_steps");
          if (a === "payment_submitted") setView("chat");
        }
        if (json?.order?.id) setLastOrderId(String(json.order.id));
        return json;
      } catch {
        appendAssistantText(
          "No pude avanzar el flujo de compra. ¿Intentamos de nuevo?",
        );
        return null;
      }
    },
    [appendAssistantText],
  );

  const sendText = useCallback(
    async (text: string, opts?: { imageBase64?: string }) => {
      const userMsg: AssistantMessage = {
        id: uid(),
        role: "user",
        type: "text",
        content: text,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      try {
        // Atajo: iniciar flujo de compra si el usuario lo pide explícitamente
        if (/comprar ahora|proceder al pago|ir a pagar/i.test(text)) {
          try {
            await (continuePurchase as any)?.("start");
          } catch {
            // ignore
          }
        } else if (/s[ií] autorizo|si autorizo|\b\d{6}\b/i.test(text)) {
          const tokenMatch = text.match(/\b(\d{6})\b/);
          try {
            await (continuePurchase as any)?.("validateToken", {
              orderId: lastOrderId,
              confirmText: text,
              token: tokenMatch?.[1],
            });
          } catch {
            // ignore
          }
        }
        const res = await fetch("/api/assistant/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, imageBase64: opts?.imageBase64 }),
        });
        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
              const chunk = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 2);
              if (!chunk) continue;
              try {
                const obj = JSON.parse(chunk);
                if (obj?.type === "ui_control") {
                  handleUiControl(obj);
                  continue;
                }
                if (obj?.type === "text") {
                  appendAssistantText(
                    String(obj?.message || obj?.content || ""),
                  );
                } else if (obj?.type === "products") {
                  appendMessage({
                    id: uid(),
                    role: "assistant",
                    type: "products",
                    ts: Date.now(),
                    data: obj?.products || obj?.data || [],
                  });
                } else if (obj?.type === "cart") {
                  appendMessage({
                    id: uid(),
                    role: "assistant",
                    type: "cart",
                    ts: Date.now(),
                    data: obj?.data || {},
                  });
                }
              } catch {
                // ignore chunk
              }
            }
          }
          return;
        }
        // Fallback no streaming
        const json = await res.json();
        const arr: AssistantMessage[] = Array.isArray(json?.messages)
          ? json.messages
          : [];
        if (json?.ui_control) handleUiControl(json.ui_control);
        if (arr.length) {
          arr.forEach((m) => {
            if (m.role === "assistant" && m.type === "text") {
              appendAssistantText(String(m.content || ""));
            } else {
              appendMessage({ ...m, id: uid(), ts: Date.now() });
            }
          });
        }
      } catch {
        appendAssistantText(
          "Hubo un problema procesando tu mensaje. ¿Intentamos de nuevo?",
        );
      }
    },
    [appendAssistantText, appendMessage, continuePurchase, handleUiControl, lastOrderId],
  );

  const sendAudioBase64 = useCallback(
    async (audioBase64: string) => {
      const userMsg: AssistantMessage = {
        id: uid(),
        role: "user",
        type: "audio",
        audioBase64,
        ts: Date.now(),
        content: "Audio enviado",
      };
      setMessages((prev) => [...prev, userMsg]);
      try {
        const res = await fetch("/api/assistant/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64 }),
        });
        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
              const chunk = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 2);
              if (!chunk) continue;
              try {
                const obj = JSON.parse(chunk);
                if (obj?.type === "ui_control") {
                  handleUiControl(obj);
                  continue;
                }
                if (obj?.type === "text") {
                  appendAssistantText(
                    String(obj?.message || obj?.content || ""),
                  );
                }
              } catch {
                // ignore
              }
            }
          }
          return;
        }
        const json = await res.json();
        const arr: AssistantMessage[] = Array.isArray(json?.messages)
          ? json.messages
          : [];
        if (json?.ui_control) handleUiControl(json.ui_control);
        if (arr.length) {
          arr.forEach((m) => {
            if (m.role === "assistant" && m.type === "text") {
              appendAssistantText(String(m.content || ""));
            } else {
              appendMessage({ ...m, id: uid(), ts: Date.now() });
            }
          });
        }
      } catch {
        appendAssistantText(
          "No pude procesar el audio. ¿Probamos nuevamente?",
        );
      }
    },
    [appendAssistantText, appendMessage, handleUiControl],
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((v) => !v),
      view,
      setView,
      messages,
      appendMessage,
      sendText,
      sendAudioBase64,
      handleUiControl,
      continuePurchase,
      lastOrderId,
    }),
    [
      open,
      view,
      messages,
      appendMessage,
      sendText,
      sendAudioBase64,
      handleUiControl,
      continuePurchase,
      lastOrderId,
    ],
  );

  return value;
}
