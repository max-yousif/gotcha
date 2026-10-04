import type { CSSProperties, ReactNode } from 'react';
import { CARD_H, CARD_W, COLS, layoutSheets, MARGIN_X, MARGIN_Y, PER_SHEET, ROWS } from '../lib/cardLayout';
import { compareByKlasAndName } from '../lib/participants';
import type { Theme } from '../lib/themes';
import { qrPath } from '../lib/qr';
import type { CardType, Flip, Participant } from '../lib/types';

export type PrintJob = 'cards' | 'test' | 'handout';

export interface CardData {
  player: Participant;
  target: Participant;
}

/** Alles wat nodig is om af te drukken. */
export interface PrintRequest {
  job: PrintJob;
  cards: CardData[];
  participants: Participant[];
  theme: Theme;
  eventName: string;
  rules: string;
  flip: Flip;
  cardType: CardType;
  /** Bij QR-kaartjes: de link per speler-id. */
  qrUrls?: Map<string, string>;
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

function CardFront({ player, theme, eventName, rules, cardType }: { player: Participant; theme: Theme; eventName: string; rules: string; cardType: CardType }) {
  const what = theme.id === 'gotcha' ? 'doelwit' : 'geheime persoon';
  return (
    <div className="card card-front flex flex-col">
      <div className="text-[7pt] font-semibold uppercase tracking-wider text-slate-500">
        {theme.emoji} {eventName}
      </div>
      <div className="mt-[2mm] text-[14pt] font-bold leading-tight break-words">{player.name}</div>
      {player.klas && <div className="text-[10pt] text-slate-600">{player.klas}</div>}
      <div className="mt-auto text-[6pt] leading-snug text-slate-600">{rules}</div>
      <div className="mt-[1.5mm] text-[6.5pt] font-semibold text-slate-800">
        {cardType === 'qr'
          ? `Scan de QR-code op de achterkant voor je ${what}. Toon het aan niemand!`
          : `Draai om voor je ${what}. Toon het aan niemand!`}
      </div>
    </div>
  );
}

function CardBack({ target, theme, patternId }: { target: Participant; theme: Theme; patternId: string }) {
  return (
    <div className="card card-back">
      <SecurityPattern id={patternId} />
      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <div className="text-[13pt]">{theme.emoji}</div>
        <div className="text-[8pt] font-semibold text-slate-700">{theme.targetIntro}</div>
        <div className="mt-[1mm] text-[15pt] font-extrabold leading-tight text-black break-words">{target.name}</div>
        {target.klas && <div className="text-[10pt] font-bold text-black">{target.klas}</div>}
      </div>
    </div>
  );
}

function QrCode({ url }: { url: string }) {
  const { size, path } = qrPath(url);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-[36mm] w-[36mm] bg-white" shapeRendering="crispEdges" aria-hidden="true">
      <rect width={size} height={size} fill="white" />
      <path d={path} fill="black" />
    </svg>
  );
}

function CardBackQr({ url, theme, patternId }: { url: string; theme: Theme; patternId: string }) {
  return (
    <div className="card card-back">
      <SecurityPattern id={patternId} />
      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <div className="mb-[1mm] rounded bg-white px-[2mm] text-[7pt] font-semibold text-slate-700">
          {theme.emoji} Scan om je {theme.id === 'gotcha' ? 'doelwit' : 'geheime persoon'} te zien
        </div>
        <QrCode url={url} />
      </div>
    </div>
  );
}

const empty = (key: string) => <div key={key} />;

export default function PrintArea({ request }: { request: PrintRequest | null }) {
  if (!request) return null;
  const { job, cards, participants, theme, eventName, rules, flip, cardType, qrUrls } = request;

  if (job === 'test') {
    const numbers = Array.from({ length: PER_SHEET }, (_, i) => i + 1);
    const [sheet] = layoutSheets(numbers, flip, (n) => n, (n) => n);
    return (
      <div className="print-area">
        <Sheet
          cells={sheet.front.map((n, i) => (
            <div key={i} className="card card-front flex flex-col items-center justify-center">
              <div className="text-[32pt] font-black">{n}</div>
              <div className="text-[9pt]">Voorkant</div>
            </div>
          ))}
        />
        <Sheet
          cells={sheet.back.map((n, i) => (
            <div key={i} className="card flex flex-col items-center justify-center text-center">
              <div className="text-[32pt] font-black">{n}</div>
              <div className="text-[7pt]">Achterkant: dit nummer moet gelijk zijn aan de voorkant.</div>
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
              {theme.emoji} {eventName}: uitdeellijst{klas ? ` ${klas}` : ''}
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
    const sheets = layoutSheets(sorted, flip, (c) => c.player, (c) => c);
    return (
      <div className="print-area">
        {sheets.flatMap((sheet, s) => [
          <Sheet
            key={`f${s}`}
            cells={sheet.front.map((p, i) =>
              p ? (
                <CardFront key={i} player={p} theme={theme} eventName={eventName} rules={rules} cardType={cardType} />
              ) : (
                empty(`${i}`)
              ),
            )}
          />,
          <Sheet
            key={`b${s}`}
            cells={sheet.back.map((c, i) => {
              if (!c) return empty(`${i}`);
              const url = qrUrls?.get(c.player.id);
              return cardType === 'qr' && url ? (
                <CardBackQr key={i} url={url} theme={theme} patternId={`sec-${s}-${i}`} />
              ) : (
                <CardBack key={i} target={c.target} theme={theme} patternId={`sec-${s}-${i}`} />
              );
            })}
          />,
        ])}
      </div>
    );
  }

  return null;
}
