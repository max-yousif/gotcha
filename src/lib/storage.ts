import type { Draw, Participant, Settings } from './types';

const KEYS = {
  participants: 'gotcha.participants',
  settings: 'gotcha.settings',
  draw: 'gotcha.draw',
  drawKey: 'gotcha.drawKey',
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Opslag niet beschikbaar (privévenster): de app werkt verder, maar onthoudt niets.
  }
}

export const loadParticipants = () => read<Participant[]>(KEYS.participants) ?? [];
export const saveParticipants = (p: Participant[]) => write(KEYS.participants, p);

export const loadSettings = () => read<Settings>(KEYS.settings);
export const saveSettings = (s: Settings) => write(KEYS.settings, s);

/*
 * De trekking wordt versleuteld bewaard, zodat de organisator ze niet per ongeluk
 * leest in de opslag van de browser. (De sleutel staat ernaast: dit beschermt tegen
 * toevallig zien, niet tegen iemand die bewust wil valsspelen.)
 */

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function drawKey(): Promise<CryptoKey> {
  let raw = read<string>(KEYS.drawKey);
  if (!raw) {
    raw = b64(crypto.getRandomValues(new Uint8Array(32)));
    write(KEYS.drawKey, raw);
  }
  return crypto.subtle.importKey('raw', unb64(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function saveDraw(draw: Draw | null): Promise<void> {
  if (!draw) {
    write(KEYS.draw, null);
    return;
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(draw));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await drawKey(), data));
  write(KEYS.draw, { iv: b64(iv), data: b64(encrypted) });
}

export async function loadDraw(): Promise<Draw | null> {
  const stored = read<{ iv: string; data: string }>(KEYS.draw);
  if (!stored) return null;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(stored.iv) },
      await drawKey(),
      unb64(stored.data),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as Draw;
  } catch {
    return null;
  }
}

export function clearAll(): void {
  Object.values(KEYS).forEach((k) => write(k, null));
}
