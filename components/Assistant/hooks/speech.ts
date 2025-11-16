"use client";

let cachedVoice: SpeechSynthesisVoice | null = null;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function selectSpanishFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const synth = window.speechSynthesis;
  const voices = synth.getVoices() || [];
  if (!voices.length) return null;

  const esVoices = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("es"));

  const preferredNames = [
    "google español",
    "google español de estados unidos",
    "microsoft sabina - spanish (mexico)",
    "microsoft laura - spanish (spain)",
    "microsoft helena - spanish (spain)",
  ];

  for (const pref of preferredNames) {
    const match = esVoices.find((v) => normalize(v.name).includes(normalize(pref)));
    if (match) return match;
  }

  if (esVoices.length) return esVoices[0];
  return voices[0] || null;
}

export function speak(text: string) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    // Evita que se superpongan varias voces
    synth.cancel();

    if (!cachedVoice) {
      cachedVoice = selectSpanishFemaleVoice();
      if (!cachedVoice) {
        const handler = () => {
          cachedVoice = selectSpanishFemaleVoice();
          synth.removeEventListener("voiceschanged", handler);
        };
        synth.addEventListener("voiceschanged", handler);
      }
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.05;
    utter.volume = 1.0;
    utter.lang = (cachedVoice && cachedVoice.lang) || "es-ES";
    if (cachedVoice) utter.voice = cachedVoice;

    synth.speak(utter);
  } catch {
    // no-op
  }
}

export function stopSpeaking() {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  } catch {
    // no-op
  }
}

