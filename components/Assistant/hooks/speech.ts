"use client";

let voiceCache: SpeechSynthesisVoice | null = null;

function selectFemaleEsVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Prefer Spanish female voices
  const preferredNames = [
    'Google español', 'Google español de Estados Unidos', 'Microsoft Helena - Spanish (Spain)',
    'Microsoft Sabina - Spanish (Mexico)', 'Microsoft Laura - Spanish (Spain)'
  ];
  for (const pref of preferredNames) {
    const v = voices.find((x) => x.name.toLowerCase().includes(pref.toLowerCase()));
    if (v) return v;
  }
  const esVoices = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('es'));
  return esVoices[0] || voices[0] || null;
}

export function speak(text: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    if (!voiceCache) {
      voiceCache = selectFemaleEsVoice();
      // In case voices not loaded yet
      if (!voiceCache) {
        window.speechSynthesis.onvoiceschanged = () => { voiceCache = selectFemaleEsVoice(); };
      }
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0; // normal speed
    utter.pitch = 1.1; // slightly higher (more feminine)
    utter.volume = 1.0;
    if (voiceCache) utter.voice = voiceCache;
    window.speechSynthesis.speak(utter);
  } catch {}
}

export function stopSpeaking() {
  try { window.speechSynthesis.cancel(); } catch {}
}

