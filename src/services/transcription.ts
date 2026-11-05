import OpenAI from 'openai';
import { downloadMedia } from '../lib/whatsapp.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.llm.apiKey });

export async function transcribeAudio(mediaId: string): Promise<string> {
  logger.info(`Transcribing audio media ${mediaId}`);

  const buffer = await downloadMedia(mediaId);

  const file = new File([buffer], 'audio.ogg', { type: 'audio/ogg' });

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
  });

  logger.info(`Transcription complete: ${transcription.text.length} chars`);
  return transcription.text;
}
