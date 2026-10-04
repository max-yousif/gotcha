import type { Participant } from './types';

export function newId(): string {
  return crypto.randomUUID();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Weergavenaam inclusief klas, bv. "Bert Peeters (5B)". */
export function displayName(p: Pick<Participant, 'name' | 'klas'>): string {
  return p.klas ? `${p.name} (${p.klas})` : p.name;
}

/** Sorteer per klas, daarna op naam (handig om per klas uit te delen). */
export function compareByKlasAndName(a: Participant, b: Participant): number {
  return (
    a.klas.localeCompare(b.klas, 'nl', { numeric: true, sensitivity: 'base' }) ||
    a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' })
  );
}

/** Id's van deelnemers waarvan naam + klas meer dan één keer voorkomt. */
export function findDuplicates(participants: readonly Participant[]): Set<string> {
  const byKey = new Map<string, string[]>();
  for (const p of participants) {
    const key = `${p.name.trim().toLocaleLowerCase('nl')}|${p.klas.trim().toLocaleLowerCase('nl')}`;
    byKey.set(key, [...(byKey.get(key) ?? []), p.id]);
  }
  return new Set([...byKey.values()].filter((ids) => ids.length > 1).flat());
}

const HEADER_ALIASES: Record<Field, string[]> = {
  name: ['naam', 'name', 'leerling', 'deelnemer', 'volledige naam'],
  firstName: ['voornaam', 'first name', 'firstname'],
  lastName: ['achternaam', 'familienaam', 'last name', 'lastname', 'surname'],
  klas: ['klas', 'klasgroep', 'groep', 'class', 'group'],
  email: ['email', 'e-mail', 'mail', 'emailadres', 'e-mailadres', 'email address'],
};

/** Kolommen die we kunnen inlezen. */
export type Field = 'name' | 'firstName' | 'lastName' | 'klas' | 'email';

/** Welke kolom (0, 1, 2, ...) bij welk veld hoort. */
export type Mapping = Partial<Record<Field, number>>;

export const FIELD_LABELS: Record<Field, string> = {
  name: 'Naam',
  firstName: 'Voornaam',
  lastName: 'Achternaam',
  klas: 'Klas',
  email: 'E-mail',
};

/** Zonder titelrij: naam, klas, e-mail. */
export const DEFAULT_MAPPING: Mapping = { name: 0, klas: 1, email: 2 };

/** Herkent kolomtitels; geeft null als er geen naamkolom gevonden wordt. */
export function detectHeader(cells: readonly string[]): Mapping | null {
  const found: Mapping = {};
  cells.forEach((cell, i) => {
    // "E-mail (optioneel)" → "e-mail"
    const c = cell.replace(/\(.*?\)/g, '').trim().toLocaleLowerCase('nl');
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [Field, string[]][]) {
      if (found[field] === undefined && aliases.includes(c)) found[field] = i;
    }
  });
  const hasName = found.name !== undefined || found.firstName !== undefined || found.lastName !== undefined;
  return hasName ? found : null;
}

/** Zet rijen om naar deelnemers volgens de gekozen kolommen; rijen zonder naam vallen weg. */
export function rowsToParticipants(rows: readonly (readonly string[])[], mapping: Mapping): Omit<Participant, 'id'>[] {
  const cell = (row: readonly string[], field: Field) =>
    mapping[field] === undefined ? '' : (row[mapping[field]!] ?? '').trim();

  return rows
    .map((row) => {
      const name = cell(row, 'name') || [cell(row, 'firstName'), cell(row, 'lastName')].filter(Boolean).join(' ');
      return { name, klas: cell(row, 'klas'), email: cell(row, 'email') };
    })
    .filter((p) => p.name !== '');
}

/**
 * Leest een lijst die uit Excel geplakt werd (kolommen gescheiden door tab of ;).
 * Met titelrij worden kolommen herkend (naam / voornaam + achternaam / klas / e-mail);
 * zonder titelrij is de volgorde: naam, klas, e-mail.
 */
export function parsePastedList(text: string): Omit<Participant, 'id'>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const sep = lines.some((l) => l.includes('\t')) ? '\t' : ';';
  const rows = lines.map((l) => l.split(sep).map((c) => c.trim()));

  const header = detectHeader(rows[0]);
  return rowsToParticipants(header ? rows.slice(1) : rows, header ?? DEFAULT_MAPPING);
}
