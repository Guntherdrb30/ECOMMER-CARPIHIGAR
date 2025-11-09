import { generateAudio } from '../../utils/tts';

export async function generateVoiceReply(text: string) {
  const audioBase64 = await generateAudio(text);
  return { type: 'voice', audioBase64 } as const;
}

