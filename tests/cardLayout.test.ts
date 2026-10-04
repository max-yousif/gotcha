import { describe, expect, it } from 'vitest';
import { backIndex, CARD_H, CARD_W, COLS, layoutSheets, MARGIN_X, MARGIN_Y, PER_SHEET, ROWS } from '../src/lib/cardLayout';
import type { Flip } from '../src/lib/types';

/** Simuleert het omdraaien van een vel: waar ligt plaats `index` van de achterkant fysiek? */
function physicalPosition(index: number, flip: Flip) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  return flip === 'long' ? { row, col: COLS - 1 - col } : { row: ROWS - 1 - row, col };
}

describe('backIndex', () => {
  for (const flip of ['long', 'short'] as Flip[]) {
    it(`legt elke achterkant precies achter de voorkant (${flip === 'long' ? 'lange' : 'korte'} zijde)`, () => {
      for (let i = 0; i < PER_SHEET; i++) {
        const pos = physicalPosition(backIndex(i, flip), flip);
        expect(pos.row * COLS + pos.col).toBe(i);
      }
    });
  }
});

describe('layoutSheets', () => {
  it('100 leerlingen → 13 vellen, iedereen één keer voor en achter', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const sheets = layoutSheets(items, 'long', (i) => `voor${i}`, (i) => `achter${i}`);
    expect(sheets).toHaveLength(13);
    const fronts = sheets.flatMap((s) => s.front).filter(Boolean);
    const backs = sheets.flatMap((s) => s.back).filter(Boolean);
    expect(fronts).toHaveLength(100);
    expect(backs).toHaveLength(100);
    sheets.forEach((sheet) =>
      sheet.front.forEach((f, i) => {
        const b = sheet.back[backIndex(i, 'long')];
        expect(b === null ? null : b.replace('achter', '')).toBe(f === null ? null : f.replace('voor', ''));
      }),
    );
  });

  it('past op A4 met symmetrische marges', () => {
    expect(2 * MARGIN_X + COLS * CARD_W).toBeCloseTo(210);
    expect(2 * MARGIN_Y + ROWS * CARD_H).toBeCloseTo(297);
    expect(MARGIN_X).toBeGreaterThanOrEqual(5);
    expect(MARGIN_Y).toBeGreaterThanOrEqual(5);
  });
});
