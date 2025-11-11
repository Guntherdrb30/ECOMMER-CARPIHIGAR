"use client";

export default function AudioPlayer({ src }: { src: string }) {
  return (
    <audio controls className="w-full">
      <source src={src} type="audio/webm" />
      Tu navegador no soporta audio.
    </audio>
  );
}
