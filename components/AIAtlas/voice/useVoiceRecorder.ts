"use client";

import { useCallback, useRef, useState } from 'react';

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    if (recording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); };
    mr.start();
    setRecording(true);
  }, [recording]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const mr = mediaRecorderRef.current;
    if (!mr || !recording) return null;
    return new Promise((resolve) => {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecording(false);
        chunksRef.current = [];
        resolve(blob);
      };
      mr.stop();
    });
  }, [recording]);

  return { recording, start, stop };
}
