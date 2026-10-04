// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMail, escapeHtml } from '../api/emailTemplate';
import worker, { MAX_MESSAGES, type Env } from '../api/worker';

const env: Env = {
  BREVO_API_KEY: 'sleutel',
  SENDER_EMAIL: 'organisator@x.be',
  ORGANIZER_PASSWORD: 'geheim123',
  ALLOWED_ORIGIN: 'https://max-yousif.github.io',
};

const ORIGIN = 'https://max-yousif.github.io';

function request(body: unknown, origin: string | null = ORIGIN, method = 'POST', path = '/send') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  return new Request(`https://gotcha-mail.test${path}`, { method, headers, body: method === 'POST' ? JSON.stringify(body) : undefined });
}

const valid = {
  password: 'geheim123',
  eventName: 'Gotcha 2026',
  theme: 'gotcha',
  rules: 'Geen geweld.',
  messages: [
    { to: 'anna@x.be', name: 'Anna', target: 'Bert', targetKlas: '5A' },
    { to: 'bert@x.be', name: 'Bert', target: 'Anna', targetKlas: '' },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe('worker', () => {
  it('verstuurt elke mail via Brevo en verklapt geen doelwitten in het antwoord', async () => {
    const fetchMock = vi.fn(async () => new Response('{"messageId":"x"}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await worker.fetch(request(valid), env);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ sent: ['anna@x.be', 'bert@x.be'], failed: [] });
    expect(text).not.toContain('Bert"');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((init.headers as Record<string, string>)['api-key']).toBe('sleutel');
    const payload = JSON.parse(init.body as string);
    expect(payload.to).toEqual([{ email: 'anna@x.be', name: 'Anna' }]);
    expect(payload.sender.email).toBe('organisator@x.be');
    expect(payload.textContent).toContain('Jouw doelwit is: Bert (5A)');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it('weigert een fout wachtwoord zonder iets te versturen', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await worker.fetch(request({ ...valid, password: 'fout' }), env);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('weigert andere websites', async () => {
    const res = await worker.fetch(request(valid, 'https://kwaadaardig.example'), env);
    expect(res.status).toBe(403);
    expect((await worker.fetch(request(valid, null), env)).status).toBe(403);
  });

  it('weigert te veel ontvangers en ongeldige adressen', async () => {
    const many = { ...valid, messages: Array.from({ length: MAX_MESSAGES + 1 }, () => valid.messages[0]) };
    expect((await worker.fetch(request(many), env)).status).toBe(400);
    const bad = { ...valid, messages: [{ ...valid.messages[0], to: 'geen-adres' }] };
    expect((await worker.fetch(request(bad), env)).status).toBe(400);
  });

  it('meldt mislukte mails per adres', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) =>
        JSON.parse(init.body as string).to[0].email === 'bert@x.be'
          ? new Response('{"message":"Invalid email"}', { status: 400 })
          : new Response('{}', { status: 201 }),
      ),
    );
    const res = await worker.fetch(request(valid), env);
    expect(await res.json()).toEqual({ sent: ['anna@x.be'], failed: [{ to: 'bert@x.be', error: 'Invalid email' }] });
  });

  it('beantwoordt de CORS-voorcontrole', async () => {
    const res = await worker.fetch(request(null, ORIGIN, 'OPTIONS'), env);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});

describe('e-mailsjabloon', () => {
  it('ontsnapt HTML in namen', () => {
    const mail = buildMail({ eventName: 'Test', theme: 'santa', rules: '', name: '<b>Anna</b>', target: 'Bert & Co', targetKlas: '' });
    expect(mail.html).toContain('&lt;b&gt;Anna&lt;/b&gt;');
    expect(mail.html).toContain('Bert &amp; Co');
    expect(mail.subject).toBe('🎅 Jouw geheime persoon voor Test');
    expect(escapeHtml('"\'')).toBe('&quot;&#39;');
  });
});
