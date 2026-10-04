import { useState, type FormEvent } from 'react';
import { downloadText, sealBackup, type BackupContent } from '../lib/sealedBackup';
import { Button, inputClass, Modal, Notice } from './ui';

interface Props {
  content: BackupContent;
  onClose: () => void;
}

export default function BackupDialog({ content, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const tooShort = password.length < 6;
  const mismatch = repeat !== '' && repeat !== password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (tooShort || password !== repeat) return;
    setBusy(true);
    const text = await sealBackup(content, password);
    const date = new Date(content.draw.createdAt).toISOString().slice(0, 10);
    downloadText(`gotcha-back-up-${date}.gotcha`, text);
    setBusy(false);
    setDone(true);
    setPassword('');
    setRepeat('');
  };

  return (
    <Modal title="Verzegelde back-up" onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <Notice tone="ok">De back-up is gedownload. Bewaar het bestand goed; het wachtwoord kent enkel je collega.</Notice>
          <div className="text-right">
            <Button variant="primary" onClick={onClose}>
              Sluiten
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-700">
            Met deze back-up kan iemand later een verloren kaartje opnieuw afdrukken. Laat een <strong>collega</strong> het
            wachtwoord kiezen en intypen: zo kan jij de back-up zelf niet openen en blijf je blind.
          </p>
          <Notice>
            Openen gaat via <strong>Back-up openen</strong> onderaan deze website. Zonder het juiste wachtwoord kan niemand
            de back-up lezen, ook wij niet. Wachtwoord vergeten? Dan is de back-up onbruikbaar.
          </Notice>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Wachtwoord (minstens 6 tekens)</span>
            <input type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Herhaal wachtwoord</span>
            <input type="password" autoComplete="new-password" className={inputClass} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
            {mismatch && <span className="text-xs text-red-700">De wachtwoorden zijn niet gelijk.</span>}
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Annuleren</Button>
            <Button type="submit" variant="primary" disabled={busy || tooShort || password !== repeat}>
              {busy ? 'Bezig...' : '🔒 Back-up downloaden'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
