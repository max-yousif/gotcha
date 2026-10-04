# Gotcha / Secret Santa / Secret Valentine — Project Plan

A small website where an organizer enters (or imports) a list of participants and the
app builds **one closed chain**: A → B → C → … → Z → A. Every participant gets exactly
one target (Gotcha: the person to "kill"; Secret Santa/Valentine: the person to gift),
and every participant is the target of exactly one other person.

---

## 1. Goals and non-goals

### Goals (MVP)
1. Add participants by hand (name + optional email), or by **importing an Excel/CSV file**.
2. Generate **one single loop** that contains everyone (no small sub-circles), with
   nobody drawing themselves.
3. Show / export the result in ways that keep the surprise:
   - printable cards (one per person, fold/cut),
   - one secret link per participant,
   - export to Excel for the organizer.
4. Work entirely in the browser: no account, no server, no data leaving the device.

### Later (see phase 3–4)
- Exclusion rules ("Anna may not get her partner Bert").
- Sending assignments by email automatically.
- Gotcha game tracking: register kills, the killer inherits the victim's target, live
  leaderboard.
- Dutch + English interface.

### Non-goals
- User accounts, payments, social features.

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
uniform shuffle hits each one n times.

### 3.2 With exclusions (phase 3)
Exclusions are pairs that may not be adjacent in the chain (e.g. partners, siblings,
"last year's pair"). Finding a cycle that avoids them is a Hamiltonian-cycle search:
1. Try up to ~1 000 random shuffles and accept the first valid one (fast for typical
   groups where only a few pairs are excluded).
2. If that fails, run a randomized backtracking search (start from a random person,
   try candidates in random order, prune dead ends) with a time limit.
3. If still nothing: tell the organizer which rules make it impossible
   ("Anna is excluded from everyone except Bert"), instead of hanging.

Option: one-directional vs. two-directional exclusions (Anna→Bert forbidden, but
Bert→Anna allowed).

### 3.3 Duplicate names
Each participant gets an internal ID; duplicate display names trigger a warning and the
suggestion to add an initial ("Tom V.", "Tom D.").

---

## 4. Excel / CSV import

Library: **SheetJS (`xlsx`)** — reads `.xlsx`, `.xls`, `.ods` and `.csv` in the browser.

Flow:
1. User drops a file (drag & drop or file picker).
2. Read the first sheet (with a sheet chooser if there are several).
3. **Auto-detect columns** by header name, case-insensitive, NL + EN:
   - name: `naam`, `name`, `voornaam` + `achternaam`, `first name` + `last name`
   - email: `email`, `e-mail`, `mail`, `emailadres`
   - optional: `groep`/`group`, `klas`/`class` (useful for exclusions later)
4. Show a **preview table** with column-mapping dropdowns so the user can fix the
   detection, and a "first row is a header" toggle.
5. Validate: trim whitespace, skip empty rows, flag invalid emails and duplicates.
6. Merge into or replace the current list.

Also offer:
- a downloadable **template file** (`gotcha-template.xlsx`) with the right headers,
- **paste from clipboard**: paste a column from Excel/Google Sheets into a textarea, one
  name per line (tab-separated second column = email).

---

## 5. Delivering the assignments (keeping it secret)

The organizer usually also plays, so the app offers ways to distribute without
everyone (or the organizer) seeing the full list:

| Method | How it works | Needs server? |
|---|---|---|
| **Printable cards** | One A4 page with cut-out cards: *"Name: Anna — your target is: ▒▒▒"*, target printed on the inside of a fold. | No |
| **Secret links** | Each person gets a unique link like `…/#/reveal/<token>`. The token contains their own assignment (encoded/encrypted) in the URL *fragment*, which is never sent to any server. Organizer copies the links into WhatsApp/email; opening it shows a "tap to reveal" screen. | No |
| **Mailto links** | One button per person that opens the organizer's own mail program with a prefilled email. | No |
| **Automatic email** | App sends every participant an email with their target. | Yes (phase 4) |
| **Organizer overview** | Full chain, hidden behind a "show anyway" confirmation; export to Excel. | No |

The secret-link token: JSON `{giver, target, game, eventName}` → encrypted with
AES-GCM (Web Crypto) using a random key that is also in the link. This isn't
unbreakable security (the link *is* the key), but it means the content isn't readable
by glancing at the URL, and each person only receives their own link.

---

## 6. Gotcha game tracking (phase 3)

Gotcha-specific mode, stored in the browser (localStorage) plus JSON export/import as a
backup:
- Organizer marks "X has been eliminated by Y" (or: the victim enters a secret
  code that every player got together with their assignment — prevents fake kills).
- The killer automatically inherits the victim's target; the app shows the new
  assignment (and can generate a fresh secret link for it).
- Dashboard: players alive, kill count per player, timeline of eliminations, winner.
- Undo for the last action.

---

## 7. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fast, simple, static output |
| UI | **React + TypeScript** | Common, well supported; types catch chain bugs |
| Styling | **Tailwind CSS** | Quick, responsive, print styles via `print:` |
| Excel | **SheetJS (`xlsx`)** | Read + write xlsx/csv client-side |
| Randomness / crypto | **Web Crypto API** | `getRandomValues`, AES-GCM — built in, no deps |
| Storage | `localStorage` | Remember the list and the game between visits |
| i18n | Small dictionary file (NL/EN) | No heavy library needed |
| Tests | **Vitest** (+ Testing Library) | Algorithm + import parsing |
| Hosting | **GitHub Pages** via GitHub Actions | Free, static, deploys on push to `main` |
| Phase 4 backend | Cloudflare Worker or Netlify Function + **Resend** (email API) | Only needed for automatic emails |

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
│   │   ├── exportFile.ts          # xlsx export of the chain
│   │   ├── secretLink.ts          # encode/decode reveal tokens (AES-GCM)
│   │   ├── game.ts                # Gotcha kill tracking state machine
│   │   └── storage.ts             # localStorage persistence
│   ├── components/
│   │   ├── ParticipantList.tsx    # add / edit / remove rows
│   │   ├── ImportDialog.tsx       # file drop + mapping preview
│   │   ├── GameSettings.tsx       # mode (Gotcha / Santa / Valentine), event name, exclusions
│   │   ├── ResultView.tsx         # tabs: cards / links / mail / overview
│   │   ├── PrintCards.tsx
│   │   ├── RevealPage.tsx         # what a participant sees when opening their link
│   │   └── GameDashboard.tsx      # Gotcha tracking
│   ├── i18n/{nl.ts,en.ts}
│   └── styles.css
├── tests/
│   ├── chain.test.ts
│   ├── importFile.test.ts
│   └── secretLink.test.ts
└── .github/workflows/deploy.yml
```

---

## 9. User flow (screens)

1. **Start** — choose the theme: 🔪 Gotcha · 🎅 Secret Santa · 💘 Secret Valentine
   (changes wording + colors only: "target" vs. "gift for"). Optional event name,
   budget, date.
2. **Participants** — table with name/email, "+ add", "import Excel/CSV", "paste list".
   Counter + warnings (fewer than 3, duplicates, invalid emails).
3. **Rules** (optional, phase 3) — exclusion pairs.
4. **Draw** — big button "Create chain"; a short animation; result is not shown on
   screen by default.
5. **Distribute** — tabs: Print cards · Secret links · Email · Organizer overview ·
   Export Excel. "Draw again" (with confirmation).
6. **Reveal page** (participant) — "Hi Anna, tap to reveal" → "Your target is: Bert".
7. **Game dashboard** (Gotcha, phase 3).

---

## 10. Phased roadmap

### Phase 1 — MVP (core)
- [ ] Vite + React + TS + Tailwind scaffold, lint/format, Vitest.
- [ ] `random.ts` + `chain.ts` with full unit tests (single cycle, no self-targets,
      distribution sanity test over many runs).
- [ ] Participant list: add/edit/delete, persist to localStorage.
- [ ] Theme choice (Gotcha / Santa / Valentine).
- [ ] Generate chain; organizer overview (hidden by default); export to Excel.
- [ ] Printable cards.
- [ ] Deploy to GitHub Pages.

### Phase 2 — Import & distribution
- [ ] Excel/CSV import with column detection + mapping preview; template download.
- [ ] Paste-from-clipboard import.
- [ ] Secret reveal links (AES-GCM token in URL fragment) + "copy all links".
- [ ] Mailto buttons per participant.
- [ ] Dutch/English language switch.

### Phase 3 — Rules & Gotcha game
- [ ] Exclusion pairs (+ import from a "group" column: same group never adjacent).
- [ ] Constrained cycle search with clear "impossible" feedback.
- [ ] Gotcha dashboard: kills, inheritance of targets, leaderboard, undo, JSON backup.
- [ ] Optional kill verification codes.

### Phase 4 — Automatic email (optional backend)
- [ ] Serverless function (Cloudflare Worker / Netlify) with Resend API key as secret.
- [ ] Email template per theme; rate limit + simple organizer confirmation.
- [ ] Privacy note: emails are only processed to send the message, nothing is stored.

---

## 11. Testing strategy

- **Algorithm**: for n = 2..200, many random runs → assert single cycle, bijection, no
  self-assignment; for small n, check that all (n−1)! cycles occur with roughly equal
  frequency (chi-square-ish sanity check).
- **Exclusions**: solvable cases always produce valid chains; impossible cases
  return a clear error within the time limit.
- **Import**: fixture files (`.xlsx`, `.csv` with `;` and `,`, Dutch headers, empty
  rows, merged first/last name columns).
- **Secret links**: encode → decode round-trip; tampered link shows a friendly error.
- **Manual/E2E**: print preview, mobile reveal page, Playwright smoke test of the full
  flow.

---

## 12. Privacy & edge cases

- All data stays in the browser unless the organizer uses automatic email (phase 4).
- "Clear all data" button.
- Fewer than 3 participants: warn (2 people just get each other).
- Re-draw invalidates old secret links → show a warning before re-drawing.
- Very large groups (500+): algorithm is O(n); UI table should virtualize or paginate.
- Names with special characters / emoji: handled as Unicode throughout; CSV export
  with UTF-8 BOM so Excel shows accents correctly.

---

## 13. Open questions for the organizer

1. Should the organizer be able to play without seeing the list (i.e. is the secret
   link/email route the main one, or are printed cards enough)?
2. Is automatic email (phase 4, needs a small backend + email provider) needed, or are
   mailto/WhatsApp links good enough?
3. Interface language: Dutch, English, or both?
4. For Gotcha: should the app track the game, or only do the initial draw?
