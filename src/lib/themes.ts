import type { ThemeId } from './types';

export interface Theme {
  id: ThemeId;
  emoji: string;
  label: string;
  defaultEventName: string;
  /** Tekst boven de naam van het doelwit op de achterkant. */
  targetIntro: string;
  defaultRules: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  gotcha: {
    id: 'gotcha',
    emoji: '🔪',
    label: 'Gotcha',
    defaultEventName: 'Gotcha',
    targetIntro: 'Jouw doelwit is',
    defaultRules:
      'Schakel je doelwit uit volgens de afspraken. Ben je zelf uitgeschakeld? ' +
      'Geef dan je kaartje of e-mail door aan wie jou uitschakelde: jouw doelwit wordt het nieuwe doelwit van die persoon.',
  },
  santa: {
    id: 'santa',
    emoji: '🎅',
    label: 'Secret Santa',
    defaultEventName: 'Secret Santa',
    targetIntro: 'Jij koopt een cadeau voor',
    defaultRules: 'Koop een leuk cadeautje en hou geheim voor wie het is!',
  },
  valentine: {
    id: 'valentine',
    emoji: '💘',
    label: 'Secret Valentine',
    defaultEventName: 'Secret Valentine',
    targetIntro: 'Jouw geheime valentijn is',
    defaultRules: 'Verras je valentijn met een anoniem briefje of attentie. Verklap niets!',
  },
};
