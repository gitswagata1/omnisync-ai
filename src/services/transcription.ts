import { logger } from '../utils/logger.js';

export async function transcribeAudio(_mediaUrl: string): Promise<string> {
  logger.info('Transcribing audio via Whisper');

  // TODO: Implementation
  //
  // 1. Download audio from WhatsApp Graph API using media URL
  // 2. Store temporarily in /tmp or memory buffer
  // 3. Send to OpenAI Whisper API (model: whisper-1)
  // 4. Return transcript text
  // 5. Clean up temporary file

  return '';
}
