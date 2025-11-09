"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Recog = any;

export function useVoiceSession(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interimText, setInterim] = useState("");
  const recogRef = useRef<Recog | null>(null);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r: any = new SR();
    r.lang = 'es-ES';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          const text = res[0].transcript;
          onFinal(text);
          setInterim("");
        } else {
          interim += res[0].transcript;
        }
      }
      if (interim) setInterim(interim);
    };
    r.onend = () => { setListening(false); };
    recogRef.current = r;
  }, [onFinal]);

  const start = useCallback(() => {
    const r: any = recogRef.current;
    if (!r) return;
    setInterim("");
    try { r.start(); setListening(true); } catch {}
  }, []);

  const stop = useCallback(() => {
    const r: any = recogRef.current;
    if (!r) return;
    try { r.stop(); } catch {}
  }, []);

  return { listening, interimText, start, stop };
}

