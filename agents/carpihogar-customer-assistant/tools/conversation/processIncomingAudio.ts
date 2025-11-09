import { transcribeAudio } from '../../utils/stt';
import { sendMessage } from './sendMessage';

export async function* processIncomingAudio(input: { audioBase64: string; customerId?: string }) {
  const buf = Buffer.from(input.audioBase64, 'base64');
  const text = await transcribeAudio(buf);
  yield* sendMessage({ text, customerId: input.customerId });
}

