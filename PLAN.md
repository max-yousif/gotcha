# Gotcha / Secret Santa / Secret Valentine: Projectplan

Een eenvoudige website waarin de organisator een lijst deelnemers ingeeft (of importeert
uit Excel) en de app **één gesloten ketting** maakt: A → B → C → … → Z → A. Iedereen
krijgt precies één doelwit (Gotcha: wie je moet "uitschakelen"; Secret Santa/Valentine:
voor wie je een cadeau koopt), en iedereen is het doelwit van precies één andere persoon.

De volledige website is in het **Nederlands**.

Twee situaties bepalen het ontwerp:

| | School (± 100 leerlingen) | Vrienden (5 tot 30 personen) |
|---|---|---|
| E-mailadressen | **Niet beschikbaar** | Optioneel, per persoon |
| Verdeling | Afgedrukte kaartjes, uitgedeeld in de klas | E-mail (of afgedrukte kaartjes) |
| Gsm nodig? | **Nee** (namen op papier); QR-code is een optie | Nee, enkel e-mail |
| Organisator speelt mee | Ja | Ja |

---

## 1. Doelen

### Basis
1. Deelnemers manueel toevoegen (naam, klas optioneel, **e-mail optioneel**) of
   **importeren uit Excel/CSV**. Een lijst mag mensen met en zonder e-mail mengen.
2. **Eén enkele lus** maken met iedereen erin (geen kleine deelcirkels), en niemand
   trekt zichzelf.
3. **Blinde modus**: de organisator speelt mee en ziet dus nooit wie wie heeft, ook
   niet wie de organisator zelf heeft.
4. Verdelen zonder gsm of e-mail: afdrukbare kaartjes, met keuze tussen
   **gewone namen** of **QR-code**.
5. Verdelen via **e-mail** voor wie een adres heeft.
6. Werkt in de browser: geen account, leerlingennamen verlaten de computer niet
   (behalve bij automatische e-mail, zie §5.4).

### Later
- Uitsluitingsregels ("Anna mag haar partner Bert niet trekken", "niet iemand uit je
  eigen klas").
- Levenscodes tegen valsspelen bij Gotcha.

### Niet de bedoeling
- Gebruikersaccounts, betalingen, WhatsApp/gsm-nummers.
- Centraal bijhouden van het Gotcha-spelverloop (het spel loopt via de kaartjes, §6).

---

## 2. Waarom één lange ketting belangrijk is

Een gewone lottrekking kan uiteenvallen in kleine cirkels, bv. A→B→A en C→D→E→C. Voor
cadeautjes maakt dat niet uit, maar voor **Gotcha werkt het spel dan niet**: als er
nog één klein cirkeltje over is, kan de winnaar niet verder naar de rest van de groep.
Eén enkele lus garandeert dat:
- wie zijn doelwit uitschakelt, **het doelwit van zijn slachtoffer** overneemt, en
- de ketting één voor één kleiner wordt tot er één winnaar overblijft.

Voor Secret Santa/Valentine is één lus evengoed geldig, dus de app maakt altijd één lus.

---

## 3. Het algoritme

### 3.1 Basisketting
```
1. deelnemers = [p1, p2, ..., pn]           (n >= 3; bij n = 2 krijgen ze elkaar)
2. schud de lijst met Fisher-Yates op basis van crypto.getRandomValues
   (niet Math.random: zo is de trekking eerlijk en onvoorspelbaar)
3. voor i in 0..n-1:
       doelwit[geschud[i]] = geschud[(i + 1) % n]
```
Eigenschappen (gecontroleerd door automatische tests):
- iedereen komt precies één keer voor als speler en één keer als doelwit,
- niemand heeft zichzelf,
- als je de doelwitten volgt vanaf eender wie, passeer je iedereen en kom je terug bij
  het begin.

Elke mogelijke lus is even waarschijnlijk. Voor 100 leerlingen duurt dit een fractie
van een seconde.

### 3.2 Met uitsluitingen (later)
Uitsluitingen zijn paren die niet naast elkaar mogen staan in de ketting (partners,
broers/zussen, dezelfde klas, het koppel van vorig jaar):
1. Probeer tot ± 1 000 willekeurige schuddingen en neem de eerste die klopt.
2. Lukt dat niet: een slimmere zoekmethode (backtracking) met tijdslimiet.
3. Nog steeds niets: meld welke **regel** het onmogelijk maakt ("Anna is uitgesloten
   van iedereen behalve Bert"), nooit een resultaat, zodat de organisator blind blijft.

### 3.3 Dubbele namen
Elke deelnemer krijgt intern een uniek nummer. Bij dubbele namen verschijnt een
waarschuwing met de suggestie om een initiaal of klas toe te voegen ("Tom V.",
"Tom (5B)"). Belangrijk bij 100 leerlingen.

---

## 4. Importeren uit Excel / CSV

Bibliotheek: **SheetJS (`xlsx`)**: leest `.xlsx`, `.xls`, `.ods` en `.csv` rechtstreeks
in de browser.

Werkwijze:
1. Bestand slepen of kiezen.
2. Eerste werkblad inlezen (met keuzemenu als er meerdere zijn).
3. **Kolommen automatisch herkennen** op basis van de kolomtitel:
   - naam (verplicht): `naam`, `voornaam` + `achternaam`, `familienaam`, `leerling`
   - klas (optioneel): `klas`, `groep`, `klasgroep`
   - e-mail (**optioneel**): `email`, `e-mail`, `mail`, `emailadres`
4. **Voorbeeldtabel** met keuzemenu's om de herkenning te corrigeren ("E-mail: geen"
   is een geldige keuze) en een vinkje "eerste rij bevat titels".
5. Controle: spaties wegwerken, lege rijen overslaan, ongeldige e-mails en dubbele
   namen markeren (waarschuwing, nooit blokkerend).
6. Toevoegen aan of vervangen van de huidige lijst.

Een klaslijst uit Smartschool/Excel (naam + klas, geen e-mail) moet zonder aanpassingen
ingelezen kunnen worden.

Extra:
- **Sjabloon downloaden** (`gotcha-sjabloon.xlsx`) met kolommen
  `Voornaam | Achternaam | Klas | E-mail (optioneel)`,
- **Plakken uit Excel**: een kolom kopiëren en in een tekstvak plakken, één naam per
  regel (optioneel met e-mail in de tweede kolom).

---

## 5. Blind blijven & doelwitten verdelen

### 5.1 Blinde modus (standaard aan bij "Ik speel zelf mee")
- De volledige ketting wordt **nooit getoond**; er is geen overzicht voor de organisator.
- Na de trekking toont de app enkel *hoe* je verdeelt ("100 kaartjes klaar om af te
  drukken"), nooit *wat* erop staat.
- De ketting wordt **niet leesbaar opgeslagen** (versleuteld), zodat je ze ook niet per
  ongeluk tegenkomt.
- De organisator krijgt zijn eigen doelwit op dezelfde manier als iedereen: via zijn
  eigen kaartje of e-mail.
- **Verzegelde back-up** (optioneel): de ketting downloaden als bestand met wachtwoord.
  Een collega kiest het wachtwoord, zodat de organisator het zelf niet kan openen.
  Enkel voor noodgevallen (verloren kaartje, discussie).
- Wie niet meespeelt, kan de blinde modus uitzetten en krijgt dan een volledig
  overzicht + export naar Excel.

Eerlijke kanttekening: een organisator die echt wil valsspelen, kan altijd een kaartje
omdraaien of openvouwen. De blinde modus zorgt ervoor dat je **nooit per ongeluk**
iets ziet, ook niet op het scherm of in het afdrukvoorbeeld (zie §5.2).

### 5.2 Afdrukbare kaartjes: namen of QR-code

Bij het afdrukken kies je:

| Optie | Binnenkant van het kaartje | Gsm nodig? |
|---|---|---|
| **Namen** (standaard) | "Jouw doelwit: **Bert Peeters (5B)**" | Nee |
| **QR-code** | QR-code + korte controlecode; de leerling scant en ziet zijn doelwit op de website | Ja |

Beide opties gebruiken dezelfde slimme lay-out die de organisator blind houdt:

**Recto-verso afdrukken**
- **Voorkant** (oneven pagina's): naam + klas van de speler, naam van het spel,
  korte spelregels.
- **Achterkant** (even pagina's): het doelwit, gespiegeld geplaatst zodat het precies
  achter het juiste kaartje valt bij recto-verso afdrukken.
- Gevolg: op het scherm en in het afdrukvoorbeeld zie je óf een lijst spelers, óf een
  lijst doelwitten, maar **nooit welke bij welke hoort**. Aangezien iedereen ook ergens
  doelwit is, verraadt de lijst doelwitten niets.
- De achterkant krijgt een **veiligheidspatroon** (zoals bij bankenveloppen) zodat je
  het doelwit niet door het papier heen kan lezen.
- Geen recto-verso printer? Eerst alle voorkanten afdrukken, papier terugleggen, dan
  de achterkanten. De app toont een korte uitleg + een testpagina om te controleren
  hoe je printer het papier draait.

**Lay-out**
- A4, 15 kaartjes per pagina (3 kolommen × 5 rijen) → 7 vellen voor 100 leerlingen.
- Snijlijnen; optioneel een vouwlijn zodat het kaartje dicht kan.
- Gesorteerd per klas, daarna op naam: uitdelen per klas gaat vlot.
- Optioneel: een **uitdeellijst** per klas (namen + vakje om af te vinken, zonder
  doelwitten).
- Tip voor de organisator: laat een leerling of collega de kaartjes snijden en
  uitdelen, of snij zelf zonder om te draaien; je eigen kaartje krijg je dan
  "blind" zoals iedereen.

**Alternatief zonder recto-verso** ("vouwkaartje"): speler en doelwit op dezelfde kant,
het doelwit binnen de vouw. Eenvoudiger, maar dan staat alles samen in het
afdrukvoorbeeld; de app waarschuwt hiervoor en toont het voorbeeld standaard niet.

### 5.3 Wat de QR-code bevat
- Inhoud: `{speler, doelwit, klas doelwit, naam spel, thema}`, versleuteld met AES-GCM
  (ingebouwd in de browser).
- Sleutel + versleutelde inhoud zitten in het deel van de link na `#`, dat browsers
  nooit naar de server sturen: ook de webhosting ziet geen namen.
- Bij het scannen: "Hallo Anna, tik om je doelwit te zien" → "Jouw doelwit is: Bert (5B)",
  met een knop "verberg opnieuw".
- De korte controlecode op het kaartje (bv. `K7F-2QX`) verschijnt ook op het scherm,
  zodat de leerling weet dat hij zijn eigen kaartje scande.

### 5.4 Verdelen via e-mail (vrienden)
Enkel voor deelnemers met een e-mailadres; deelnemers zonder adres krijgen automatisch
een kaartje. "Druk kaartjes af voor iedereen zonder e-mail" is één knop.

Twee manieren:

| Manier | Hoe | Volledig blind? | Server nodig? |
|---|---|---|---|
| **Automatisch versturen** (aanbevolen) | De website verstuurt zelf een e-mail naar elke deelnemer met zijn doelwit. De organisator ziet de inhoud nooit. | **Ja** | Ja, een klein serverfunctietje |
| **Via je eigen mailprogramma** | Per deelnemer een knop die een e-mail voorbereidt in je eigen mailprogramma. De e-mail bevat **enkel een geheime link** (zoals bij de QR-code), nooit de naam van het doelwit, anders zie je het in je verzonden items. | Bijna: je mag de link zelf niet aanklikken | Nee |

Automatisch versturen gebeurt via **Brevo** (e-maildienst) en een **Cloudflare Worker**
(klein serverfunctietje). De namen en adressen worden enkel gebruikt om te versturen en
niet bewaard. Dit is de enige stap die niet volledig in de browser kan.

#### Waarom Brevo + Cloudflare
- **Brevo** (gratis: 300 mails/dag): je hoeft geen eigen domeinnaam te hebben; je
  bevestigt gewoon je eigen e-mailadres als afzender. (Resend vraagt een eigen
  domeinnaam om naar anderen te mailen.)
- **Cloudflare Worker** (gratis: 100 000 verzoeken/dag): bewaart de geheime Brevo-sleutel
  veilig, buiten de website. De sleutel mag **nooit** in de websitecode of in GitHub
  staan, anders kan iedereen er mails mee versturen.

#### Hoe het werkt
```
Website (browser)  --(lijst: naam, e-mail, doelwit + wachtwoord)-->  Cloudflare Worker
Cloudflare Worker  --(geheime API-sleutel)-->  Brevo  -->  e-mail naar elke deelnemer
```
- De website stuurt de lijst rechtstreeks naar de Worker; de organisator ziet de inhoud
  niet. De Worker antwoordt enkel "12 van 12 verstuurd" of "fout bij anna@…".
- Beveiliging tegen misbruik: de Worker vraagt een **organisatorwachtwoord** (enkel jij
  kent het), weigert meer dan 50 ontvangers per keer en verstuurt enkel het vaste
  e-mailsjabloon (geen vrije tekst).

#### Wat de organisator eenmalig doet (± 15 minuten)
1. **Brevo**: gratis account op brevo.com → *Senders, Domains & Dedicated IPs* → je
   eigen e-mailadres toevoegen als afzender en bevestigen via de mail die je krijgt →
   *SMTP & API* → *API Keys* → nieuwe sleutel maken (niet delen, niet in chat plakken).
2. **Cloudflare**: gratis account op cloudflare.com (geen domeinnaam nodig).
3. Worker publiceren (kant-en-klaar in `api/`, met een stap-voor-stap uitleg in
   `api/README.md`):
   ```
   npx wrangler login
   npx wrangler secret put BREVO_API_KEY       # sleutel uit stap 1
   npx wrangler secret put SENDER_EMAIL        # je bevestigde afzenderadres
   npx wrangler secret put ORGANIZER_PASSWORD  # zelf gekozen wachtwoord
   npx wrangler deploy
   ```
4. Het adres van de Worker (bv. `https://gotcha-mail.<naam>.workers.dev`) eenmalig
   invullen in de instellingen van de website.

Tip: stuur eerst een **testmail** naar jezelf (knop in de app, met een nep-doelwit) om
te controleren dat de mail niet in spam belandt. Laat vrienden ook even in hun
spammap kijken bij de eerste keer.

E-mailtekst per thema, bv. Gotcha:
> **Onderwerp:** Jouw doelwit voor Gotcha 2026 🔪
> Hallo Anna, jouw doelwit is **Bert Peeters**. Vertel het aan niemand! Spelregels: …

---

## 6. Het Gotcha-spel spelen (blind)

Omdat de organisator meespeelt, houdt de app **geen centrale lijst** bij van wie nog
leeft of wie wie heeft. Het spel loopt via de kaartjes, de klassieke manier:

1. Iedereen krijgt zijn kaartje (of e-mail).
2. Schakelt A zijn doelwit B uit, dan **geeft B zijn kaartje aan A** (bij e-mail: B
   stuurt zijn e-mail door of toont ze). Het doelwit van B is nu het nieuwe doelwit
   van A.
3. De laatste die overblijft wint; het aantal verzamelde kaartjes = aantal "kills".

Spelregels (aanpasbaar) worden op de voorkant van de kaartjes en in de e-mail gezet.

Later (optioneel):
- **Levenscode**: elk kaartje bevat een geheime code van 4 letters voor de eigenaar.
  De uitschakelaar moet die code krijgen; voorkomt valse kills.
- **Verloren kaartje**: een collega met het wachtwoord van de verzegelde back-up drukt
  dat ene kaartje opnieuw af, zonder dat de organisator meekijkt.

---

## 7. Technologie

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Bouwtool | **Vite** | Snel, eenvoudig, statische website |
| Interface | **React + TypeScript** | Veelgebruikt; types vangen fouten in de ketting op |
| Opmaak | **Tailwind CSS** | Snel, werkt op gsm/laptop, afdrukstijlen |
| Excel | **SheetJS (`xlsx`)** | Excel/CSV lezen en schrijven in de browser |
| QR-codes | **`qrcode`** (npm) | QR-codes als SVG, scherp bij afdrukken |
| Willekeur / versleuteling | **Web Crypto API** | Ingebouwd in de browser |
| Opslag | `localStorage` | Deelnemerslijst onthouden (ketting enkel versleuteld) |
| Taal | Nederlands | Teksten in één bestand (`nl.ts`), later uitbreidbaar |
| Tests | **Vitest** + Playwright | Algoritme, import, kaartjes |
| Hosting | **GitHub Pages** via GitHub Actions | Gratis, publiceert automatisch |
| E-mail (fase 3) | **Cloudflare Worker** + **Brevo** | Gratis, geen domeinnaam nodig, sleutel blijft geheim |

---

## 8. Projectstructuur

```
gotcha/
├── index.html
├── package.json
├── vite.config.ts
├── public/
│   └── gotcha-sjabloon.xlsx
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # stappen + onthulpagina
│   ├── lib/
│   │   ├── chain.ts               # schudden + één lus (+ uitsluitingen)
│   │   ├── random.ts              # eerlijke willekeur + Fisher-Yates
│   │   ├── importFile.ts          # Excel/CSV inlezen + kolommen herkennen
│   │   ├── exportFile.ts          # Excel-export (enkel niet-blinde modus)
│   │   ├── token.ts               # versleutelde QR-/e-mailinhoud
│   │   ├── sealedBackup.ts        # back-up met wachtwoord
│   │   ├── cardLayout.ts          # recto-verso posities (gespiegeld)
│   │   └── storage.ts             # opslag in de browser
│   ├── components/
│   │   ├── ParticipantList.tsx    # toevoegen / wijzigen / verwijderen
│   │   ├── ImportDialog.tsx       # bestand + voorbeeldtabel
│   │   ├── GameSettings.tsx       # thema, naam spel, "ik speel mee", spelregels
│   │   ├── DistributeView.tsx     # kaartjes / e-mail per deelnemer
│   │   ├── PrintCards.tsx         # A4-vellen, namen of QR
│   │   └── RevealPage.tsx         # wat de deelnemer ziet na scannen / klikken
│   ├── i18n/nl.ts
│   └── styles.css
├── api/
│   ├── worker.ts                  # fase 3: Cloudflare Worker → Brevo
│   ├── wrangler.toml
│   └── README.md                  # stap-voor-stap installatie
├── tests/
│   ├── chain.test.ts
│   ├── importFile.test.ts
│   ├── token.test.ts
│   ├── cardLayout.test.ts
│   └── sealedBackup.test.ts
└── .github/workflows/deploy.yml
```

---

## 9. Schermen

1. **Start**: kies het thema: 🔪 Gotcha · 🎅 Secret Santa · 💘 Secret Valentine
   (verandert enkel woorden en kleuren). Naam van het spel, optioneel datum/budget,
   spelregels. Vinkje **"Ik speel zelf mee"** (standaard aan) → blinde modus.
2. **Deelnemers**: tabel met naam, klas (optioneel), e-mail (optioneel); knoppen
   "+ toevoegen", "Importeer Excel/CSV", "Plak lijst". Teller + waarschuwingen (minder
   dan 3, dubbele namen, ongeldige e-mails). De organisator voegt zichzelf ook toe.
3. **Regels** (later): uitsluitingen, "niet iemand uit dezelfde klas".
4. **Trekking**: grote knop "Maak de ketting". Bevestiging: "Je zult het resultaat
   niet kunnen zien. Doorgaan?" → "Ketting gemaakt voor 100 spelers ✔".
5. **Verdelen**
   - *Kaartjes afdrukken*: keuze **Namen** of **QR-code**, keuze recto-verso of
     vouwkaartje, testpagina, uitdeellijst.
   - *E-mail*: "Verstuur naar alle 12 deelnemers met e-mail" (automatisch) of per
     persoon via je eigen mailprogramma.
   - *Verzegelde back-up* downloaden.
   - "Opnieuw trekken" met waarschuwing dat alle vorige kaartjes/e-mails ongeldig worden.
6. **Onthulpagina** (na QR-scan of klik in e-mail): "Hallo Anna, tik om je doelwit te
   zien" → "Jouw doelwit is: Bert (5B)" + spelregels.

---

## 10. Stappenplan

### Fase 1: Klaar voor de klas ✅
- [x] Project opzetten: Vite + React + TypeScript + Tailwind, Vitest.
- [x] `random.ts` + `chain.ts` met volledige tests (één lus, niemand zichzelf,
      eerlijke verdeling).
- [x] Deelnemerslijst (naam, klas, e-mail optioneel), bewaard in de browser.
- [x] Plakken uit Excel (met herkenning van kolomtitels), naar voren gehaald uit fase 2.
- [x] Thema + "Ik speel zelf mee" (blinde modus); trekking versleuteld bewaard.
- [x] Afdrukbare kaartjes **met namen**, recto-verso lay-out + veiligheidspatroon,
      testpagina, uitdeellijst.
- [x] Online zetten via GitHub Pages (workflow klaar; Pages nog aanzetten in GitHub).

### Fase 2: Import & QR
- [ ] Excel/CSV-import met kolomherkenning + voorbeeldtabel; sjabloon.
- [ ] Kaartjes **met QR-code** + onthulpagina.
- [ ] Verzegelde back-up met wachtwoord.
- [ ] Niet-blinde modus met overzicht + Excel-export.

### Fase 3: E-mail voor vrienden
- [ ] Per deelnemer "mail voorbereiden" in eigen mailprogramma (met geheime link).
- [ ] Serverfunctie + e-maildienst voor automatisch versturen (volledig blind).
- [ ] E-mailsjabloon per thema.

### Fase 4: Extra's
- [ ] Uitsluitingen (+ "niet uit dezelfde klas") met duidelijke foutmelding.
- [ ] Levenscodes tegen valse kills.

---

## 11. Testen

- **Algoritme**: voor 2 tot 200 deelnemers, telkens vele trekkingen → altijd één lus,
  niemand zichzelf; bij kleine groepen komen alle mogelijke lussen ongeveer even vaak
  voor.
- **Blinde modus**: geen enkel scherm toont het doelwit van een andere deelnemer
  (automatisch gecontroleerd).
- **Kaartjes**: elke voorkant valt na recto-verso precies op de juiste achterkant;
  100 leerlingen → 7 vellen; QR-codes scanbaar (manueel testen met een gsm).
- **Import**: testbestanden (`.xlsx`, `.csv` met `;` en `,`, Nederlandse kolomtitels,
  zonder e-mailkolom, half ingevulde e-mails, lege rijen, aparte voor- en achternaam).
- **Versleuteling / back-up**: heen en terug werkt; foute link of fout wachtwoord geeft
  een vriendelijke foutmelding.
- **Volledige doorloop** met Playwright: lijst → trekking → kaartjes → onthulpagina.

---

## 12. Privacy & bijzondere gevallen

- Alles blijft in de browser, behalve bij automatisch e-mailen. Leerlingennamen komen
  nooit op een server. Belangrijk voor de GDPR op school.
- "Wis alle gegevens"-knop.
- Minder dan 3 deelnemers: waarschuwing.
- Opnieuw trekken maakt alle vorige kaartjes/e-mails ongeldig → duidelijke waarschuwing.
- Leerling afwezig bij het uitdelen: kaartje later geven, de ketting verandert niet.
  Leerling stopt met het spel: hij geeft zijn kaartje aan wie hem heeft (zoals bij
  uitgeschakeld worden).
- Namen met accenten of speciale tekens (é, ë, ç, …) worden overal correct getoond en
  afgedrukt; Excel-export in UTF-8.

---

## 13. Genomen beslissingen

- Website volledig in het **Nederlands**.
- E-mail is **optioneel per deelnemer**; de schoolversie werkt zonder één e-mailadres.
- De organisator **speelt mee** → blinde modus standaard, geen overzicht, recto-verso
  kaartjes zodat ook het afdrukvoorbeeld niets verraadt.
- Kaartjes: keuze tussen **namen** (standaard, geen gsm nodig) en **QR-code**.
- **Geen WhatsApp/gsm-nummers**: vrienden krijgen hun doelwit via **e-mail**.
- Gotcha volgens de klassieke regel "slachtoffer geeft zijn kaartje af", dus geen
  centrale opvolging nodig.
- De schoolprinter kan **recto-verso** → dat is de standaard lay-out voor kaartjes.
- Automatisch e-mailen via **Brevo + Cloudflare Worker** (zie §5.4).

## 14. Nog open

- Geen openstaande vragen; fase 1 kan starten.
