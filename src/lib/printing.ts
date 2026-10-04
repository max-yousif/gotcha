import type { CardData } from '../components/PrintArea';
import { targetsFromChain } from './chain';
import { createRevealToken, revealUrl } from './token';
import type { Draw, Participant, ThemeId } from './types';

/** Koppelt elke speler aan zijn doelwit volgens de trekking. */
export function cardsFromDraw(draw: Draw, participants: readonly Participant[]): CardData[] {
  const byId = new Map(participants.map((p) => [p.id, p]));
  return [...targetsFromChain(draw.order)].flatMap(([player, target]) => {
    const p = byId.get(player);
    const t = byId.get(target);
    return p && t ? [{ player: p, target: t }] : [];
  });
}

/** Het adres van deze website zonder #-deel, bv. https://naam.github.io/gotcha/ */
export function siteBaseUrl(): string {
  return `${location.origin}${location.pathname}`;
}

/** Maakt voor elk kaartje een persoonlijke, versleutelde link voor de QR-code. */
export async function makeQrUrls(cards: readonly CardData[], eventName: string, theme: ThemeId): Promise<Map<string, string>> {
  const base = siteBaseUrl();
  const entries = await Promise.all(
    cards.map(async ({ player, target }) => {
      const token = await createRevealToken({
        p: player.name,
        t: target.name,
        k: target.klas,
        e: eventName,
        th: theme,
      });
      return [player.id, revealUrl(base, token)] as const;
    }),
  );
  return new Map(entries);
}
