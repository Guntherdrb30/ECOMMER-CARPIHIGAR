"use client";

import { useState } from 'react';
import { useAssistant } from './hooks/useAssistant';
import AudioRecorder from './AudioRecorder';
import MicButton from './voice/MicButton';

export default function Toolbar() {
  const { sendText, sendAudioBase64, setView } = useAssistant();
  const [text, setText] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    await sendText(t);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = String(reader.result || '');
      await sendText('Imagen adjunta', { imageBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 px-3 py-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 border rounded-full px-3 py-2 text-sm"
        />
        <label
          className="p-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
          title="Adjuntar imagen"
        >
          <input
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="hidden"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M1.5 6A2.25 2.25 0 013.75 3.75h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 6.75v3.692l2.47-2.47a1.5 1.5 0 012.121 0L15 15.56l2.629-2.628a1.5 1.5 0 012.121 0L21 14.06V6.75A.75.75 0 0020.25 6H3.75A.75.75 0 003 6.75z" />
          </svg>
        </label>
        <AudioRecorder onSend={(b64) => sendAudioBase64(b64)} />
        <button
          type="button"
          onClick={() => setView('cart')}
          className="p-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
          title="Ver carrito"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3.75h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h9.75m-9.75 0L6 6.75m1.5 7.5L5.106 5.022A1.125 1.125 0 0 0 4 4.125H2.25M7.5 14.25 6 17.25m11.25-3h1.386c.51 0 .955-.343 1.087-.835l1.277-4.788A1.125 1.125 0 0 0 20.95 6.75H6m11.25 7.5 1.5 3m-12-3-1.5 3m3.75 0a1.125 1.125 0 1 1-2.25 0m9.75 0a1.125 1.125 0 1 1-2.25 0"
            />
          </svg>
        </button>
        <button className="px-3 py-2 rounded bg-[#E62C1A] text-white hover:scale-105 transition-transform">
          Enviar
        </button>
      </form>
      <div className="px-3 pb-2">
        <MicButton />
      </div>
    </div>
  );
}
