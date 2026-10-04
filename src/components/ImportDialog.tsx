import { useMemo, useState, type DragEvent } from 'react';
import { readSpreadsheet, type ImportedSheet } from '../lib/importFile';
import { DEFAULT_MAPPING, detectHeader, FIELD_LABELS, rowsToParticipants, type Field, type Mapping } from '../lib/participants';
import type { Participant } from '../lib/types';
import { Button, inputClass, Modal, Notice } from './ui';

interface Props {
  onImport: (people: Omit<Participant, 'id'>[], mode: 'add' | 'replace') => void;
  onClose: () => void;
  hasParticipants: boolean;
}

const FIELDS: Field[] = ['name', 'firstName', 'lastName', 'klas', 'email'];

/** Kolomletter zoals in Excel: 0 → A, 1 → B, ... */
const colLetter = (i: number) => String.fromCharCode(65 + (i % 26)).repeat(Math.floor(i / 26) + 1);

export default function ImportDialog({ onImport, onClose, hasParticipants }: Props) {
  const [sheets, setSheets] = useState<ImportedSheet[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [sheetIndex, setSheetIndex] = useState(0);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<Mapping>({});
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const rows = sheets?.[sheetIndex]?.rows ?? [];
  const columnCount = Math.max(0, ...rows.slice(0, 50).map((r) => r.length));

  const selectSheet = (all: ImportedSheet[], index: number) => {
    setSheetIndex(index);
    const first = all[index]?.rows[0] ?? [];
    const detected = detectHeader(first);
    setHasHeader(detected !== null);
    setMapping(detected ?? DEFAULT_MAPPING);
  };

  const load = async (file: File) => {
    setError(null);
    try {
      const result = await readSpreadsheet(file);
      if (result.every((s) => s.rows.length === 0)) throw new Error('Het bestand is leeg.');
      setFileName(file.name);
      setSheets(result);
      selectSheet(result, Math.max(0, result.findIndex((s) => s.rows.length > 0)));
    } catch (e) {
      setSheets(null);
      setError(e instanceof Error ? e.message : 'Het bestand kon niet gelezen worden.');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void load(file);
  };

  const people = useMemo(() => rowsToParticipants(hasHeader ? rows.slice(1) : rows, mapping), [rows, hasHeader, mapping]);
  const hasNameColumn = mapping.name !== undefined || mapping.firstName !== undefined || mapping.lastName !== undefined;
  const header = hasHeader ? rows[0] : undefined;

  const setField = (field: Field, value: string) => {
    const next = { ...mapping };
    if (value === '') delete next[field];
    else next[field] = Number(value);
    setMapping(next);
  };

  return (
    <Modal title="Excel- of CSV-bestand openen" onClose={onClose}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
          dragging ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="text-2xl">📂</span>
        <span className="mt-1 font-medium">{fileName || 'Sleep je bestand hierheen of klik om te kiezen'}</span>
        <span className="text-slate-500">Excel (.xlsx) of CSV (.csv)</span>
        <input
          type="file"
          accept=".xlsx,.csv,.txt"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void load(file);
            e.target.value = '';
          }}
        />
      </label>

      {error && (
        <div className="mt-4">
          <Notice tone="warn">{error}</Notice>
        </div>
      )}

      {sheets && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {sheets.length > 1 && (
              <label className="flex items-center gap-2 text-sm">
                Werkblad
                <select className={`${inputClass} sm:max-w-xs`} value={sheetIndex} onChange={(e) => selectSheet(sheets, Number(e.target.value))}>
                  {sheets.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name} ({s.rows.length} rijen)
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
              Eerste rij bevat kolomtitels
            </label>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Welke kolom is wat?</h3>
            <div className="grid gap-2 sm:grid-cols-5">
              {FIELDS.map((field) => (
                <label key={field} className="text-sm">
                  <span className="mb-1 block text-slate-600">{FIELD_LABELS[field]}</span>
                  <select className={inputClass} value={mapping[field] ?? ''} onChange={(e) => setField(field, e.target.value)}>
                    <option value="">(geen)</option>
                    {Array.from({ length: columnCount }, (_, i) => (
                      <option key={i} value={i}>
                        {colLetter(i)}
                        {header?.[i] ? `: ${header[i]}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Gebruik ofwel <em>Naam</em>, ofwel <em>Voornaam</em> + <em>Achternaam</em>. Klas en e-mail zijn optioneel.
            </p>
          </div>

          {!hasNameColumn ? (
            <Notice tone="warn">Kies welke kolom de naam bevat.</Notice>
          ) : (
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Voorbeeld: {people.length} {people.length === 1 ? 'deelnemer' : 'deelnemers'} gevonden
              </h3>
              <div className="max-h-60 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Naam</th>
                      <th className="px-3 py-2">Klas</th>
                      <th className="px-3 py-2">E-mail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.slice(0, 10).map((p, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{p.name}</td>
                        <td className="px-3 py-1.5">{p.klas}</td>
                        <td className="px-3 py-1.5">{p.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {people.length > 10 && <p className="px-3 py-2 text-xs text-slate-500">... en nog {people.length - 10} anderen</p>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={onClose}>Annuleren</Button>
            {hasParticipants && (
              <Button onClick={() => onImport(people, 'replace')} disabled={people.length === 0}>
                Huidige lijst vervangen
              </Button>
            )}
            <Button variant="primary" onClick={() => onImport(people, 'add')} disabled={people.length === 0}>
              {hasParticipants ? 'Toevoegen aan de lijst' : `${people.length} deelnemers toevoegen`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
