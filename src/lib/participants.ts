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

const HEADER_ALIASES: Record<'name' | 'firstName' | 'lastName' | 'klas' | 'email', string[]> = {
  name: ['naam', 'name', 'leerling', 'deelnemer', 'volledige naam'],
  firstName: ['voornaam', 'first name', 'firstname'],
  lastName: ['achternaam', 'familienaam', 'last name', 'lastname', 'surname'],
  klas: ['klas', 'klasgroep', 'groep', 'class', 'group'],
  email: ['email', 'e-mail', 'mail', 'emailadres', 'e-mailadres', 'email address'],
};

type Column = keyof typeof HEADER_ALIASES;

function detectHeader(cells: string[]): Partial<Record<Column, number>> | null {
  const found: Partial<Record<Column, number>> = {};
  cells.forEach((cell, i) => {
    const c = cell.trim().toLocaleLowerCase('nl');
    for (const [col, aliases] of Object.entries(HEADER_ALIASES) as [Column, string[]][]) {
      if (found[col] === undefined && aliases.includes(c)) found[col] = i;
    }
  });
  const hasName = found.name !== undefined || found.firstName !== undefined;
  return hasName ? found : null;
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
  const cols: Partial<Record<Column, number>> = header ?? { name: 0, klas: 1, email: 2 };
  const dataRows = header ? rows.slice(1) : rows;
  const cell = (row: string[], col: Column) => (cols[col] === undefined ? '' : (row[cols[col]!] ?? ''));

  return dataRows
    .map((row) => {
      const name =
        cell(row, 'name') || [cell(row, 'firstName'), cell(row, 'lastName')].filter(Boolean).join(' ');
      return { name: name.trim(), klas: cell(row, 'klas'), email: cell(row, 'email') };
    })
    .filter((p) => p.name !== '');
}
