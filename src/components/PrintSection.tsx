import { useState } from 'react';
import { PER_SHEET } from '../lib/cardLayout';
import type { CardType, Flip } from '../lib/types';
import type { PrintJob } from './PrintArea';
import { Button, Notice, Section } from './ui';

interface Props {
  count: number;
  ready: boolean;
  flip: Flip;
  onFlipChange: (f: Flip) => void;
  cardType: CardType;
  onCardTypeChange: (t: CardType) => void;
  onPrint: (job: PrintJob, onlyWithoutEmail?: boolean) => void;
  /** Aantal deelnemers zonder e-mailadres (die krijgen een kaartje als de rest gemaild wordt). */
  withoutEmailCount: number;
  playing: boolean;
}

function Choice<T extends string>({ name, value, options, onChange }: { name: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <label
          key={v}
          className={`cursor-pointer rounded-lg border-2 px-4 py-2 text-sm ${value === v ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-slate-200'}`}
        >
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
          {label}
        </label>
      ))}
    </div>
  );
}

const isLocal = () => ['localhost', '127.0.0.1', ''].includes(location.hostname);

export default function PrintSection({ count, ready, flip, onFlipChange, cardType, onCardTypeChange, onPrint, playing, withoutEmailCount }: Props) {
  const [onlyWithoutEmail, setOnlyWithoutEmail] = useState(false);
  const someHaveEmail = withoutEmailCount < count;
  const only = onlyWithoutEmail && someHaveEmail;
  const cardCount = only ? withoutEmailCount : count;
  const sheets = Math.ceil(cardCount / PER_SHEET);

  return (
    <Section step={4} title="Kaartjes afdrukken">
      {!ready ? (
        <Notice>Maak eerst de ketting (stap 3).</Notice>
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 font-medium">Instellingen in het printvenster</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>
                <strong>Dubbelzijdig / recto-verso</strong> aan
              </li>
              <li>
                Schaal <strong>100%</strong> of <strong>werkelijke grootte</strong> (niet "passend maken")
              </li>
              <li>
                <strong>Kop- en voetteksten</strong> uit
              </li>
            </ul>
          </div>

          <fieldset>
            <legend className="mb-2 font-medium">Soort kaartje</legend>
            <Choice
              name="cardType"
              value={cardType}
              onChange={onCardTypeChange}
              options={[
                ['names', 'Namen: het doelwit staat op de achterkant'],
                ['qr', 'QR-code: scannen met een gsm'],
              ]}
            />
            {cardType === 'qr' && (
              <p className="mt-2 text-sm text-slate-600">
                Op de achterkant staat een persoonlijke QR-code in plaats van een naam. Wie scant, ziet zijn doelwit op deze
                website. Op papier staat dus nergens een naam van een doelwit.
              </p>
            )}
            {cardType === 'qr' && isLocal() && (
              <div className="mt-2">
                <Notice tone="warn">
                  Je gebruikt de website nu op je eigen computer ({location.host || 'lokaal bestand'}). De QR-codes werken enkel
                  als je afdrukt vanaf de online website.
                </Notice>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-medium">Omdraaien langs</legend>
            <Choice
              name="flip"
              value={flip}
              onChange={onFlipChange}
              options={[
                ['long', 'Lange zijde (meest gebruikt)'],
                ['short', 'Korte zijde'],
              ]}
            />
            <p className="mt-1 text-xs text-slate-500">Kies hetzelfde als in het printvenster van je printer.</p>
          </fieldset>

          {someHaveEmail && (
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
                checked={onlyWithoutEmail}
                onChange={(e) => setOnlyWithoutEmail(e.target.checked)}
              />
              <span className="text-sm">
                <span className="font-medium">Enkel deelnemers zonder e-mail ({withoutEmailCount})</span>
                <span className="block text-slate-600">De anderen krijgen hun doelwit via e-mail (stap 5).</span>
              </span>
            </label>
          )}

          <ol className="space-y-3">
            <li className="flex flex-wrap items-center gap-3">
              <Button onClick={() => onPrint('test')}>1. Testpagina afdrukken</Button>
              <span className="text-sm text-slate-600">
                Eén vel. Staat op elke achterkant hetzelfde nummer als op de voorkant? Dan is alles goed.
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => onPrint('cards', only)}>
                2. Kaartjes afdrukken
              </Button>
              <span className="text-sm text-slate-600">
                {cardCount} kaartjes op {sheets} {sheets === 1 ? 'vel' : 'vellen'}, gesorteerd per klas.
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <Button onClick={() => onPrint('handout', only)}>3. Uitdeellijst afdrukken</Button>
              <span className="text-sm text-slate-600">Per klas de namen om af te vinken, zonder doelwitten.</span>
            </li>
          </ol>

          {playing && (
            <Notice>
              <strong>Tip om blind te blijven:</strong> in het afdrukvoorbeeld zie je afwisselend een blad met spelers en een
              blad met doelwitten, nooit wie bij wie hoort. Laat de kaartjes daarna door een collega of leerling snijden en
              uitdelen, of snij ze zelf zonder ze om te draaien.
            </Notice>
          )}
        </div>
      )}
    </Section>
  );
}
