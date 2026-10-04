import { useState } from 'react';
import { displayName } from '../lib/participants';
import type { Draw, Participant } from '../lib/types';
import { Button, Notice, Section } from './ui';

interface Props {
  participants: Participant[];
  draw: Draw | null;
  drawValid: boolean;
  playing: boolean;
  onDraw: () => void;
}

export default function DrawSection({ participants, draw, drawValid, playing, onDraw }: Props) {
  const [showOverview, setShowOverview] = useState(false);
  const n = participants.length;

  const handleDraw = () => {
    const messages: string[] = [];
    if (draw) messages.push('Er is al een trekking. Alle eerder afgedrukte kaartjes worden ongeldig.');
    if (playing) messages.push('Je speelt mee: je zult het resultaat niet te zien krijgen.');
    if (messages.length === 0 || confirm(`${messages.join('\n\n')}\n\nDoorgaan?`)) {
      setShowOverview(false);
      onDraw();
    }
  };

  const byId = new Map(participants.map((p) => [p.id, p]));

  return (
    <Section step={3} title="Trekking">
      {n < 2 && <Notice>Voeg minstens 2 deelnemers toe (liefst 3 of meer).</Notice>}
      {n === 2 && <Notice tone="warn">Met 2 deelnemers krijgen jullie gewoon elkaar.</Notice>}

      {draw && !drawValid && (
        <Notice tone="warn">
          De lijst is gewijzigd (deelnemers toegevoegd of verwijderd) sinds de trekking. Trek opnieuw voor je afdrukt.
        </Notice>
      )}
      {draw && drawValid && (
        <Notice tone="ok">
          ✔ Ketting gemaakt voor <strong>{draw.order.length} spelers</strong> op{' '}
          {new Date(draw.createdAt).toLocaleString('nl-BE', { dateStyle: 'long', timeStyle: 'short' })}.
          {playing && ' Niemand, ook jij niet, kan zien wie wie heeft.'}
        </Notice>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant={draw && drawValid ? 'secondary' : 'primary'} onClick={handleDraw} disabled={n < 2} className="px-6 py-3 text-base">
          {draw ? '🔁 Opnieuw trekken' : '🎲 Maak de ketting'}
        </Button>
        {!playing && draw && drawValid && (
          <Button onClick={() => setShowOverview(!showOverview)}>{showOverview ? 'Verberg overzicht' : 'Toon overzicht'}</Button>
        )}
      </div>

      {!playing && showOverview && draw && drawValid && (
        <ol className="mt-4 columns-1 gap-6 text-sm sm:columns-2">
          {draw.order.map((id, i) => (
            <li key={id} className="break-inside-avoid py-0.5">
              {displayName(byId.get(id)!)} <span className="text-slate-400">→</span>{' '}
              {displayName(byId.get(draw.order[(i + 1) % draw.order.length])!)}
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
