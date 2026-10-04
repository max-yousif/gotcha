import { PER_SHEET } from '../lib/cardLayout';
import type { Flip } from '../lib/types';
import type { PrintJob } from './PrintArea';
import { Button, Notice, Section } from './ui';

interface Props {
  count: number;
  ready: boolean;
  flip: Flip;
  onFlipChange: (f: Flip) => void;
  onPrint: (job: PrintJob) => void;
  playing: boolean;
}

export default function PrintSection({ count, ready, flip, onFlipChange, onPrint, playing }: Props) {
  const sheets = Math.ceil(count / PER_SHEET);

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
            <legend className="mb-2 font-medium">Omdraaien langs</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['long', 'Lange zijde (meest gebruikt)'],
                  ['short', 'Korte zijde'],
                ] as [Flip, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border-2 px-4 py-2 text-sm ${
                    flip === value ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-slate-200'
                  }`}
                >
                  <input type="radio" name="flip" value={value} checked={flip === value} onChange={() => onFlipChange(value)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">Kies hetzelfde als in het printvenster van je printer.</p>
          </fieldset>

          <ol className="space-y-3">
            <li className="flex flex-wrap items-center gap-3">
              <Button onClick={() => onPrint('test')}>1. Testpagina afdrukken</Button>
              <span className="text-sm text-slate-600">
                Eén vel. Staat op elke achterkant hetzelfde nummer als op de voorkant? Dan is alles goed.
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => onPrint('cards')}>
                2. Kaartjes afdrukken
              </Button>
              <span className="text-sm text-slate-600">
                {count} kaartjes op {sheets} {sheets === 1 ? 'vel' : 'vellen'}, gesorteerd per klas.
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-3">
              <Button onClick={() => onPrint('handout')}>3. Uitdeellijst afdrukken</Button>
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
