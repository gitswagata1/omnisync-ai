import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const BASE_URL = `https://graph.facebook.com/${config.whatsapp.apiVersion}`;

interface SendMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface TemplateComponent {
  type: 'body' | 'header' | 'button';
  parameters: Array<{ type: 'text'; text: string }>;
}

async function waFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error(`WhatsApp API error: ${res.status} ${body}`);
    throw new Error(`WhatsApp API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function sendTextMessage(
  to: string,
  body: string
): Promise<string> {
  const data = await waFetch<SendMessageResponse>(
    `/${config.whatsapp.phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    }
  );
  return data.messages[0].id;
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components: TemplateComponent[]
): Promise<string> {
  const data = await waFetch<SendMessageResponse>(
    `/${config.whatsapp.phoneNumberId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    }
  );
  return data.messages[0].id;
}

export async function downloadMedia(mediaId: string): Promise<Buffer> {
  const meta = await waFetch<{ url: string }>(`/${mediaId}`);

  const res = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${config.whatsapp.accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Media download failed: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function markAsRead(messageId: string): Promise<void> {
  await waFetch(`/${config.whatsapp.phoneNumberId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });
}
