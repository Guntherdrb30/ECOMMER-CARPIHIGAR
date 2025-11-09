"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
    };
  }, []);

  const start = useCallback(async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e: any) {
      setPermissionError('No se pudo acceder al micrófono');
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr) { setRecording(false); resolve(null); return; }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1] || null;
          resolve(base64);
        };
        reader.readAsDataURL(blob);
        setRecording(false);
        try { mr.stream.getTracks().forEach(t => t.stop()); } catch {}
      };
      try { mr.stop(); } catch { setRecording(false); resolve(null); }
    });
  }, []);

  return { recording, start, stop, permissionError };
}

