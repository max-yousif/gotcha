/**
 * Cloudflare Worker die de e-mails verstuurt via Brevo.
 *
 * De website stuurt de lijst (naam, e-mail, doelwit) rechtstreeks hierheen; de organisator
 * ziet de inhoud dus nooit. De Brevo-sleutel staat enkel hier, als geheim, en nooit in de
 * website of op GitHub.
 *
 * Geheimen (npx wrangler secret put ...): BREVO_API_KEY, SENDER_EMAIL, ORGANIZER_PASSWORD
 * Variabelen (wrangler.toml): ALLOWED_ORIGIN, SENDER_NAME
 */
import { buildMail, type ThemeId } from './emailTemplate';

export interface Env {
  BREVO_API_KEY: string;
  SENDER_EMAIL: string;
  ORGANIZER_PASSWORD: string;
  /** Website die mag versturen, bv. https://max-yousif.github.io (meerdere: komma-gescheiden). */
  ALLOWED_ORIGIN?: string;
  SENDER_NAME?: string;
}

export interface SendRequest {
  password: string;
  eventName: string;
  theme: ThemeId;
  rules: string;
  messages: { to: string; name: string; target: string; targetKlas: string }[];
}

export interface SendResponse {
  sent: string[];
  failed: { to: string; error: string }[];
}

export const MAX_MESSAGES = 50;
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THEMES: ThemeId[] = ['gotcha', 'santa', 'valentine'];

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = origin && allowed.includes(origin) ? origin : (allowed[0] ?? '');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

/** Vergelijkt wachtwoorden zonder dat de duur iets verraadt. */
async function samePassword(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Controleert en beperkt de invoer; geeft een foutmelding of een nette aanvraag. */
export function validate(body: unknown): SendRequest | string {
  if (!body || typeof body !== 'object') return 'Ongeldige aanvraag.';
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return 'Geen ontvangers.';
  if (b.messages.length > MAX_MESSAGES) return `Maximaal ${MAX_MESSAGES} e-mails per keer.`;
  const messages = b.messages.map((m: Record<string, unknown>) => ({
    to: str(m?.to, 254),
    name: str(m?.name, 100),
    target: str(m?.target, 100),
    targetKlas: str(m?.targetKlas, 30),
  }));
  if (messages.some((m) => !EMAIL_RE.test(m.to) || !m.name || !m.target)) return 'Ongeldig e-mailadres of lege naam.';
  return {
    password: typeof b.password === 'string' ? b.password : '',
    eventName: str(b.eventName, 80),
    theme: THEMES.includes(b.theme as ThemeId) ? (b.theme as ThemeId) : 'gotcha',
    rules: str(b.rules, 400),
    messages,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST' || url.pathname !== '/send') return json({ error: 'Niet gevonden.' }, 404, cors);

    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (allowed.length > 0 && (!origin || !allowed.includes(origin))) {
      return json({ error: 'Deze website mag geen e-mails versturen via deze server.' }, 403, cors);
    }
    if (!env.BREVO_API_KEY || !env.SENDER_EMAIL || !env.ORGANIZER_PASSWORD) {
      return json({ error: 'De server is nog niet volledig ingesteld (geheimen ontbreken).' }, 500, cors);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Ongeldige aanvraag.' }, 400, cors);
    }
    const req = validate(body);
    if (typeof req === 'string') return json({ error: req }, 400, cors);
    if (!(await samePassword(req.password, env.ORGANIZER_PASSWORD))) {
      return json({ error: 'Het organisatorwachtwoord klopt niet.' }, 401, cors);
    }

    const result: SendResponse = { sent: [], failed: [] };
    for (const m of req.messages) {
      const mail = buildMail({ ...m, eventName: req.eventName, theme: req.theme, rules: req.rules });
      try {
        const res = await fetch(BREVO_URL, {
          method: 'POST',
          headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            sender: { email: env.SENDER_EMAIL, name: env.SENDER_NAME || req.eventName || 'Gotcha' },
            to: [{ email: m.to, name: m.name }],
            subject: mail.subject,
            htmlContent: mail.html,
            textContent: mail.text,
          }),
        });
        if (res.ok) {
          result.sent.push(m.to);
        } else {
          // Enkel de foutmelding van Brevo doorgeven, nooit de inhoud van de mail.
          const detail = await res.json().catch(() => ({}) as Record<string, unknown>);
          result.failed.push({ to: m.to, error: String((detail as { message?: unknown }).message ?? `Fout ${res.status}`) });
        }
      } catch {
        result.failed.push({ to: m.to, error: 'Brevo was niet bereikbaar.' });
      }
    }
    return json(result, 200, cors);
  },
};
