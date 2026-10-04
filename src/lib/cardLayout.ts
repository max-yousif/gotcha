import type { Flip } from './types';

export const COLS = 3;
export const ROWS = 5;
export const PER_SHEET = COLS * ROWS;

/** Afmetingen in mm (A4 = 210 × 297). Marges links/rechts en boven/onder zijn gelijk,
 *  zodat voor- en achterkant ook na het omdraaien precies op elkaar vallen. */
export const CARD_W = 65;
export const CARD_H = 56;
export const MARGIN_X = (210 - COLS * CARD_W) / 2;
export const MARGIN_Y = (297 - ROWS * CARD_H) / 2;

/**
 * Op welke plaats (rij-per-rij genummerd) van de achterkant komt het kaartje
 * dat op plaats `index` van de voorkant staat?
 *  - lange zijde: het blad draait om een verticale as → kolommen spiegelen
 *  - korte zijde: het blad draait om een horizontale as → rijen spiegelen
 */
export function backIndex(index: number, flip: Flip): number {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  return flip === 'long' ? row * COLS + (COLS - 1 - col) : (ROWS - 1 - row) * COLS + col;
}

export interface Sheet<F, B> {
  front: (F | null)[];
  back: (B | null)[];
}

/** Verdeelt kaartjes over vellen; elk vel heeft een voor- en (gespiegelde) achterkant. */
export function layoutSheets<T, F, B>(
  items: readonly T[],
  flip: Flip,
  toFront: (item: T) => F,
  toBack: (item: T) => B,
): Sheet<F, B>[] {
  const sheets: Sheet<F, B>[] = [];
  for (let start = 0; start < items.length; start += PER_SHEET) {
    const front: (F | null)[] = Array(PER_SHEET).fill(null);
    const back: (B | null)[] = Array(PER_SHEET).fill(null);
    items.slice(start, start + PER_SHEET).forEach((item, i) => {
      front[i] = toFront(item);
      back[backIndex(i, flip)] = toBack(item);
    });
    sheets.push({ front, back });
  }
  return sheets;
}
