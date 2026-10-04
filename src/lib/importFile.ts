import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';

export interface ImportedSheet {
  name: string;
  rows: string[][];
}

export class UnsupportedFileError extends Error {
  constructor() {
    super('Dit bestandstype wordt niet ondersteund. Bewaar het bestand in Excel als .xlsx of .csv en probeer opnieuw.');
  }
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString('nl-BE');
  return String(value).trim();
}

/** Leest een Excel- (.xlsx) of CSV-bestand; geeft per werkblad de rijen als tekst. */
export async function readSpreadsheet(file: File): Promise<ImportedSheet[]> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'csv' || ext === 'txt') {
    return [{ name: file.name, rows: parseCsv(await file.text()) }];
  }
  if (ext === 'xlsx') {
    const sheets = await readXlsxFile(file);
    return sheets.map((s) => ({
      name: s.sheet,
      rows: s.data.map((row) => row.map(cellToString)).filter((row) => row.some((c) => c !== '')),
    }));
  }
  throw new UnsupportedFileError();
}

/**
 * Eenvoudige CSV-lezer: herkent ; , of tab als scheidingsteken (Belgische Excel gebruikt ;),
 * ondersteunt aanhalingstekens en slaat lege rijen over.
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const sep = ['\t', ';', ','].reduce((best, s) => (firstLine.split(s).length > firstLine.split(best).length ? s : best), ',');

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === sep) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell.trim());
  rows.push(row);
  return rows.filter((r) => r.some((c) => c !== ''));
}

/** Downloadt een leeg sjabloon met de juiste kolomtitels. */
export function downloadTemplate(): Promise<void> {
  return writeXlsxFile([
    ['Voornaam', 'Achternaam', 'Klas', 'E-mail (optioneel)'],
    ['Anna', 'Peeters', '5B', ''],
    ['Bert', 'Claes', '5A', 'bert@voorbeeld.be'],
  ]).toFile('gotcha-sjabloon.xlsx');
}

/** Volledig overzicht van de ketting (enkel wanneer de organisator niet meespeelt). */
export function downloadOverview(
  fileName: string,
  rows: { player: { name: string; klas: string; email: string }; target: { name: string; klas: string } }[],
): Promise<void> {
  return writeXlsxFile([
    ['Speler', 'Klas', 'E-mail', 'Doelwit', 'Klas doelwit'],
    ...rows.map(({ player, target }) => [player.name, player.klas, player.email, target.name, target.klas]),
  ]).toFile(fileName);
}
