import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/lib/importFile';
import { detectHeader, rowsToParticipants } from '../src/lib/participants';
import { qrPath } from '../src/lib/qr';

describe('parseCsv', () => {
  it('herkent puntkomma (Belgische Excel) en verwijdert de BOM', () => {
    expect(parseCsv('﻿Naam;Klas\r\nAnna;5A\r\nBert;5B\r\n')).toEqual([
      ['Naam', 'Klas'],
      ['Anna', '5A'],
      ['Bert', '5B'],
    ]);
  });

  it('ondersteunt aanhalingstekens met scheidingstekens en "" erin', () => {
    expect(parseCsv('naam,klas\n"Peeters, Anna","5 ""A"""\n')).toEqual([
      ['naam', 'klas'],
      ['Peeters, Anna', '5 "A"'],
    ]);
  });

  it('slaat lege rijen over', () => {
    expect(parseCsv('a;b\n;\n\nc;d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('detectHeader', () => {
  it('herkent de kolommen van het sjabloon, ook met "(optioneel)"', () => {
    expect(detectHeader(['Voornaam', 'Achternaam', 'Klas', 'E-mail (optioneel)'])).toEqual({
      firstName: 0,
      lastName: 1,
      klas: 2,
      email: 3,
    });
  });

  it('geeft null zonder naamkolom', () => {
    expect(detectHeader(['Anna', '5A'])).toBeNull();
  });
});

describe('rowsToParticipants', () => {
  it('gebruikt de gekozen kolommen en laat rijen zonder naam weg', () => {
    const rows = [
      ['5A', 'Anna', 'anna@x.be'],
      ['5B', '', ''],
    ];
    expect(rowsToParticipants(rows, { klas: 0, name: 1, email: 2 })).toEqual([{ name: 'Anna', klas: '5A', email: 'anna@x.be' }]);
  });
});

describe('qrPath', () => {
  it('maakt een vierkante QR-code met stille zone', () => {
    const { size, path } = qrPath('https://max-yousif.github.io/gotcha/#/r/abc');
    expect(size).toBeGreaterThan(21 + 8 - 1);
    expect(path).toMatch(/^M\d+ \d+h1v1h-1z/);
  });
});
