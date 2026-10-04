# Gotcha / Secret Santa / Secret Valentine — Project Plan

A small website where an organizer enters (or imports) a list of participants and the
app builds **one closed chain**: A → B → C → … → Z → A. Every participant gets exactly
one target (Gotcha: the person to "kill"; Secret Santa/Valentine: the person to gift),
and every participant is the target of exactly one other person.

Two use cases drive the design:

| | School (≈100 students) | Friends (5–30 people) |
|---|---|---|
| Emails | **Not available** | Optional, per person |
| Distribution | Printed cards with QR code, handed out in class | Secret links via WhatsApp / email, or printed cards |
| Organizer plays too | Yes | Yes |

---

## 1. Goals and non-goals

### Goals (MVP)
1. Add participants by hand (name, **email optional**), or by **importing an
   Excel/CSV file**. A list may mix people with and without email.
2. Generate **one single loop** that contains everyone (no small sub-circles), with
   nobody drawing themselves.
3. **Organizer-blind by default**: the organizer plays too, so the app never shows the
   organizer who has whom — not even who has the organizer.
4. Distribute without email: printable cards (with QR code) for big groups like a class.
5. Work entirely in the browser: no account, no server, no data leaving the device.

### Later (see phase 3–4)
- Exclusion rules ("Anna may not get her partner Bert").
- Sending assignments by email automatically (the only way to email that is *fully*
  blind for the organizer — see §5).
- Dutch + English interface.

### Non-goals
- User accounts, payments, social features.
- Central game tracking for Gotcha (the game runs on the cards themselves, see §6).

---

## 2. Why "one long chain" matters

A naive Secret Santa draw (random permutation without fixed points, a "derangement")
can split into several small circles, e.g. A→B→A and C→D→E→C. For gifting that's fine,
but for **Gotcha it breaks the game**: when only one small circle is left, the winner
can't continue into the rest of the group. A single cycle guarantees that:
- whenever you eliminate your target, you inherit **their** target, and
- the chain shrinks one by one until a single winner remains.

So the app always builds one Hamiltonian cycle, which is also perfectly valid for
Secret Santa/Valentine.

---

## 3. The algorithm

### 3.1 Basic chain (no restrictions)
```
1. participants = [p1, p2, ..., pn]           (n >= 3; n = 2 is allowed but trivial)
2. shuffle participants with Fisher–Yates using crypto.getRandomValues
   (not Math.random, so the draw is unbiased and unpredictable)
3. for i in 0..n-1:
       target[shuffled[i]] = shuffled[(i + 1) % n]
```
Properties (enforced by unit tests):
- every person appears exactly once as giver and once as target,
- nobody targets themselves,
- following targets from any person visits everyone and returns to the start.

Every possible circle is equally likely: there are (n−1)! distinct cycles and a
uniform shuffle hits each one n times. For 100 students this runs instantly.

### 3.2 With exclusions (phase 3)
Exclusions are pairs that may not be adjacent in the chain (e.g. partners, siblings,
"last year's pair"). Finding a cycle that avoids them is a Hamiltonian-cycle search:
1. Try up to ~1 000 random shuffles and accept the first valid one (fast for typical
   groups where only a few pairs are excluded).
2. If that fails, run a randomized backtracking search (start from a random person,
   try candidates in random order, prune dead ends) with a time limit.
3. If still nothing: tell the organizer which rules make it impossible
   ("Anna is excluded from everyone except Bert"), instead of hanging.

Because the organizer must stay blind, the error message names the *rule* that is
the problem, never a resulting assignment.

### 3.3 Duplicate names
Each participant gets an internal ID; duplicate display names trigger a warning and the
suggestion to add an initial or class ("Tom V.", "Tom (5B)"). Important at school
with 100 students.

---

## 4. Excel / CSV import

Library: **SheetJS (`xlsx`)** — reads `.xlsx`, `.xls`, `.ods` and `.csv` in the browser.

Flow:
1. User drops a file (drag & drop or file picker).
2. Read the first sheet (with a sheet chooser if there are several).
3. **Auto-detect columns** by header name, case-insensitive, NL + EN:
   - name (required): `naam`, `name`, `voornaam` + `achternaam`, `first name` + `last name`
   - email (**optional**): `email`, `e-mail`, `mail`, `emailadres`
   - class/group (optional): `klas`/`class`, `groep`/`group` — printed on cards so a
     student can find their target, and usable for exclusions later
4. Show a **preview table** with column-mapping dropdowns ("Email: — none —" is a valid
   choice) and a "first row is a header" toggle.
5. Validate: trim whitespace, skip empty rows, flag invalid emails (as a warning, never
   blocking) and duplicate names.
6. Merge into or replace the current list.

A typical school export (e.g. from Smartschool/Excel class lists: name + class, no email)
must import without any manual editing.

Also offer:
- a downloadable **template file** (`gotcha-template.xlsx`) with headers
  `Naam | Klas | Email (optioneel)`,
- **paste from clipboard**: paste a column from Excel/Google Sheets into a textarea, one
  name per line (optional tab-separated email).

---

## 5. Keeping the organizer blind & delivering assignments

### 5.1 Blind mode (default, always on when "I'm playing too" is checked)
- The full chain is **never shown** on screen and there is **no organizer overview**.
- After the draw the app only shows *how* to distribute ("100 cards ready to print"),
  never *what* is on them.
- The chain is **not stored in plaintext**. The app stores only the per-person
  encrypted tokens (see §5.3), so peeking in localStorage/devtools doesn't casually
  reveal it.
- The organizer receives their own assignment exactly like everyone else (their own
  card / link) — they have no other way to see it.
- **Sealed backup** (optional): download the chain as a password-protected file
  (AES-GCM, key derived from a password with PBKDF2). The organizer lets a colleague or
  friend choose the password, so the organizer can't open it themselves. Used only if
  something goes wrong (a lost card, a dispute).
- A non-blind "organizer only, I'm not playing" mode can still show the full list and
  export it to Excel.

Honest limitation: in a purely client-side app, a determined organizer *could* scan
other people's QR codes or open their links. Blind mode guarantees the organizer never
sees anything **by accident** and has to make a deliberate effort to cheat. Only
automatic email via a server (phase 4) is fully blind.

### 5.2 Distribution methods

| Method | Best for | How it works | Needs email? | Server? |
|---|---|---|---|---|
| **Printable QR cards** | School (100 students) | One card per person: *outside* = the player's name (+ class), *inside* = a QR code + short code. No target name is printed in readable text, so the organizer can cut, fold and hand out 100 cards without learning anything. Student scans the QR → reveal page shows their target. | No | No |
| **Printable folded cards** | Groups without phones | Same, but the target name is printed inside the fold. Organizer must not unfold — weaker, but works without phones. | No | No |
| **Secret links** | Friends via WhatsApp | One unique link per person. Organizer copies "Link for Anna" and sends it; the link itself doesn't show the target. | No | No |
| **Mailto per person** | Friends with email | Opens the organizer's own mail program with a prefilled email containing **only the secret link**, never the target name (otherwise the organizer would see it in their outbox). | Yes | No |
| **Automatic email** | Friends with email, fully blind | The app sends each participant their target directly; the organizer never sees content. | Yes | Yes (phase 4) |

Mixed lists are fine: per participant the app offers email if an address is known,
and a link/card otherwise. "Print cards for everyone without email" is one button.

### 5.3 Secret token (used by QR codes and links)
- Content: `{giver, target, targetClass, eventName, theme}`.
- Encrypted with AES-GCM (Web Crypto) using a random per-person key; key + ciphertext
  go into the URL **fragment** (`…/#/r/<token>`), which browsers never send to the
  server — so the hosting (GitHub Pages) never sees any names either.
- The QR code is the only way to open a card in the serverless version (a short typed
  code can't hold an encrypted name without a server). The card also prints a short
  check code (e.g. `K7F-2QX`) that the reveal page displays, so a student can confirm
  they scanned their own card.
- Reveal page: "Hi Anna — tap to reveal your target", so nobody looking over a
  shoulder sees it immediately; a "hide again" button.

---

## 6. Running the Gotcha game (blind)

Because the organizer plays too, the app does **not** keep a central list of who is
alive and who targets whom. The game runs on the cards, the classic way:

1. Everyone gets their card (or link).
2. When A eliminates B, **B hands their card over to A** (or forwards their link).
   B's card shows B's target, which is now A's new target. A keeps playing.
3. Last person standing wins; the number of collected cards = number of kills.

This needs no tracking at all and keeps the organizer blind. Each card shows only one
target; the chain continues naturally because the victim's card is passed on.

Optional extras (phase 3):
- **Kill confirmation code**: each card has a secret 4-letter "life code" for its owner.
  The killer must collect the victim's life code; a simple page lets players check
  "is this code valid for this victim?" without revealing anything else. Prevents
  fake kills and lost-card disputes.
- **Public scoreboard** (opt-in): players themselves register kills with the life code;
  the board only shows names of eliminated players and kill counts, never the chain.
  Needs shared storage → part of the phase 4 backend.
- **Lost card**: reprint that single card from the sealed backup (requires the
  colleague with the password, who can do it without showing the organizer).

---

## 7. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fast, simple, static output |
| UI | **React + TypeScript** | Common, well supported; types catch chain bugs |
| Styling | **Tailwind CSS** | Quick, responsive, print styles via `print:` |
| Excel | **SheetJS (`xlsx`)** | Read + write xlsx/csv client-side |
| QR codes | **`qrcode`** (npm) | Generate QR codes as SVG for print |
| Randomness / crypto | **Web Crypto API** | `getRandomValues`, AES-GCM, PBKDF2 — built in |
| Storage | `localStorage` | Remember the participant list (not the chain in plaintext) |
| i18n | Small dictionary file (NL/EN) | No heavy library needed |
| Tests | **Vitest** (+ Testing Library), Playwright smoke test | Algorithm, import, tokens |
| Hosting | **GitHub Pages** via GitHub Actions | Free, static, deploys on push to `main` |
| Phase 4 backend | Cloudflare Worker / Netlify Function + **Resend** (email API) | Only for automatic email & scoreboard |

---

## 8. Project structure

```
gotcha/
├── index.html
├── package.json
├── vite.config.ts
├── public/
│   └── gotcha-template.xlsx
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # routing between steps / reveal page
│   ├── lib/
│   │   ├── chain.ts               # shuffle + single-cycle generation (+ exclusions)
│   │   ├── random.ts              # crypto-based random int + Fisher–Yates
│   │   ├── importFile.ts          # SheetJS parsing + column detection
│   │   ├── exportFile.ts          # xlsx export (non-blind mode only)
│   │   ├── token.ts               # encrypt/decrypt per-person reveal tokens
│   │   ├── sealedBackup.ts        # password-protected chain backup
│   │   └── storage.ts             # localStorage persistence
│   ├── components/
│   │   ├── ParticipantList.tsx    # add / edit / remove rows (email optional)
│   │   ├── ImportDialog.tsx       # file drop + mapping preview
│   │   ├── GameSettings.tsx       # theme, event name, "I'm playing too", exclusions
│   │   ├── DistributeView.tsx     # cards / links / mailto per participant
│   │   ├── PrintCards.tsx         # A4 sheets of QR cards, cut & fold lines
│   │   └── RevealPage.tsx         # what a participant sees when scanning/opening
│   ├── i18n/{nl.ts,en.ts}
│   └── styles.css
├── tests/
│   ├── chain.test.ts
│   ├── importFile.test.ts
│   ├── token.test.ts
│   └── sealedBackup.test.ts
└── .github/workflows/deploy.yml
```

---

## 9. User flow (screens)

1. **Start** — choose the theme: 🔪 Gotcha · 🎅 Secret Santa · 💘 Secret Valentine
   (changes wording + colors only). Event name, optional date/budget.
   Checkbox **"I'm playing too"** (on by default) → blind mode.
2. **Participants** — table with name, class (optional), email (optional);
   "+ add", "import Excel/CSV", "paste list". Counter + warnings (fewer than 3,
   duplicate names, invalid emails). If the organizer plays, they add themselves too.
3. **Rules** (optional, phase 3) — exclusion pairs, "same class never adjacent".
4. **Draw** — big button "Create chain". Confirmation: "You won't be able to see the
   result. Continue?" Then: "Chain created for 100 players ✔".
5. **Distribute** — per participant one row with the available methods (Print card ·
   Copy link · Email if address known). Bulk actions: "Print all cards",
   "Copy all links", "Download sealed backup". "Draw again" with warning that all
   previous cards/links become invalid.
6. **Reveal page** (participant, after scanning QR / opening link) —
   "Hi Anna, tap to reveal" → "Your target is: Bert (5B)" + game rules for the theme.

### Print layout for the school case
- A4, 8 cards per page (2 × 4) → 13 pages for 100 students.
- Each card: fold line; front = player name + class + event name; inside = QR code +
  short check code + "scan to see your target".
- Sorted by class, then name, so handing out per class is easy.
- Optional: hand-out checklist page (names + checkbox, no targets).

---

## 10. Phased roadmap

### Phase 1 — MVP: school-ready
- [ ] Vite + React + TS + Tailwind scaffold, lint/format, Vitest.
- [ ] `random.ts` + `chain.ts` with full unit tests (single cycle, no self-targets,
      distribution sanity test over many runs).
- [ ] Participant list (name, class, optional email), persisted to localStorage.
- [ ] Theme choice + "I'm playing too" (blind mode).
- [ ] Encrypted per-person tokens + reveal page.
- [ ] Printable QR cards (8 per A4, sorted by class).
- [ ] Deploy to GitHub Pages.

### Phase 2 — Import & friends
- [ ] Excel/CSV import with column detection + mapping preview; template download.
- [ ] Paste-from-clipboard import.
- [ ] Secret links: copy per person / copy all (for WhatsApp).
- [ ] Mailto per person (link only, never the target name).
- [ ] Sealed password-protected backup.
- [ ] Non-blind organizer mode with overview + Excel export.
- [ ] Dutch/English language switch.

### Phase 3 — Rules & game extras
- [ ] Exclusion pairs (+ "same class/group never adjacent").
- [ ] Constrained cycle search with clear "impossible" feedback.
- [ ] Life codes on cards + code check page (anti-cheat for Gotcha).

### Phase 4 — Optional backend
- [ ] Serverless function (Cloudflare Worker / Netlify) with Resend API key as secret.
- [ ] Automatic email delivery: fully blind for the organizer; per-theme template.
- [ ] Opt-in public scoreboard (kills registered with life codes).
- [ ] Privacy note: names/emails only processed to send the message, deleted after.

---

## 11. Testing strategy

- **Algorithm**: for n = 2..200, many random runs → assert single cycle, bijection, no
  self-assignment; for small n, check that all (n−1)! cycles occur with roughly equal
  frequency (chi-square-ish sanity check).
- **Blind mode**: test that no rendered screen in blind mode contains another
  participant's target name (render the distribute view, assert on DOM text).
- **Exclusions**: solvable cases always produce valid chains; impossible cases
  return a clear error within the time limit.
- **Import**: fixture files (`.xlsx`, `.csv` with `;` and `,`, Dutch headers, no email
  column, partially filled email column, empty rows, separate first/last name columns).
- **Tokens / backup**: encrypt → decrypt round-trip; tampered link or wrong password
  shows a friendly error.
- **Print**: 100 participants → 13 pages, QR codes scannable (manual check with a phone).
- **E2E**: Playwright smoke test of the full flow, including opening a reveal link.

---

## 12. Privacy & edge cases

- All data stays in the browser unless automatic email (phase 4) is used. Student names
  never reach a server — relevant for GDPR at school.
- Reveal links/QR codes contain the data encrypted in the URL fragment, which is not sent
  to the web server.
- "Clear all data" button.
- Fewer than 3 participants: warn (2 people just get each other).
- Re-draw invalidates all earlier cards/links → explicit warning.
- Absent student on hand-out day: their card is simply handed out later; the chain is
  unaffected. A student who leaves the game: they hand their card to whoever has them
  (same as being eliminated).
- Names with special characters / emoji: Unicode throughout; CSV export with UTF-8 BOM
  so Excel shows accents correctly.

---

## 13. Decisions made

- Email is **optional per participant**; the school case works with zero emails.
- The organizer **plays too** and must not know who has them → blind mode is the
  default, no overview, chain not stored in plaintext.
- Gotcha is played with the classic "victim hands over their card" rule, so no central
  tracking is needed.

## 14. Remaining open questions

1. Do students have phones in class to scan QR codes, or should the default card print
   the target name inside a fold?
2. Interface language: Dutch only, or Dutch + English?
3. Is automatic email (phase 4, small backend) worth it for the friends case, or are
   WhatsApp links good enough?
