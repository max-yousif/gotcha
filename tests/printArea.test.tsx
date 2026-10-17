import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrintArea, { type CardData } from '../src/components/PrintArea';
import { THEMES } from '../src/lib/themes';

const people = Array.from({ length: 16 }, (_, i) => ({ id: `p${i}`, name: `Speler${i}`, klas: '5A', email: '' }));
const cards: CardData[] = people.map((p, i) => ({ player: p, target: { ...people[(i + 1) % 16], name: `Doelwit${(i + 1) % 16}` } }));
const qrUrls = new Map(people.map((p) => [p.id, `https://max-yousif.github.io/gotcha/#/r/${p.id}`]));

describe('PrintArea met QR-code op de voorkant', () => {
  it('drukt enkel voorkanten af, met naam en QR-code en zonder doelwitten', () => {
    const { container } = render(
      <PrintArea
        request={{ job: 'cards', cards, participants: people, theme: THEMES.gotcha, eventName: 'Gotcha', rules: '', flip: 'long', cardType: 'qr-front', qrUrls }}
      />,
    );
    expect(container.querySelectorAll('.sheet')).toHaveLength(2); // 16 kaartjes, 15 per vel, geen achterkanten
    expect(container.querySelectorAll('.card-front svg')).toHaveLength(16);
    expect(container.textContent).toContain('Speler3');
    expect(container.textContent).not.toContain('Doelwit');
  });

  it('recto-verso met namen heeft wel achterkanten', () => {
    const { container } = render(
      <PrintArea
        request={{ job: 'cards', cards, participants: people, theme: THEMES.gotcha, eventName: 'Gotcha', rules: '', flip: 'long', cardType: 'names' }}
      />,
    );
    expect(container.querySelectorAll('.sheet')).toHaveLength(4);
    expect(container.textContent).toContain('Doelwit3');
  });
});
