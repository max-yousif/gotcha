# E-mailserver instellen (Brevo + Cloudflare Worker)

Met deze kleine server verstuurt de website zelf de e-mails met ieders doelwit. Jij als
organisator ziet de inhoud nooit. Je doet dit **één keer**; reken op ongeveer 15 minuten.

Je hebt nodig:
- een gratis **Brevo**-account met een bevestigde afzender en een API-sleutel
  (300 mails per dag gratis),
- een gratis **Cloudflare**-account (geen domeinnaam nodig),
- een computer met [Node.js](https://nodejs.org) (versie 20 of nieuwer).

## 1. Brevo

1. Maak een account op [brevo.com](https://www.brevo.com).
2. Ga naar *Senders, Domains & Dedicated IPs* → *Senders* → *Add a sender*. Vul je naam en
   e-mailadres in en klik op de bevestigingslink in de mail die je krijgt.
3. Ga naar *SMTP & API* → tabblad *API Keys* → *Generate a new API key*. Kopieer de sleutel
   en bewaar hem veilig. Zet hem nergens in een bestand of op GitHub.
4. Laat bij *Security* → *Authorized IPs* de blokkering **uit** (Deactivated): de Worker
   verstuurt niet altijd vanaf hetzelfde adres.

## 2. Cloudflare

Maak een gratis account op [cloudflare.com](https://dash.cloudflare.com/sign-up).

## 3. De Worker online zetten

Open een terminal in deze map (`api/`) en voer uit:

```bash
npx wrangler login                          # opent je browser om in te loggen bij Cloudflare
npx wrangler secret put BREVO_API_KEY       # plak de sleutel uit stap 1.3
npx wrangler secret put SENDER_EMAIL        # je bevestigde afzenderadres uit stap 1.2
npx wrangler secret put ORGANIZER_PASSWORD  # kies zelf een wachtwoord om te mogen versturen
npx wrangler deploy
```

Bij de eerste `secret put` vraagt Wrangler of het de Worker mag aanmaken: antwoord **ja**.

Na `deploy` zie je het adres van je Worker, bv.
`https://gotcha-mail.jouwnaam.workers.dev`. Dat adres vul je in op de website bij
**E-mail versturen**.

## 4. Instellingen

In `wrangler.toml`:
- `ALLOWED_ORIGIN`: de website die mag versturen. Standaard
  `https://max-yousif.github.io`. Gebruik je een ander adres, pas dit dan aan en voer
  opnieuw `npx wrangler deploy` uit.
- `SENDER_NAME`: de naam die ontvangers als afzender zien (leeg = naam van het spel).

## Beveiliging

- De Brevo-sleutel staat enkel als geheim bij Cloudflare.
- Versturen kan alleen vanaf de ingestelde website **en** met het organisatorwachtwoord.
- Maximaal 50 e-mails per keer, altijd met het vaste spelbericht (geen vrije tekst), zodat
  niemand de server kan misbruiken om spam te sturen.
- De server bewaart niets: namen en adressen worden enkel gebruikt om te versturen.

## Wachtwoord of sleutel wijzigen

Voer gewoon opnieuw `npx wrangler secret put ORGANIZER_PASSWORD` (of `BREVO_API_KEY`) uit.
