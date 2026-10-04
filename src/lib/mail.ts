import type { CardData } from '../components/PrintArea';
import type { ThemeId } from './types';

/** Zelfde limiet als de Worker (api/worker.ts). */
const BATCH = 50;

export interface MailResult {
  sent: string[];
  failed: { to: string; error: string }[];
}

export class MailServerError extends Error {}

interface MailOptions {
  server: string;
  password: string;
  eventName: string;
  theme: ThemeId;
  rules: string;
}

async function post(opts: MailOptions, messages: { to: string; name: string; target: string; targetKlas: string }[]): Promise<MailResult> {
  let res: Response;
  try {
    res = await fetch(`${opts.server.replace(/\/+$/, '')}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: opts.password, eventName: opts.eventName, theme: opts.theme, rules: opts.rules, messages }),
    });
  } catch {
    throw new MailServerError('De e-mailserver is niet bereikbaar. Klopt het adres?');
  }
  const body = (await res.json().catch(() => ({}))) as Partial<MailResult> & { error?: string };
  if (!res.ok) throw new MailServerError(body.error ?? `De e-mailserver gaf een fout (${res.status}).`);
  return { sent: body.sent ?? [], failed: body.failed ?? [] };
}

/** Verstuurt per groep van 50; de inhoud gaat rechtstreeks naar de server en wordt hier nergens getoond. */
export async function sendAssignments(opts: MailOptions, cards: readonly CardData[], onProgress?: (done: number) => void): Promise<MailResult> {
  const total: MailResult = { sent: [], failed: [] };
  for (let i = 0; i < cards.length; i += BATCH) {
    const batch = cards.slice(i, i + BATCH).map(({ player, target }) => ({
      to: player.email.trim(),
      name: player.name,
      target: target.name,
      targetKlas: target.klas,
    }));
    const r = await post(opts, batch);
    total.sent.push(...r.sent);
    total.failed.push(...r.failed);
    onProgress?.(Math.min(i + BATCH, cards.length));
  }
  return total;
}

/** Testmail naar de organisator, met een verzonnen doelwit. */
export function sendTestMail(opts: MailOptions, to: string): Promise<MailResult> {
  return post(opts, [{ to: to.trim(), name: 'Organisator', target: 'Voorbeeld Doelwit', targetKlas: '' }]);
}

/** mailto-link voor je eigen mailprogramma; bevat enkel de geheime link, nooit de naam van het doelwit. */
export function mailtoLink(to: string, name: string, eventName: string, revealUrl: string): string {
  const subject = `Jouw geheime opdracht voor ${eventName}`;
  const body = [
    `Hallo ${name},`,
    '',
    `Open deze link om te zien wie je hebt voor ${eventName}. Zorg dat niemand meekijkt!`,
    '',
    revealUrl,
    '',
    'Veel plezier!',
  ].join('\n');
  return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
