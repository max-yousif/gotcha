import { useMemo, useState, type FormEvent } from 'react';
import { compareByKlasAndName } from '../lib/participants';
import { cardsFromDraw } from '../lib/printing';
import { openBackup, type BackupContent } from '../lib/sealedBackup';
import { THEMES } from '../lib/themes';
import type { CardType } from '../lib/types';
import type { CardData } from './PrintArea';
import { Button, inputClass, Notice, Section } from './ui';

interface Props {
  onPrintCard: (card: CardData, content: BackupContent, cardType: CardType) => void;
  onRestore: (content: BackupContent) => void;
}

/** Voor de collega met het wachtwoord: verloren kaartjes opnieuw afdrukken. */
export default function BackupPage({ onPrintCard, onRestore }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<BackupContent | null>(null);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);
  const [cardType, setCardType] = useState<CardType>('names');

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const opened = await openBackup(await file.text(), password);
      setContent(opened);
      setCardType(opened.settings.cardType ?? 'names');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'De back-up kon niet geopend worden.');
    } finally {
      setBusy(false);
    }
  };

  const cards = useMemo(
    () => (content ? cardsFromDraw(content.draw, content.participants).sort((a, b) => compareByKlasAndName(a.player, b.player)) : []),
    [content],
  );
  const q = search.trim().toLocaleLowerCase('nl');
  const filtered = q ? cards.filter((c) => `${c.player.name} ${c.player.klas}`.toLocaleLowerCase('nl').includes(q)) : cards;
  const theme = content ? THEMES[content.settings.theme] : null;

  return (
    <div className="app mx-auto max-w-3xl space-y-5 px-4 py-8 sm:py-12">
      <a href="#/" className="text-sm text-slate-600 underline">
        ← Terug naar de website
      </a>
      <h1 className="text-3xl font-bold tracking-tight">🔒 Back-up openen</h1>

      {!content ? (
        <Section step={1} title="Bestand en wachtwoord">
          <form onSubmit={unlock} className="space-y-4">
            <p className="text-sm text-slate-700">
              Kies het back-upbestand (<code>.gotcha</code>) en typ het wachtwoord dat je bij het maken koos.
            </p>
            <input
              type="file"
              accept=".gotcha,.json"
              className="block text-sm file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-4 file:py-2"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <input
              type="password"
              autoComplete="current-password"
              className={inputClass}
              placeholder="Wachtwoord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Notice tone="warn">{error}</Notice>}
            <Button type="submit" variant="primary" disabled={!file || !password || busy}>
              {busy ? 'Bezig met openen...' : 'Openen'}
            </Button>
          </form>
        </Section>
      ) : (
        theme && (
          <>
            <Notice tone="ok">
              {theme.emoji} <strong>{content.settings.eventName}</strong>: {cards.length} spelers, trekking van{' '}
              {new Date(content.draw.createdAt).toLocaleString('nl-BE', { dateStyle: 'long', timeStyle: 'short' })}.
            </Notice>

            <Section step={1} title="Kaartje opnieuw afdrukken">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <input className={`${inputClass} max-w-xs`} placeholder="Zoek een naam of klas" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className={`${inputClass} sm:max-w-xs`} value={cardType} onChange={(e) => setCardType(e.target.value as CardType)}>
                  <option value="names">Kaartje met naam</option>
                  <option value="qr">Kaartje met QR-code</option>
                </select>
              </div>
              <p className="mb-3 text-sm text-slate-600">
                Het kaartje komt linksboven op een vel (recto-verso, {content.settings.flip === 'short' ? 'korte' : 'lange'} zijde).
                Toon het doelwit enkel als dat echt nodig is.
              </p>
              <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.player.id} className="border-t border-slate-100 first:border-t-0">
                        <td className="px-3 py-2">
                          {c.player.name} <span className="text-slate-500">{c.player.klas}</span>
                          {revealed === c.player.id && (
                            <div className="text-xs text-slate-700">
                              {theme.targetIntro}: <strong>{c.target.name}</strong> {c.target.klas}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button
                            type="button"
                            className="mr-3 text-xs text-slate-500 underline"
                            onClick={() => setRevealed(revealed === c.player.id ? null : c.player.id)}
                          >
                            {revealed === c.player.id ? 'Verberg' : 'Toon doelwit'}
                          </button>
                          <Button onClick={() => onPrintCard(c, content, cardType)}>Afdrukken</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">Niemand gevonden.</p>}
              </div>
            </Section>

            <Section step={2} title="Herstellen op deze computer">
              <p className="mb-3 text-sm text-slate-700">
                Zet de deelnemers en de trekking terug op deze computer, bv. als de organisator een andere computer gebruikt.
                De gegevens die hier nu staan, worden vervangen.
              </p>
              <Button
                variant="danger"
                onClick={() => confirm('De huidige gegevens op deze computer vervangen door de back-up?') && onRestore(content)}
              >
                Herstel op deze computer
              </Button>
            </Section>
          </>
        )
      )}
    </div>
  );
}
