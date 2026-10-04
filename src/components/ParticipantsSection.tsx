import { useMemo, useState, type FormEvent } from 'react';
import { downloadTemplate } from '../lib/importFile';
import { findDuplicates, isValidEmail, newId, parsePastedList } from '../lib/participants';
import ImportDialog from './ImportDialog';
import type { Participant } from '../lib/types';
import { Button, inputClass, Notice, Section } from './ui';

interface Props {
  participants: Participant[];
  onChange: (p: Participant[]) => void;
  playing: boolean;
}

const emptyForm = { name: '', klas: '', email: '' };

export default function ParticipantsSection({ participants, onChange, playing }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteResult, setPasteResult] = useState<string | null>(null);

  const duplicates = useMemo(() => findDuplicates(participants), [participants]);
  const withEmail = participants.filter((p) => p.email.trim()).length;
  const invalidEmails = participants.filter((p) => p.email.trim() && !isValidEmail(p.email)).length;

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onChange([...participants, { id: newId(), name: form.name.trim(), klas: form.klas.trim(), email: form.email.trim() }]);
    setForm({ ...emptyForm, klas: form.klas }); // klas onthouden: handig bij een hele klas na elkaar
  };

  const addPasted = () => {
    const parsed = parsePastedList(pasteText);
    onChange([...participants, ...parsed.map((p) => ({ ...p, id: newId() }))]);
    setPasteResult(`${parsed.length} ${parsed.length === 1 ? 'deelnemer' : 'deelnemers'} toegevoegd.`);
    setPasteText('');
  };

  const importPeople = (people: Omit<Participant, 'id'>[], mode: 'add' | 'replace') => {
    if (mode === 'replace' && !confirm(`De huidige ${participants.length} deelnemers vervangen door ${people.length} nieuwe?`)) return;
    const added = people.map((p) => ({ ...p, id: newId() }));
    onChange(mode === 'replace' ? added : [...participants, ...added]);
    setImportOpen(false);
  };

  const update = (id: string, field: keyof Omit<Participant, 'id'>, value: string) =>
    onChange(participants.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const remove = (id: string) => onChange(participants.filter((p) => p.id !== id));

  const clear = () => {
    if (confirm(`Alle ${participants.length} deelnemers verwijderen?`)) onChange([]);
  };

  return (
    <Section
      step={2}
      title="Deelnemers"
      aside={
        participants.length > 0 &&
        `${participants.length} ${participants.length === 1 ? 'deelnemer' : 'deelnemers'} · ${withEmail} met e-mail`
      }
    >
      {playing && (
        <p className="mb-4 text-sm text-slate-600">Je speelt mee: vergeet jezelf niet toe te voegen.</p>
      )}

      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
        <input className={inputClass} placeholder="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Naam" />
        <input className={inputClass} placeholder="Klas (optioneel)" value={form.klas} onChange={(e) => setForm({ ...form, klas: e.target.value })} aria-label="Klas" />
        <input className={inputClass} type="email" placeholder="E-mail (optioneel)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="E-mail" />
        <Button type="submit" variant="primary" disabled={!form.name.trim()}>
          Toevoegen
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => setImportOpen(true)}>📂 Excel- of CSV-bestand openen</Button>
        <button type="button" className="px-2 text-sm text-slate-600 underline hover:text-slate-900" onClick={() => void downloadTemplate()}>
          Sjabloon downloaden
        </button>
      </div>
      {importOpen && (
        <ImportDialog onImport={importPeople} onClose={() => setImportOpen(false)} hasParticipants={participants.length > 0} />
      )}

      <div className="mt-3 rounded-xl border border-slate-200">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
          onClick={() => setPasteOpen(!pasteOpen)}
          aria-expanded={pasteOpen}
        >
          📋 Lijst plakken uit Excel
          <span className="text-slate-400">{pasteOpen ? '▲' : '▼'}</span>
        </button>
        {pasteOpen && (
          <div className="border-t border-slate-200 p-4">
            <p className="mb-2 text-sm text-slate-600">
              Selecteer in Excel de kolommen (bv. <em>Naam</em>, <em>Klas</em>, <em>E-mail</em>), kopieer en plak hieronder.
              Met een titelrij worden de kolommen herkend, ook <em>Voornaam</em> + <em>Achternaam</em>. Zonder titelrij is de
              volgorde: naam, klas, e-mail. Eén naam per regel mag ook.
            </p>
            <textarea
              className={`${inputClass} min-h-32 font-mono`}
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                setPasteResult(null);
              }}
              placeholder={'Voornaam\tAchternaam\tKlas\nAnna\tPeeters\t5B\nBert\tClaes\t5A'}
            />
            <div className="mt-2 flex items-center gap-3">
              <Button variant="primary" onClick={addPasted} disabled={!pasteText.trim()}>
                Toevoegen aan de lijst
              </Button>
              {pasteResult && <span className="text-sm text-emerald-700">{pasteResult}</span>}
            </div>
          </div>
        )}
      </div>

      {(duplicates.size > 0 || invalidEmails > 0) && (
        <div className="mt-4 space-y-2">
          {duplicates.size > 0 && (
            <Notice tone="warn">
              Sommige namen komen dubbel voor (geel gemarkeerd). Voeg een initiaal of klas toe zodat iedereen weet wie bedoeld wordt.
            </Notice>
          )}
          {invalidEmails > 0 && (
            <Notice tone="warn">{invalidEmails} e-mailadres(sen) lijken niet te kloppen (rood gemarkeerd).</Notice>
          )}
        </div>
      )}

      {participants.length > 0 && (
        <>
          <div className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-2">#</th>
                  <th className="px-2 py-2">Naam</th>
                  <th className="px-2 py-2">Klas</th>
                  <th className="px-2 py-2">E-mail</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {participants.map((p, i) => {
                  const badEmail = p.email.trim() !== '' && !isValidEmail(p.email);
                  return (
                    <tr key={p.id} className={`border-t border-slate-100 ${duplicates.has(p.id) ? 'bg-amber-50' : ''}`}>
                      <td className="px-3 text-slate-400">{i + 1}</td>
                      <td className="px-1 py-1">
                        <input className="w-full min-w-32 rounded px-2 py-1 hover:bg-slate-50 focus:bg-white focus:outline-[var(--accent)]" value={p.name} onChange={(e) => update(p.id, 'name', e.target.value)} aria-label={`Naam ${i + 1}`} />
                      </td>
                      <td className="px-1 py-1">
                        <input className="w-full min-w-16 rounded px-2 py-1 hover:bg-slate-50 focus:bg-white focus:outline-[var(--accent)]" value={p.klas} onChange={(e) => update(p.id, 'klas', e.target.value)} aria-label={`Klas ${i + 1}`} />
                      </td>
                      <td className="px-1 py-1">
                        <input className={`w-full min-w-40 rounded px-2 py-1 hover:bg-slate-50 focus:bg-white focus:outline-[var(--accent)] ${badEmail ? 'bg-red-50 text-red-700' : ''}`} value={p.email} onChange={(e) => update(p.id, 'email', e.target.value)} aria-label={`E-mail ${i + 1}`} />
                      </td>
                      <td className="px-2 text-center">
                        <button type="button" className="rounded px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(p.id)} aria-label={`${p.name} verwijderen`}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Button variant="danger" onClick={clear}>
              Alle deelnemers verwijderen
            </Button>
          </div>
        </>
      )}
    </Section>
  );
}
