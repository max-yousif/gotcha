import { describe, expect, it } from 'vitest';
import { findDuplicates, isValidEmail, parsePastedList } from '../src/lib/participants';

describe('parsePastedList', () => {
  it('leest naam, klas, e-mail zonder titelrij', () => {
    expect(parsePastedList('Anna Peeters\t5B\tanna@x.be\nBert Claes\t5A\n')).toEqual([
      { name: 'Anna Peeters', klas: '5B', email: 'anna@x.be' },
      { name: 'Bert Claes', klas: '5A', email: '' },
    ]);
  });

  it('herkent Nederlandse kolomtitels in willekeurige volgorde', () => {
    const text = 'Klas\tFamilienaam\tVoornaam\n5B\tPeeters\tAnna\n6C\tDe Smet\tÉlise';
    expect(parsePastedList(text)).toEqual([
      { name: 'Anna Peeters', klas: '5B', email: '' },
      { name: 'Élise De Smet', klas: '6C', email: '' },
    ]);
  });

  it('werkt met puntkomma als scheidingsteken en slaat lege rijen over', () => {
    expect(parsePastedList('Naam;E-mail\nAnna;anna@x.be\n\n;\nBert;')).toEqual([
      { name: 'Anna', klas: '', email: 'anna@x.be' },
      { name: 'Bert', klas: '', email: '' },
    ]);
  });

  it('leest één naam per regel', () => {
    expect(parsePastedList('Anna\nBert\nCharlotte').map((p) => p.name)).toEqual(['Anna', 'Bert', 'Charlotte']);
  });
});

describe('findDuplicates', () => {
  it('vindt dubbele naam + klas, ongeacht hoofdletters', () => {
    const list = [
      { id: '1', name: 'Tom', klas: '5A', email: '' },
      { id: '2', name: 'tom', klas: '5a', email: '' },
      { id: '3', name: 'Tom', klas: '5B', email: '' },
    ];
    expect(findDuplicates(list)).toEqual(new Set(['1', '2']));
  });
});

describe('isValidEmail', () => {
  it('controleert het formaat', () => {
    expect(isValidEmail('anna@school.be')).toBe(true);
    expect(isValidEmail('anna@school')).toBe(false);
    expect(isValidEmail('anna school.be')).toBe(false);
  });
});
