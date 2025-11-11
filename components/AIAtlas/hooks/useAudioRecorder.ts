"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [permission, setPermission] = useState<'granted'|'denied'|'prompt'>('prompt');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      setPermission('prompt');
    }
  }, []);

  const start = useCallback(async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission('granted');
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); };
      mr.start();
      setRecording(true);
    } catch {
      setPermission('denied');
    }
  }, [recording]);

  const stop = useCallback(async (): Promise<string | null> => {
    const mr = mediaRecorderRef.current;
    if (!mr || !recording) return null;
    return new Promise((resolve) => {
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => { resolve(String(reader.result || '')); };
        reader.readAsDataURL(blob);
        setRecording(false);
        chunksRef.current = [];
      };
      mr.stop();
    });
  }, [recording]);

  return { recording, permission, start, stop };
}

