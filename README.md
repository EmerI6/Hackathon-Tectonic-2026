# KBC Moments — Hackathon Tectonic 2026

Front-end proof of concept for a **life moment detector**: by looking at transactions, income, savings and in-app
behaviour, the bank anticipates life events (new job, buying a home, retirement…) and proposes the single most relevant
solution at the right moment. Each detected moment has a confidence score built from weighted signals.

> Front-end only. All data is hardcoded mock data; there is no backend or real detection logic yet.
> "KBC Moments" is a text logo — the real KBC logo is intentionally not used.

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run lint       # oxlint
```

## The one-minute demo

1. **Emma, 27** is selected by default. The phone shows her home screen (balances, recent transactions).
2. Click **Simulate next month (Oct)** in the demo panel.
3. New transactions land in the phone (new employer salary, final settlement from the old employer — highlighted as
   signals) and the pipeline animates **Signals → Understanding → Decision → Channel**.
4. The detection card shows **New job · 92%** confidence with weighted signals (+40, +30, +22) against a 75% threshold.
5. A push notification slides into the phone. Tap it to open the moment: a warm message, **"Why am I seeing this?"**,
   one recommended one-tap action (**Save €100 automatically every month**), **Talk to an advisor**, or
   **Not relevant for me**. The customer's choice is reflected back in the demo panel.
6. Open **Privacy** in the tab bar: customers choose which moments may be detected. Sensitive ones (family, health)
   are off by default and need explicit consent.
7. Switch to **Lucas & Sarah, 32** (buying a house) or **Marc, 63** (approaching retirement). They take two simulated
   months: the first stays *below the threshold* (monitoring), the second triggers the moment.

Tip: turn off a moment type in Privacy before simulating to show that the detection is **blocked by consent**; turning
it back on releases the notification.

## Project structure

```
src/
  api/                 Thin service layer returning Promises (swap for real API calls)
    client.ts          mockResponse() helper with simulated latency
    customers.ts       listCustomers, getCustomer
    moments.ts         simulateNextMonth (mock detector), submitMomentResponse
    consent.ts         getConsentCategories, getConsent, updateConsent
  data/mockData.ts     All mock data: customers, transactions, signals + weights, moments, recommendations, consent
  hooks/useDemo.ts     Demo state & pipeline orchestration
  components/
    phone/             PhoneFrame, HomeScreen, TransactionList, MomentDetail, ConsentScreen, TabBar, MomentNotification
    demo/              DemoPanel, CustomerSelector, MonthTimeline, Pipeline, DetectionCard, ConfidenceScore
  types.ts             Shared domain types
```

## Plugging in a backend

UI components never import `src/data/mockData.ts` directly — only `src/api/*` does. Every place where a real
endpoint should be called is marked with a `// TODO(API): ...` comment:

```bash
grep -rn "TODO(API)" src
```

Replace the body of each service function with a `fetch` call that returns the same types from `src/types.ts`.
