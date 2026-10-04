/** E-mailsjablonen per thema. Gedeeld door de Worker (versturen) en de tests. */

export type ThemeId = 'gotcha' | 'santa' | 'valentine';

export interface MailContent {
  eventName: string;
  theme: ThemeId;
  rules: string;
  /** naam van de ontvanger */
  name: string;
  target: string;
  targetKlas: string;
}

const THEMES: Record<ThemeId, { emoji: string; label: string; intro: string; color: string }> = {
  gotcha: { emoji: '🔪', label: 'Gotcha', intro: 'Jouw doelwit is', color: '#b91c1c' },
  santa: { emoji: '🎅', label: 'Secret Santa', intro: 'Jij koopt een cadeau voor', color: '#15803d' },
  valentine: { emoji: '💘', label: 'Secret Valentine', intro: 'Jouw geheime valentijn is', color: '#be185d' },
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function buildMail(c: MailContent): { subject: string; html: string; text: string } {
  const t = THEMES[c.theme] ?? THEMES.gotcha;
  const event = c.eventName.trim() || t.label;
  const what = c.theme === 'gotcha' ? 'doelwit' : 'geheime persoon';
  const target = c.targetKlas ? `${c.target} (${c.targetKlas})` : c.target;

  const subject = `${t.emoji} Jouw ${what} voor ${event}`;

  const text = [
    `Hallo ${c.name},`,
    '',
    `${t.intro}: ${target}`,
    '',
    'Vertel het aan niemand!',
    ...(c.rules.trim() ? ['', `Spelregels: ${c.rules.trim()}`] : []),
    '',
    `Veel plezier met ${event}!`,
  ].join('\n');

  const e = escapeHtml;
  const html = `<!doctype html>
<html lang="nl"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0" cellpadding="0" cellspacing="0">
<tr><td style="padding:32px;text-align:center">
<div style="font-size:40px">${t.emoji}</div>
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#64748b;font-weight:bold">${e(event)}</div>
<p style="font-size:18px;margin:24px 0 8px">Hallo ${e(c.name)},</p>
<p style="margin:0;color:#475569">${e(t.intro)}</p>
<p style="font-size:28px;font-weight:bold;margin:8px 0 0;color:${t.color}">${e(c.target)}</p>
${c.targetKlas ? `<p style="font-size:16px;font-weight:bold;margin:4px 0 0;color:#334155">${e(c.targetKlas)}</p>` : ''}
<p style="margin:24px 0 0;font-weight:bold">Vertel het aan niemand!</p>
${c.rules.trim() ? `<p style="margin:16px 0 0;font-size:13px;color:#475569;text-align:left">${e(c.rules.trim())}</p>` : ''}
</td></tr></table>
<p style="font-size:11px;color:#94a3b8;margin-top:16px">Deze e-mail werd automatisch verstuurd. De organisator kent de inhoud niet.</p>
</td></tr></table>
</body></html>`;

  return { subject, html, text };
}
