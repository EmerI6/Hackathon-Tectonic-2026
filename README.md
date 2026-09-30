# KBC Moments — Hackathon Tectonic 2026

Proof of concept for a **life moment detector**: the bank spots a *break* in a customer's account activity,
asks an LLM (Google Gemini) what life moment could explain it, and lets strict rules decide whether to propose
the single most relevant solution.

1. **Break detection** (`src/detection/breakDetection.ts`, pure TS, runs in the browser = on the phone): the last
   ≤2 months vs the 6 before — new spending categories, new income types, category variations, savings change,
   unusual amounts, income regularity, in-app usage. No list of moments.
2. **LLM interpretation** (`POST /api/interpret`): only an **anonymised summary** is sent (categories, generic
   merchant types, % and ratios — no names, no exact amounts). Gemini answers in JSON mode: free-text moment,
   confidence 0-100, justifying signals, customer need, KBC product category, `sensitive` flag. The factors from the
   team's idea doc are few-shot examples in the prompt (`src/detection/prompt.ts`).
3. **Rule guardrails** (`src/detection/guardrails.ts`, applied after the LLM): only one moment (highest score),
   action threshold 70, moments marked "not relevant" before are suppressed, sensitive moments (health, family,
   separation, financial difficulty) are blocked without explicit consent. The offer shown always comes from a
   bank-controlled catalogue (`src/detection/catalog.ts`), never from the LLM.
4. **Learning loop**: "Not relevant for me" is stored by the server (in memory + `.data/feedback.json`), shown in
   the demo panel, sent to the LLM as context and enforced by the feedback guardrail.

> Customers and transactions are mock data. "KBC Moments" is a text logo — the real KBC logo is intentionally not used.

## Run it

Requires Node.js 20+.

```bash
npm install
cp .env.example .env   # optional: add GEMINI_API_KEY for the live LLM
npm run dev            # http://localhost:5173 (front-end + /api)
```

### Gemini key & fallback

- `GEMINI_API_KEY` (and optional `GEMINI_MODEL`, default `gemini-2.5-flash`) are read by the Vite server plugin
  (`server/api.ts`) only. They are not `VITE_`-prefixed, so they never reach the browser bundle.
- Calls use `generateContent` with `responseMimeType: application/json` and a `responseSchema`
  (`server/gemini.ts`), 8 s timeout; output is validated before the guardrails run.
- No key, HTTP error, invalid JSON or timeout → the **pre-recorded Gemini answer** for that customer/month
  (`src/detection/fixtures.json`) is used. The demo panel shows which source was used and why. If the page is
  served without the API server at all, the browser uses the same fixtures.

Other scripts:

```bash
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (the /api plugin runs here too)
npm run lint       # oxlint
```

## The demo

1. Pick a customer, click **Simulate next month**. The phone receives the month's transactions; the ones that
   fed the break are tagged *New pattern* / *Unusual amount*.
2. The pipeline animates **Signals → Understanding → Decision → Channel**. The detection card shows the source
   (live Gemini or pre-recorded), the LLM's free-text moment, confidence vs the 70% threshold, justifying signals,
   need and product category, every guardrail with pass/fail, and (expandable) the exact anonymised summary sent.
3. **Julie, 34** has nothing predefined: in October (enterprise counter, accountant, first invoice) the moment is
   only *possible* → monitoring; in November (salary gone, several client invoices, social contributions, pro
   equipment, savings paused) → **Becoming self-employed** → professional account + VAPZ. The lower-scored
   "irregular income" candidate (sensitive) is dropped by the one-moment rule.
4. Open the moment on the phone and tap **Not relevant for me**: the feedback appears in **Learning loop**. Reset
   and simulate again: the feedback guardrail suppresses the moment.
5. Emma (new job), Lucas & Sarah (buying a home) and Marc (retirement) work the same way. Turning a moment type
   off in **Privacy** before simulating shows the consent guardrail; turning it back on releases the notification.

## Project structure

```
server/
  api.ts               Vite plugin: POST /api/interpret, GET/POST/DELETE /api/feedback
  gemini.ts            Gemini call in JSON mode + response schema
src/
  detection/           breakDetection, prompt (few-shot), guardrails, catalog, fixtures.json (pre-recorded answers)
  api/                 Client service layer (customers, consent, moments → /api)
  data/mockData.ts     Mock customers with a 6-month baseline + upcoming months (no predefined moments)
  hooks/useDemo.ts     Demo state & pipeline orchestration
  components/          phone/ (customer app) and demo/ (jury panel)
  types.ts             Shared domain types
```
