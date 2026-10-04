import { useEffect, useState } from 'react';
import { THEMES } from '../lib/themes';
import { readRevealToken, type RevealData } from '../lib/token';

/** Wat een deelnemer ziet na het scannen van de QR-code op het kaartje. */
export default function RevealPage({ token }: { token: string }) {
  const [data, setData] = useState<RevealData | null>(null);
  const [error, setError] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    readRevealToken(token)
      .then((d) => {
        setData(d);
        document.documentElement.dataset.theme = d.th;
      })
      .catch(() => setError(true));
  }, [token]);

  const theme = data ? (THEMES[data.th] ?? THEMES.gotcha) : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {error && (
          <>
            <div className="text-4xl">🤔</div>
            <h1 className="mt-3 text-xl font-semibold">Deze code werkt niet</h1>
            <p className="mt-2 text-slate-600">Scan de QR-code opnieuw, of vraag de organisator om een nieuw kaartje.</p>
          </>
        )}
        {!error && !data && <p className="text-slate-500">Even geduld...</p>}
        {data && theme && (
          <>
            <div className="text-5xl">{theme.emoji}</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">{data.e || theme.label}</div>
            <h1 className="mt-4 text-2xl font-bold">Hallo {data.p}!</h1>
            {!shown ? (
              <>
                <p className="mt-2 text-slate-600">Zorg dat niemand meekijkt.</p>
                <button
                  type="button"
                  onClick={() => setShown(true)}
                  className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-6 py-4 text-lg font-semibold text-white hover:brightness-110"
                >
                  Toon mijn {theme.id === 'gotcha' ? 'doelwit' : 'geheime persoon'}
                </button>
              </>
            ) : (
              <>
                <p className="mt-6 text-slate-600">{theme.targetIntro}</p>
                <p className="mt-1 text-3xl font-extrabold">{data.t}</p>
                {data.k && <p className="mt-1 text-lg font-semibold text-slate-700">{data.k}</p>}
                <button type="button" onClick={() => setShown(false)} className="mt-6 text-sm text-slate-500 underline">
                  Verberg opnieuw
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
