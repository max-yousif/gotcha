# Gotcha – geheime kettingtrekking

Website om namen te verdelen voor **Gotcha**, **Secret Santa** of **Secret Valentine**.
Je geeft de deelnemers in (of plakt een lijst uit Excel), de website maakt één geheime
ketting (A → B → C → … → A) en drukt recto-verso kaartjes af: voorkant = speler,
achterkant = doelwit.

- **Blinde modus**: de organisator kan meespelen; de website toont nooit wie wie heeft.
- Alles blijft in de browser, er wordt niets doorgestuurd.

Zie [PLAN.md](PLAN.md) voor het volledige plan en de volgende fases.

## Lokaal ontwikkelen

```bash
npm install
npm run dev      # ontwikkelserver op http://localhost:5173
npm test         # tests
npm run build    # productieversie in dist/
```

## Online zetten (GitHub Pages)

1. Op GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Elke push naar `main` publiceert automatisch de website op
   `https://<gebruikersnaam>.github.io/gotcha/`.

(GitHub Pages is gratis voor publieke repositories; voor een privé-repository is een
betaald GitHub-abonnement nodig.)
