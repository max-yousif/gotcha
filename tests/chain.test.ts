import { describe, expect, it } from 'vitest';
import { createChain, isSingleCycle, targetsFromChain } from '../src/lib/chain';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe('createChain', () => {
  it('maakt altijd één lus waarin niemand zichzelf heeft (2 tot 200 deelnemers)', () => {
    for (let n = 2; n <= 200; n += n < 20 ? 1 : 17) {
      for (let run = 0; run < 20; run++) {
        const targets = targetsFromChain(createChain(ids(n)));
        expect(targets.size).toBe(n);
        expect(isSingleCycle(targets)).toBe(true);
      }
    }
  });

  it('elke mogelijke lus is ongeveer even waarschijnlijk', () => {
    // 4 deelnemers → (4−1)! = 6 verschillende lussen.
    const counts = new Map<string, number>();
    const runs = 12000;
    for (let i = 0; i < runs; i++) {
      const t = targetsFromChain(createChain(ids(4)));
      const key = ids(4).map((id) => t.get(id)).join(',');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const c of counts.values()) {
      expect(c).toBeGreaterThan(runs / 6 * 0.85);
      expect(c).toBeLessThan(runs / 6 * 1.15);
    }
  });

  it('weigert te weinig of dubbele deelnemers', () => {
    expect(() => createChain(['a'])).toThrow();
    expect(() => createChain(['a', 'a', 'b'])).toThrow();
  });
});

describe('isSingleCycle', () => {
  it('herkent twee kleine cirkels als fout', () => {
    const t = new Map([
      ['a', 'b'], ['b', 'a'],
      ['c', 'd'], ['d', 'c'],
    ]);
    expect(isSingleCycle(t)).toBe(false);
  });

  it('herkent iemand die zichzelf heeft als fout', () => {
    expect(isSingleCycle(new Map([['a', 'a'], ['b', 'c'], ['c', 'b']]))).toBe(false);
  });
});
