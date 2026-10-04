import { fromBase64, toBase64 } from './base64';
import type { Draw, Participant, Settings } from './types';

/** Alles wat nodig is om kaartjes opnieuw af te drukken of de trekking te herstellen. */
export interface BackupContent {
  settings: Settings;
  participants: Participant[];
  draw: Draw;
}

interface BackupFile {
  app: 'gotcha-backup';
  version: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  iv: string;
  data: string;
}

const ITERATIONS = 310_000;

export class WrongPasswordError extends Error {
  constructor() {
    super('Het wachtwoord klopt niet.');
  }
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Versleutelt de trekking met een wachtwoord; geeft de inhoud van het back-upbestand terug. */
export async function sealBackup(content: BackupContent, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const plain = new TextEncoder().encode(JSON.stringify(content));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const file: BackupFile = {
    app: 'gotcha-backup',
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: toBase64(salt) },
    iv: toBase64(iv),
    data: toBase64(cipher),
  };
  return JSON.stringify(file);
}

export async function openBackup(fileText: string, password: string): Promise<BackupContent> {
  let file: BackupFile;
  try {
    file = JSON.parse(fileText) as BackupFile;
  } catch {
    throw new Error('Dit is geen geldig back-upbestand.');
  }
  if (file.app !== 'gotcha-backup' || file.version !== 1) throw new Error('Dit is geen geldig back-upbestand.');

  const key = await deriveKey(password, fromBase64(file.kdf.salt), file.kdf.iterations);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(file.iv) }, key, fromBase64(file.data));
  } catch {
    throw new WrongPasswordError();
  }
  return JSON.parse(new TextDecoder().decode(plain)) as BackupContent;
}

/** Laat de browser een bestand downloaden. */
export function downloadText(fileName: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
