import { useEffect, useState } from 'react';
import { mailtoLink, MailServerError, sendAssignments, sendTestMail } from '../lib/mail';
import { isValidEmail } from '../lib/participants';
import { makeQrUrls } from '../lib/printing';
import * as storage from '../lib/storage';
import type { Draw, Settings } from '../lib/types';
import type { CardData } from './PrintArea';
import { Button, inputClass, Notice, Section } from './ui';

interface Props {
  step: number;
  cards: CardData[];
  draw: Draw | null;
  ready: boolean;
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
}

const SETUP_URL = 'https://github.com/max-yousif/gotcha/blob/main/api/README.md';
const PASSWORD_KEY = 'gotcha.mailPassword';

function readSessionPassword(): string {
  try {
    return sessionStorage.getItem(PASSWORD_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function EmailSection({ step, cards, draw, ready, settings, onSettingsChange }: Props) {
  const [password, setPassword] = useState(readSessionPassword);
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    setSent(draw ? storage.loadSent(draw.createdAt) : new Set());
    setFailed(new Map());
  }, [draw]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PASSWORD_KEY, password);
    } catch {
      // geen sessie-opslag: dan typ je het wachtwoord gewoon opnieuw
    }
  }, [password]);

  const withEmail = cards.filter((c) => c.player.email.trim());
  const valid = withEmail.filter((c) => isValidEmail(c.player.email));
  const invalidCount = withEmail.length - valid.length;
  const todo = valid.filter((c) => !sent.has(c.player.id));
  const server = settings.mailServer.trim();
  const canSend = server !== '' && password !== '';
  const opts = { server, password, eventName: settings.eventName, theme: settings.theme, rules: settings.rules };

  const run = async (label: string, list: CardData[]) => {
    setBusy(label);
    setMessage(null);
    try {
      const result = await sendAssignments(opts, list, (done) => setBusy(`${label} (${done}/${list.length})`));
      // Twee deelnemers kunnen hetzelfde adres hebben (bv. een gezinsadres).
      const idsFor = (email: string) => list.filter((c) => c.player.email.trim() === email).map((c) => c.player.id);
      const nextSent = new Set(sent);
      const nextFailed = new Map(failed);
      result.sent.forEach((e) => idsFor(e).forEach((id) => (nextSent.add(id), nextFailed.delete(id))));
      result.failed.forEach((f) => idsFor(f.to).forEach((id) => nextFailed.set(id, f.error)));
      setSent(nextSent);
      setFailed(nextFailed);
      if (draw) storage.saveSent(draw.createdAt, nextSent);
      setMessage(
        result.failed.length === 0
          ? { tone: 'ok', text: `${result.sent.length} van ${list.length} e-mails verstuurd.` }
          : { tone: 'warn', text: `${result.sent.length} verstuurd, ${result.failed.length} mislukt (zie de lijst).` },
      );
    } catch (e) {
      setMessage({ tone: 'warn', text: e instanceof MailServerError ? e.message : 'Er ging iets mis bij het versturen.' });
    } finally {
      setBusy(null);
    }
  };

  const sendAll = () => {
    if (todo.length === 0) return;
    if (confirm(`${todo.length} e-mails versturen? Elke deelnemer krijgt zijn ${settings.theme === 'gotcha' ? 'doelwit' : 'geheime persoon'} rechtstreeks in de mailbox.`)) {
      void run('Bezig met versturen', todo);
    }
  };

  const sendTest = async () => {
    setBusy('Testmail versturen');
    setMessage(null);
    try {
      const r = await sendTestMail(opts, testTo);
      setMessage(
        r.failed.length === 0
          ? { tone: 'ok', text: `Testmail verstuurd naar ${testTo}. Kijk ook even in je spammap.` }
          : { tone: 'warn', text: `Testmail mislukt: ${r.failed[0].error}` },
      );
    } catch (e) {
      setMessage({ tone: 'warn', text: e instanceof MailServerError ? e.message : 'Er ging iets mis bij het versturen.' });
    } finally {
      setBusy(null);
    }
  };

  /** Opent je eigen mailprogramma met enkel de geheime link (niet zelf aanklikken!). */
  const prepareMail = async (card: CardData) => {
    const urls = await makeQrUrls([card], settings.eventName, settings.theme);
    window.location.href = mailtoLink(card.player.email, card.player.name, settings.eventName || 'het spel', urls.get(card.player.id)!);
  };

  return (
    <Section step={step} title="E-mail versturen" aside={withEmail.length > 0 && `${withEmail.length} met e-mail`}>
      {!ready ? (
        <Notice>Maak eerst de ketting (stap 3).</Notice>
      ) : withEmail.length === 0 ? (
        <Notice>Niemand heeft een e-mailadres. Gebruik de kaartjes, of vul e-mailadressen in bij de deelnemers.</Notice>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-slate-700">
            De website verstuurt zelf een e-mail naar elke deelnemer met een e-mailadres. Jij ziet de inhoud nooit.
            Deelnemers zonder e-mail krijgen een kaartje (stap 4: "enkel deelnemers zonder e-mail").
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Adres van je e-mailserver</span>
              <input
                className={inputClass}
                placeholder="https://gotcha-mail.jouwnaam.workers.dev"
                value={settings.mailServer}
                onChange={(e) => onSettingsChange({ ...settings, mailServer: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Organisatorwachtwoord</span>
              <input type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </div>
          {!server && (
            <Notice>
              Nog geen e-mailserver? Volg de{' '}
              <a href={SETUP_URL} target="_blank" rel="noreferrer" className="underline">
                stap-voor-stap uitleg
              </a>{' '}
              (Brevo + Cloudflare, gratis, ongeveer 15 minuten). Of gebruik hieronder "Mail voorbereiden" in je eigen mailprogramma.
            </Notice>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <label className="block grow sm:max-w-xs">
              <span className="mb-1 block text-sm font-medium">Eerst testen? Je eigen e-mailadres</span>
              <input type="email" className={inputClass} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="jij@voorbeeld.be" />
            </label>
            <Button onClick={() => void sendTest()} disabled={!canSend || !isValidEmail(testTo) || busy !== null}>
              Testmail versturen
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={sendAll} disabled={!canSend || todo.length === 0 || busy !== null} className="px-6 py-3 text-base">
              ✉️ Verstuur naar {todo.length} {todo.length === 1 ? 'deelnemer' : 'deelnemers'}
            </Button>
            {busy && <span className="text-sm text-slate-600">{busy}...</span>}
          </div>
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
          {invalidCount > 0 && <Notice tone="warn">{invalidCount} e-mailadres(sen) kloppen niet; pas ze aan bij de deelnemers.</Notice>}

          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody>
                {withEmail.map((c) => {
                  const ok = isValidEmail(c.player.email);
                  const error = failed.get(c.player.id);
                  return (
                    <tr key={c.player.id} className="border-t border-slate-100 first:border-t-0">
                      <td className="px-3 py-2">
                        {c.player.name}
                        <div className="text-xs text-slate-500">{c.player.email}</div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {sent.has(c.player.id) ? (
                          <span className="text-emerald-700">✔ verstuurd</span>
                        ) : error ? (
                          <span className="text-red-700">✕ {error}</span>
                        ) : !ok ? (
                          <span className="text-amber-700">ongeldig adres</span>
                        ) : (
                          <span className="text-slate-400">nog niet verstuurd</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {ok && (
                          <>
                            <button type="button" className="mr-3 text-xs text-slate-600 underline" onClick={() => void prepareMail(c)}>
                              Mail voorbereiden
                            </button>
                            <Button onClick={() => void run(`${c.player.name} versturen`, [c])} disabled={!canSend || busy !== null}>
                              {sent.has(c.player.id) ? 'Opnieuw' : 'Verstuur'}
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            "Mail voorbereiden" opent je eigen mailprogramma met enkel een geheime link (geen namen). Klik die link zelf niet aan,
            anders zie je het doelwit.
          </p>
        </div>
      )}
    </Section>
  );
}
