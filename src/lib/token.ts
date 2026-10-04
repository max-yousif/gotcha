import { fromBase64Url, toBase64Url } from './base64';
import type { ThemeId } from './types';

/** Wat een deelnemer te zien krijgt na het scannen van de QR-code. */
export interface RevealData {
  /** speler */
  p: string;
  /** doelwit */
  t: string;
  /** klas van het doelwit */
  k: string;
  /** naam van het spel */
  e: string;
  th: ThemeId;
}

/*
 * De inhoud wordt versleuteld met een willekeurige sleutel die mee in de link zit,
 * na het #-teken. Browsers sturen dat deel nooit naar de server, en wie de link of
 * QR-code ziet, kan de naam van het doelwit er niet zomaar uit aflezen.
 */

const KEY_BYTES = 16;
const IV_BYTES = 12;

export async function createRevealToken(data: RevealData): Promise<string> {
  const rawKey = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const plain = new TextEncoder().encode(JSON.stringify(data));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const out = new Uint8Array(KEY_BYTES + IV_BYTES + cipher.length);
  out.set(rawKey, 0);
  out.set(iv, KEY_BYTES);
  out.set(cipher, KEY_BYTES + IV_BYTES);
  return toBase64Url(out);
}

export async function readRevealToken(token: string): Promise<RevealData> {
  const bytes = fromBase64Url(token);
  if (bytes.length <= KEY_BYTES + IV_BYTES) throw new Error('Ongeldige code');
  const key = await crypto.subtle.importKey('raw', bytes.slice(0, KEY_BYTES), 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(KEY_BYTES, KEY_BYTES + IV_BYTES) },
    key,
    bytes.slice(KEY_BYTES + IV_BYTES),
  );
  const data = JSON.parse(new TextDecoder().decode(plain)) as RevealData;
  if (typeof data.p !== 'string' || typeof data.t !== 'string') throw new Error('Ongeldige code');
  return data;
}

export const REVEAL_PREFIX = '#/r/';

/** Volledige link, bv. https://naam.github.io/gotcha/#/r/abc… */
export function revealUrl(baseUrl: string, token: string): string {
  return `${baseUrl}${REVEAL_PREFIX}${token}`;
}
