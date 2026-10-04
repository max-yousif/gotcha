import { describe, expect, it } from 'vitest';
import { randomInt, shuffle } from '../src/lib/random';

describe('randomInt', () => {
  it('blijft binnen de grenzen', () => {
    for (let i = 0; i < 2000; i++) {
      const v = randomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('weigert ongeldige grenzen', () => {
    expect(() => randomInt(0)).toThrow();
    expect(() => randomInt(1.5)).toThrow();
  });
});

describe('shuffle', () => {
  it('behoudt alle elementen en wijzigt het origineel niet', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const result = shuffle(input);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
    expect(input).toEqual(Array.from({ length: 50 }, (_, i) => i));
  });
});
