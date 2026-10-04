// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { fromBase64Url, toBase64Url } from '../src/lib/base64';
import { createRevealToken, readRevealToken, revealUrl, type RevealData } from '../src/lib/token';

const data: RevealData = { p: 'Anna Peeters', t: 'Élise De Smet', k: '5B', e: 'Gotcha 2026', th: 'gotcha' };

describe('reveal token', () => {
  it('versleutelt en ontsleutelt (heen en terug)', async () => {
    const token = await createRevealToken(data);
    expect(await readRevealToken(token)).toEqual(data);
  });

  it('de naam van het doelwit is niet leesbaar in de link', async () => {
    const token = await createRevealToken(data);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(atob(token.replace(/-/g, '+').replace(/_/g, '/'))).not.toContain('Smet');
  });

  it('weigert een beschadigde code', async () => {
    const bytes = fromBase64Url(await createRevealToken(data));
    bytes[bytes.length - 1] ^= 1;
    await expect(readRevealToken(toBase64Url(bytes))).rejects.toThrow();
    await expect(readRevealToken('abc')).rejects.toThrow();
  });

  it('link is kort genoeg voor een goed scanbare QR-code', async () => {
    const url = revealUrl('https://max-yousif.github.io/gotcha/', await createRevealToken(data));
    expect(url.length).toBeLessThan(260);
  });
});
