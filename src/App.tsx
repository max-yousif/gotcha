import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import DrawSection from './components/DrawSection';
import ParticipantsSection from './components/ParticipantsSection';
import PrintArea, { type CardData, type PrintJob } from './components/PrintArea';
import PrintSection from './components/PrintSection';
import SettingsSection from './components/SettingsSection';
import { Button } from './components/ui';
import { createChain, targetsFromChain } from './lib/chain';
import * as storage from './lib/storage';
import { THEMES } from './lib/themes';
import type { Draw, Flip, Participant, Settings } from './lib/types';

const defaultSettings: Settings = {
  theme: 'gotcha',
  eventName: THEMES.gotcha.defaultEventName,
  rules: THEMES.gotcha.defaultRules,
  playing: true,
};

/** De trekking hoort bij precies deze deelnemers (namen/klassen aanpassen mag wel). */
function drawMatches(draw: Draw | null, participants: Participant[]): boolean {
  if (!draw || draw.order.length !== participants.length) return false;
  const ids = new Set(participants.map((p) => p.id));
  return draw.order.every((id) => ids.has(id));
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>(storage.loadParticipants);
  const [settings, setSettings] = useState<Settings>(() => ({ ...defaultSettings, ...storage.loadSettings() }));
  const [draw, setDraw] = useState<Draw | null>(null);
  const [flip, setFlip] = useState<Flip>('long');
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  useEffect(() => {
    storage.loadDraw().then((d) => d && setDraw(d));
  }, []);
  useEffect(() => storage.saveParticipants(participants), [participants]);
  useEffect(() => storage.saveSettings(settings), [settings]);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const drawValid = drawMatches(draw, participants);
  const theme = THEMES[settings.theme];

  const cards = useMemo<CardData[]>(() => {
    if (!draw || !drawValid) return [];
    const byId = new Map(participants.map((p) => [p.id, p]));
    return [...targetsFromChain(draw.order)].map(([player, target]) => ({
      player: byId.get(player)!,
      target: byId.get(target)!,
    }));
  }, [draw, drawValid, participants]);

  const makeDraw = () => {
    const next: Draw = { order: createChain(participants.map((p) => p.id)), createdAt: new Date().toISOString() };
    setDraw(next);
    void storage.saveDraw(next);
  };

  const print = (job: PrintJob) => {
    flushSync(() => setPrintJob(job));
    window.print();
  };

  const clearAll = () => {
    if (!confirm('Alle deelnemers, instellingen en de trekking wissen van deze computer?')) return;
    storage.clearAll();
    setParticipants([]);
    setSettings(defaultSettings);
    setDraw(null);
  };

  return (
    <>
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
        <DrawSection participants={participants} draw={draw} drawValid={drawValid} playing={settings.playing} onDraw={makeDraw} />
        <PrintSection count={cards.length} ready={drawValid} flip={flip} onFlipChange={setFlip} onPrint={print} playing={settings.playing} />

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-slate-500">
          <span>Alle gegevens blijven op deze computer; er wordt niets doorgestuurd.</span>
          <Button variant="danger" onClick={clearAll}>
            Wis alle gegevens
          </Button>
        </footer>
      </div>

      <PrintArea
        job={printJob}
        cards={cards}
        participants={participants}
        theme={theme}
        eventName={settings.eventName || theme.defaultEventName}
        rules={settings.rules}
        flip={flip}
      />
    </>
  );
}
