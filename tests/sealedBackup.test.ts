// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { openBackup, sealBackup, WrongPasswordError, type BackupContent } from '../src/lib/sealedBackup';

const content: BackupContent = {
  settings: { theme: 'gotcha', eventName: 'Gotcha', rules: 'Regels', playing: true, cardType: 'names', flip: 'long', mailServer: '' },
  participants: [
    { id: 'a', name: 'Anna', klas: '5A', email: '' },
    { id: 'b', name: 'Bert', klas: '5B', email: 'bert@x.be' },
    { id: 'c', name: 'Charlotte', klas: '5A', email: '' },
  ],
  draw: { order: ['b', 'a', 'c'], createdAt: '2026-10-04T10:00:00.000Z' },
};

describe('verzegelde back-up', () => {
  it('opent met het juiste wachtwoord', async () => {
    const file = await sealBackup(content, 'geheim123');
    expect(await openBackup(file, 'geheim123')).toEqual(content);
  });

  it('bevat geen leesbare namen', async () => {
    const file = await sealBackup(content, 'geheim123');
    expect(file).not.toContain('Anna');
    expect(file).not.toContain('bert@x.be');
  });

  it('weigert een fout wachtwoord', async () => {
    const file = await sealBackup(content, 'geheim123');
    await expect(openBackup(file, 'fout')).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it('weigert een ander bestand', async () => {
    await expect(openBackup('{"iets":"anders"}', 'x')).rejects.toThrow('geen geldig back-upbestand');
    await expect(openBackup('geen json', 'x')).rejects.toThrow('geen geldig back-upbestand');
  });
});
