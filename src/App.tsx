import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import BackupDialog from './components/BackupDialog';
import BackupPage from './components/BackupPage';
import DrawSection from './components/DrawSection';
import ParticipantsSection from './components/ParticipantsSection';
import PrintArea, { type CardData, type PrintJob, type PrintRequest } from './components/PrintArea';
import PrintSection from './components/PrintSection';
import RevealPage from './components/RevealPage';
import SettingsSection from './components/SettingsSection';
import { Button } from './components/ui';
import { createChain } from './lib/chain';
import { downloadOverview } from './lib/importFile';
import { cardsFromDraw, makeQrUrls } from './lib/printing';
import type { BackupContent } from './lib/sealedBackup';
import * as storage from './lib/storage';
import { THEMES } from './lib/themes';
import { REVEAL_PREFIX } from './lib/token';
import type { CardType, Draw, Participant, Settings } from './lib/types';

const defaultSettings: Settings = {
  theme: 'gotcha',
  eventName: THEMES.gotcha.defaultEventName,
  rules: THEMES.gotcha.defaultRules,
  playing: true,
  cardType: 'names',
  flip: 'long',
};

/** De trekking hoort bij precies deze deelnemers (namen/klassen aanpassen mag wel). */
function drawMatches(draw: Draw | null, participants: Participant[]): boolean {
  if (!draw || draw.order.length !== participants.length) return false;
  const ids = new Set(participants.map((p) => p.id));
  return draw.order.every((id) => ids.has(id));
}

function useHash(): string {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => setHash(location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [participants, setParticipants] = useState<Participant[]>(storage.loadParticipants);
  const [settings, setSettings] = useState<Settings>(() => ({ ...defaultSettings, ...storage.loadSettings() }));
  const [draw, setDraw] = useState<Draw | null>(null);
  const [printRequest, setPrintRequest] = useState<PrintRequest | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    storage.loadDraw().then((d) => d && setDraw(d));
  }, []);
  useEffect(() => storage.saveParticipants(participants), [participants]);
  useEffect(() => storage.saveSettings(settings), [settings]);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme, hash]);

  const drawValid = drawMatches(draw, participants);
  const theme = THEMES[settings.theme];
  const cards = useMemo<CardData[]>(() => (draw && drawValid ? cardsFromDraw(draw, participants) : []), [draw, drawValid, participants]);

  const print = async (request: PrintRequest) => {
    setPreparing(true);
    try {
      const qrUrls =
        request.job === 'cards' && request.cardType === 'qr'
          ? await makeQrUrls(request.cards, request.eventName, request.theme.id)
          : undefined;
      flushSync(() => setPrintRequest({ ...request, qrUrls }));
    } finally {
      setPreparing(false);
    }
    window.print();
  };

  const printJob = (job: PrintJob) =>
    void print({
      job,
      cards,
      participants,
      theme,
      eventName: settings.eventName || theme.defaultEventName,
      rules: settings.rules,
      flip: settings.flip,
      cardType: settings.cardType,
    });

  const makeDraw = () => {
    const next: Draw = { order: createChain(participants.map((p) => p.id)), createdAt: new Date().toISOString() };
    setDraw(next);
    void storage.saveDraw(next);
  };

  const exportOverview = () => {
    if (!draw) return;
    const order = new Map(draw.order.map((id, i) => [id, i]));
    const rows = [...cards].sort((a, b) => order.get(a.player.id)! - order.get(b.player.id)!);
    void downloadOverview(`${settings.eventName || 'gotcha'} overzicht.xlsx`, rows);
  };

  const clearAll = () => {
    if (!confirm('Alle deelnemers, instellingen en de trekking wissen van deze computer?')) return;
    storage.clearAll();
    setParticipants([]);
    setSettings(defaultSettings);
    setDraw(null);
  };

  const restore = (content: BackupContent) => {
    setParticipants(content.participants);
    setSettings({ ...defaultSettings, ...content.settings });
    setDraw(content.draw);
    void storage.saveDraw(content.draw);
    location.hash = '#/';
  };

  const printFromBackup = (card: CardData, content: BackupContent, cardType: CardType) => {
    const t = THEMES[content.settings.theme];
    void print({
      job: 'cards',
      cards: [card],
      participants: [card.player],
      theme: t,
      eventName: content.settings.eventName || t.defaultEventName,
      rules: content.settings.rules,
      flip: content.settings.flip ?? 'long',
      cardType,
    });
  };

  if (hash.startsWith(REVEAL_PREFIX)) {
    return <RevealPage token={hash.slice(REVEAL_PREFIX.length)} />;
  }

  return (
    <>
      {hash === '#/back-up' ? (
        <BackupPage onPrintCard={printFromBackup} onRestore={restore} />
      ) : (
        <div className="app mx-auto max-w-4xl space-y-5 px-4 py-8 sm:py-12">
          <header className="mb-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {theme.emoji} {theme.label}
            </h1>
            <p className="mt-2 text-slate-600">
              Geef de deelnemers in, maak één geheime ketting en druk de kaartjes af. Iedereen krijgt één persoon, en wie
              iemand uitschakelt, neemt diens doelwit over tot er één winnaar is.
            </p>
          </header>

          <SettingsSection settings={settings} onChange={setSettings} />
          <ParticipantsSection participants={participants} onChange={setParticipants} playing={settings.playing} />
          <DrawSection
            participants={participants}
            draw={draw}
            drawValid={drawValid}
            playing={settings.playing}
            onDraw={makeDraw}
            onBackup={() => setBackupOpen(true)}
            onExport={exportOverview}
          />
          <PrintSection
            count={cards.length}
            ready={drawValid}
            flip={settings.flip}
            onFlipChange={(flip) => setSettings({ ...settings, flip })}
            cardType={settings.cardType}
            onCardTypeChange={(cardType) => setSettings({ ...settings, cardType })}
            onPrint={printJob}
            playing={settings.playing}
          />

          <footer className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-slate-500">
            <span>Alle gegevens blijven op deze computer; er wordt niets doorgestuurd.</span>
            <span className="flex flex-wrap items-center gap-3">
              <a href="#/back-up" className="underline">
                Back-up openen
              </a>
              <Button variant="danger" onClick={clearAll}>
                Wis alle gegevens
              </Button>
            </span>
          </footer>

          {backupOpen && draw && (
            <BackupDialog content={{ settings, participants, draw }} onClose={() => setBackupOpen(false)} />
          )}
        </div>
      )}

      {preparing && (
        <div className="app fixed inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          QR-codes worden gemaakt...
        </div>
      )}

      <PrintArea request={printRequest} />
    </>
  );
}
