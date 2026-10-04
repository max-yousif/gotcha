import { randomInt, shuffle, type RandomInt } from './random';

/**
 * Maakt één gesloten lus met alle deelnemers.
 * Resultaat: de volgorde van de lus; order[i] heeft order[i + 1] als doelwit,
 * en de laatste heeft de eerste.
 */
export function createChain(ids: readonly string[], rand: RandomInt = randomInt): string[] {
  if (new Set(ids).size !== ids.length) {
    throw new Error('Elke deelnemer moet een unieke id hebben.');
  }
  if (ids.length < 2) {
    throw new Error('Je hebt minstens 2 deelnemers nodig.');
  }
  return shuffle(ids, rand);
}

/** Zet de volgorde van de lus om naar "speler → doelwit". */
export function targetsFromChain(order: readonly string[]): Map<string, string> {
  const targets = new Map<string, string>();
  order.forEach((id, i) => targets.set(id, order[(i + 1) % order.length]));
  return targets;
}

/** Controle: iedereen één keer speler en één keer doelwit, niemand zichzelf, één lus. */
export function isSingleCycle(targets: ReadonlyMap<string, string>): boolean {
  const n = targets.size;
  if (n < 2) return false;
  if (new Set(targets.values()).size !== n) return false;
  for (const [giver, target] of targets) {
    if (giver === target || !targets.has(target)) return false;
  }
  const start = targets.keys().next().value as string;
  let current = start;
  for (let steps = 1; steps <= n; steps++) {
    current = targets.get(current)!;
    if (current === start) return steps === n;
  }
  return false;
}
