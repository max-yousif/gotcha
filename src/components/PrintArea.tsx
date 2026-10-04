import type { CSSProperties, ReactNode } from 'react';
import { CARD_H, CARD_W, COLS, layoutSheets, MARGIN_X, MARGIN_Y, PER_SHEET, ROWS } from '../lib/cardLayout';
import { compareByKlasAndName } from '../lib/participants';
import type { Theme } from '../lib/themes';
import type { Flip, Participant } from '../lib/types';

export type PrintJob = 'cards' | 'test' | 'handout';

export interface CardData {
  player: Participant;
  target: Participant;
}

const sheetStyle: CSSProperties = {
  padding: `${MARGIN_Y}mm ${MARGIN_X}mm`,
  gridTemplateColumns: `repeat(${COLS}, ${CARD_W}mm)`,
  gridTemplateRows: `repeat(${ROWS}, ${CARD_H}mm)`,
};

function Sheet({ cells }: { cells: ReactNode[] }) {
  return (
    <div className="sheet" style={sheetStyle}>
      {cells}
    </div>
  );
}

/** Veiligheidspatroon (zoals bij bankenveloppen): maakt doorschijnen onleesbaar. */
function SecurityPattern({ id }: { id: string }) {
  return (
    <svg className="pattern" aria-hidden="true">
      <defs>
        <pattern id={id} width="14" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
          <text x="0" y="7" fontSize="7" fontWeight="700" fill="#a8b4c4" fontFamily="sans-serif">
            ?×#
          </text>
          <path d="M0 8.5 H14" stroke="#cbd5e1" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function CardFront({ player, theme, eventName, rules }: { player: Participant; theme: Theme; eventName: string; rules: string }) {
  return (
    <div className="card card-front flex flex-col">
      <div className="text-[9pt] font-semibold uppercase tracking-wider text-slate-500">
        {theme.emoji} {eventName}
      </div>
      <div className="mt-[3mm] text-[20pt] font-bold leading-tight">{player.name}</div>
      {player.klas && <div className="text-[12pt] text-slate-600">{player.klas}</div>}
      <div className="mt-auto text-[7.5pt] leading-snug text-slate-600">{rules}</div>
      <div className="mt-[2mm] text-[8pt] font-semibold text-slate-800">
        Draai om voor je {theme.id === 'gotcha' ? 'doelwit' : 'geheime persoon'} — toon het aan niemand!
      </div>
    </div>
  );
}

function CardBack({ target, theme, patternId }: { target: Participant; theme: Theme; patternId: string }) {
  return (
    <div className="card card-back">
      <SecurityPattern id={patternId} />
      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <div className="text-[18pt]">{theme.emoji}</div>
        <div className="text-[10pt] font-semibold text-slate-700">{theme.targetIntro}</div>
        <div className="mt-[1mm] text-[22pt] font-extrabold leading-tight text-black">{target.name}</div>
        {target.klas && <div className="text-[13pt] font-bold text-black">{target.klas}</div>}
      </div>
    </div>
  );
}

const empty = (key: string) => <div key={key} />;

interface Props {
  job: PrintJob | null;
  cards: CardData[];
  participants: Participant[];
  theme: Theme;
  eventName: string;
  rules: string;
  flip: Flip;
}

export default function PrintArea({ job, cards, participants, theme, eventName, rules, flip }: Props) {
  if (job === 'test') {
    const numbers = Array.from({ length: PER_SHEET }, (_, i) => i + 1);
    const [sheet] = layoutSheets(numbers, flip, (n) => n, (n) => n);
    return (
      <div className="print-area">
        <Sheet
          cells={sheet.front.map((n, i) => (
            <div key={i} className="card card-front flex flex-col items-center justify-center">
              <div className="text-[40pt] font-black">{n}</div>
              <div className="text-[10pt]">Voorkant</div>
            </div>
          ))}
        />
        <Sheet
          cells={sheet.back.map((n, i) => (
            <div key={i} className="card flex flex-col items-center justify-center text-center">
              <div className="text-[40pt] font-black">{n}</div>
              <div className="text-[9pt]">Achterkant — dit nummer moet gelijk zijn aan de voorkant.</div>
            </div>
          ))}
        />
      </div>
    );
  }

  if (job === 'handout') {
    const byKlas = new Map<string, Participant[]>();
    for (const p of [...participants].sort(compareByKlasAndName)) {
      byKlas.set(p.klas, [...(byKlas.get(p.klas) ?? []), p]);
    }
    return (
      <div className="print-area font-sans">
        {[...byKlas].map(([klas, list]) => (
          <section key={klas} className="handout-klas">
            <h2 className="mb-2 text-[16pt] font-bold">
              {theme.emoji} {eventName} — uitdeellijst{klas ? ` ${klas}` : ''}
            </h2>
            <table className="w-full border-collapse text-[11pt]">
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-slate-300">
                    <td className="w-[10mm] py-[1.5mm]">☐</td>
                    <td className="py-[1.5mm]">{p.name}</td>
                    <td className="py-[1.5mm] text-right text-slate-500">{p.klas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    );
  }

  if (job === 'cards') {
    const sorted = [...cards].sort((a, b) => compareByKlasAndName(a.player, b.player));
    const sheets = layoutSheets(sorted, flip, (c) => c.player, (c) => c.target);
    return (
      <div className="print-area">
        {sheets.flatMap((sheet, s) => [
          <Sheet
            key={`f${s}`}
            cells={sheet.front.map((p, i) =>
              p ? <CardFront key={i} player={p} theme={theme} eventName={eventName} rules={rules} /> : empty(`${i}`),
            )}
          />,
          <Sheet
            key={`b${s}`}
            cells={sheet.back.map((t, i) =>
              t ? <CardBack key={i} target={t} theme={theme} patternId={`sec-${s}-${i}`} /> : empty(`${i}`),
            )}
          />,
        ])}
      </div>
    );
  }

  return null;
}
