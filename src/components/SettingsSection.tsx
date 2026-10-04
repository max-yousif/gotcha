import { THEMES } from '../lib/themes';
import type { Settings, ThemeId } from '../lib/types';
import { inputClass, Section } from './ui';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

export default function SettingsSection({ settings, onChange }: Props) {
  const selectTheme = (id: ThemeId) => {
    const old = THEMES[settings.theme];
    const next = THEMES[id];
    onChange({
      ...settings,
      theme: id,
      // Enkel overschrijven als de organisator de standaardtekst niet aanpaste.
      eventName: settings.eventName === old.defaultEventName ? next.defaultEventName : settings.eventName,
      rules: settings.rules === old.defaultRules ? next.defaultRules : settings.rules,
    });
  };

  return (
    <Section step={1} title="Spel">
      <div className="grid gap-2 sm:grid-cols-3">
        {Object.values(THEMES).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTheme(t.id)}
            className={`rounded-xl border-2 px-4 py-3 text-left transition ${
              settings.theme === t.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-2xl">{t.emoji}</span>
            <span className="ml-2 font-semibold">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Naam van het spel</span>
          <input
            className={inputClass}
            value={settings.eventName}
            onChange={(e) => onChange({ ...settings, eventName: e.target.value })}
            placeholder="bv. Gotcha 6de jaar 2026"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Spelregels (komen op de voorkant van elk kaartje)</span>
          <textarea
            className={`${inputClass} min-h-20`}
            value={settings.rules}
            maxLength={350}
            onChange={(e) => onChange({ ...settings, rules: e.target.value })}
          />
          <span className="text-xs text-slate-500">{settings.rules.length}/350 tekens</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--accent)]"
            checked={settings.playing}
            onChange={(e) => onChange({ ...settings, playing: e.target.checked })}
          />
          <span>
            <span className="font-medium">Ik speel zelf mee</span>
            <span className="block text-sm text-slate-600">
              {settings.playing
                ? 'Blinde modus: de website toont nooit wie wie heeft. Ook jij krijgt je doelwit enkel via je eigen kaartje.'
                : 'Je speelt niet mee: na de trekking kan je het volledige overzicht bekijken.'}
            </span>
          </span>
        </label>
      </div>
    </Section>
  );
}
