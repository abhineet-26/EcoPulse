# Product Requirements Document (PRD)
## Project Codename: "EcoPulse" — Personal Carbon Footprint Companion
### Prepared for: Google Antigravity (AI build agent)
### Hackathon: Prompt Wars Virtual — Challenge 3 (Carbon Footprint Awareness Platform)

---

## 1. Purpose of This Document

This PRD is written to be handed directly to Antigravity as a build brief. It defines what to build, why, the architecture, the data model, the "smart assistant" decision logic, accessibility/security/testing requirements, the repo structure, and a phased build plan with ready-to-use prompts. The end result must satisfy the hackathon's hard rules (public single-branch repo under 10 MB) and score highly on Code Quality, Security, Efficiency, Testing, and Accessibility, while feeling genuinely useful in the real world.

---

## 2. Vision Statement

EcoPulse is a privacy-first, client-side web app that helps a person understand their daily carbon footprint in under 30 seconds of input, visualizes where their emissions come from, and gives them a dynamic, context-aware "EcoBuddy" assistant that recommends the single most impactful next action — not generic advice. No backend, no signup, no cost to run, and small enough to fit hackathon constraints while still feeling like a polished consumer product.

---

## 3. Problem Statement

Most people have no concrete sense of their personal carbon footprint or which daily habits matter most (transport vs. diet vs. electricity vs. waste). Existing carbon calculators are either one-time quizzes with no follow-up, or heavy enterprise ESG tools irrelevant to individuals. There is a gap for a lightweight, daily-use, personalized tool that turns abstract "CO2e" numbers into specific, prioritized, achievable actions.

---

## 4. Target Users / Personas

1. **Riya, 27, urban professional (Delhi)** — commutes by car/metro, wants to know if switching to metro 3x/week actually matters.
2. **Aman, 21, college student** — limited budget, curious about food choices vs. travel choices.
3. **The Sharma household** — family of 4 tracking shared electricity and LPG usage, wants a monthly trend view.

---

## 5. Goals & Success Metrics (mapped to evaluation criteria)

| Goal | Metric / Evidence |
|---|---|
| Smart, dynamic assistant | Assistant recommendation changes based on which category dominates the user's footprint (transport/energy/diet/waste), not static text |
| Logical decision-making | Documented decision tree (Section 9) implemented in code, unit-tested |
| Real-world usability | Daily log entry completable in <30 seconds; works offline; mobile-first |
| Clean, maintainable code | Modular components, typed data layer, emission-factor config separated from logic, documented |
| Accessibility | WCAG 2.1 AA — contrast, keyboard nav, ARIA, screen-reader friendly charts |
| Security | No secrets committed, client-side only, input validation, optional AI key handled via env var with safe fallback |
| Efficiency | <10 MB repo, no unnecessary dependencies, lazy-loaded chart libs |
| Testing | Unit tests for the calculation engine + decision engine, sample test cases included |

---

## 6. Core Features (MVP — must build)

1. **Onboarding / Profile Setup**
   - Country/region (defaults to India), household size, primary commute mode, diet type.
   - Stored locally (localStorage); used to set sensible defaults for emission factors.

2. **Quick Daily Log**
   - Four quick-entry cards: Transport, Energy/Electricity, Food/Diet, Waste & Water.
   - Sliders/steppers + numeric input, not free text, for speed.
   - Auto-saves to local storage; one entry per day, editable.

3. **Carbon Footprint Calculation Engine**
   - Pure function module, no UI dependencies, fully unit-testable.
   - Converts activity quantities → kg CO2e using an emission-factors config (Section 8).

4. **Dashboard / Visualizations**
   - Today's total CO2e, weekly trend line, category breakdown (pie/bar), comparison vs. national average.
   - Built with a lightweight chart library (Recharts).

5. **EcoBuddy — AI-Powered Smart Assistant (Gemini)**
   - Rule-based decision engine (always works, no API needed) that identifies the user's top emission driver and surfaces ONE prioritized, specific recommendation with estimated CO2e savings.
   - Gemini AI layer (core, headline feature): EcoBuddy sends the rule-based recommendation to Gemini to rephrase it in a warm, personalized tone, and also generates a "Weekly AI Insight" — a short 2–3 sentence narrative summarizing the user's week (biggest win, biggest opportunity, encouragement).
   - Safety fallback (best practice, not a downgrade): if the API key is missing or the call fails/times out, the app instantly falls back to the rule-based message/templated summary — so the app is always demo-safe, while the AI experience is the default when configured.

6. **Goals & Gamification**
   - User sets a weekly reduction target (%); app tracks streaks and awards badges (e.g., "3-day low-carbon streak", "Meat-free Monday champion").

7. **Comparison & Benchmarking**
   - Compare user's footprint to country/global average (static reference values, documented sources).

8. **Accessibility & Theming**
   - Light/dark mode, font-size control, full keyboard navigation, ARIA-labeled charts with text-equivalent data tables.

9. **Export/Share**
   - "Download my weekly report" as a simple printable HTML/CSV — no server required.

---

## 7. Stretch Features (only after MVP is solid — medium/low impact polish)

- Multi-language toggle (English/Hindi) for accessibility points.
- Voice input for logging (Web Speech API).
- "What-if" simulator: slider to preview CO2e impact of a hypothetical change (e.g., "what if I take the metro 2x/week instead of driving").
- Local community challenge (purely local-storage based leaderboard simulation, clearly labeled as demo data — avoid implying a real backend).
- PWA installability (manifest + service worker) for offline real-world use.

**Do not** attempt features that require a real backend, authentication, or paid APIs as core dependencies — they risk breaking the "must work out of the box" and "under 10 MB" rules, and add security surface area.

---

## 8. Emission Factors Reference Data (seed this as a JSON config file)

Use these as defaults (illustrative, India-weighted; cite sources like DEFRA/EPA/CEA in README as "approximate, for awareness purposes"):

**Transport (kg CO2e per km per person):**
- Petrol car (small/medium): 0.17
- Diesel car: 0.18
- Motorbike/scooter: 0.07
- Bus: 0.05
- Metro/train: 0.03
- Auto-rickshaw (CNG): 0.06
- Bicycle/Walk: 0.0
- Domestic flight: 0.25

**Electricity:**
- India grid average: 0.82 kg CO2e per kWh
- Allow user to override with their own region's factor.

**Cooking/Heating Fuel:**
- LPG cylinder (14.2 kg): ~42 kg CO2e (≈2.98 kg CO2e/kg)
- PNG (per m³): ~2.0 kg CO2e

**Diet (kg CO2e per day, average adult):**
- Heavy meat diet: 3.3
- Average/mixed diet: 2.5
- Vegetarian: 1.7
- Vegan: 1.5

**Waste:**
- Mixed landfill waste: 0.5 kg CO2e per kg
- Segregated/composted organic waste: 0.1 kg CO2e per kg (credit for diversion)

**Water:**
- 0.0003 kg CO2e per liter (treatment + pumping)

Store all of this in `src/data/emissionFactors.json` so it's the single source of truth, easy to audit, and easy to localize.

---

## 9. EcoBuddy — Smart Assistant Decision Logic (the "dynamic" core)

This is the centerpiece that differentiates the project — implement as a pure, testable function `getRecommendation(userLog, history)`.

**Step 1 — Compute category totals** for the current day/week: Transport, Energy, Diet, Waste.

**Step 2 — Identify the dominant category** (highest % share of total CO2e).

**Step 3 — Apply a decision tree per category** (examples — expand with more rules):

- **Transport dominant + car usage > 0:**
  - If car km/week > 50 and metro/bus available in profile → recommend replacing 2 car trips/week with metro; show estimated weekly CO2e saved using the factor difference.
  - Else if car km/week ≤ 50 → recommend carpooling or combining errands.

- **Energy dominant:**
  - If electricity usage above household-size-adjusted median → suggest specific actions (switch to LED, reduce AC by 1°C, unplug standby devices) with estimated kWh/CO2e impact.

- **Diet dominant:**
  - If diet = "heavy meat" → recommend 1–2 plant-based days/week, show CO2e delta vs. vegetarian factor.
  - If diet already vegetarian/vegan → congratulate and suggest local/seasonal produce tip.

- **Waste dominant:**
  - If no composting flag set → recommend starting composting for organic waste, show CO2e credit.

**Step 4 — Trend-aware nudges:**
- If 7-day trend is improving → positive reinforcement message + streak badge logic.
- If trend is flat/worsening for 3+ days → gently surface the Step 3 recommendation again with a slightly stronger framing.

**Step 5 — Output contract** (so UI and tests are stable):
```json
{
  "topCategory": "transport",
  "message": "Swapping 2 car commutes for metro this week could cut about 4.2 kg CO2e — roughly the same as planting...",
  "estimatedSavingsKgCO2e": 4.2,
  "actionTag": "switch_metro_2x"
}
```

**Step 6 — AI rephrasing & weekly insight layer (Gemini, core feature):**
- Send the structured recommendation object to the Gemini API with a prompt like: *"Rephrase this carbon-saving tip in a warm, encouraging tone, max 2 sentences, keep the number."*
- Once per week, send the user's category totals and trend to Gemini with a prompt like: *"Write a 2–3 sentence personalized weekly summary highlighting the user's biggest improvement and biggest opportunity, encouraging tone."*
- Cache the weekly insight result in localStorage (keyed by week) to avoid redundant API calls — good for efficiency and rate limits.
- Wrap both calls in try/catch with a timeout (e.g. AbortController, 8s) — on any failure or missing API key, silently use the rule-based message / a templated summary instead. This keeps the app fully functional and demo-safe even with zero API keys, while making Gemini the default, headline experience when configured.

---

## 10. Technical Architecture

- **Frontend Framework:** React + Vite (fast build, small footprint) with TypeScript for maintainability.
- **Styling:** Tailwind CSS (utility classes, easy to keep accessible contrast ratios consistent).
- **Charts:** Recharts (lightweight, accessible-friendly).
- **State/Persistence:** React Context + localStorage (via a small typed wrapper `src/lib/storage.ts`). No database, no server.
- **AI Integration (optional):** Single isolated module `src/lib/ecoBuddyAI.ts` calling Gemini API only if `VITE_GEMINI_API_KEY` is set in `.env.local` (never committed — add to `.gitignore`).
- **Testing:** Vitest + React Testing Library.
- **Hosting (optional, post-submission):** GitHub Pages or Netlify static deploy — not required for evaluation but mentioned in README as a bonus.

---

## 11. Data Model (TypeScript types)

```typescript
interface UserProfile {
  region: string;          // default "IN"
  householdSize: number;
  primaryCommute: "car" | "bike" | "publicTransport" | "walkCycle";
  dietType: "heavyMeat" | "average" | "vegetarian" | "vegan";
  electricityFactorOverride?: number; // kg CO2e/kWh
}

interface DailyLog {
  date: string; // ISO yyyy-mm-dd
  transport: { mode: string; km: number }[];
  electricityKwh: number;
  fuel: { type: "lpg" | "png" | "none"; amount: number };
  dietType: UserProfile["dietType"];
  wasteKg: number;
  composted: boolean;
  waterLiters: number;
}

interface CalculatedFootprint {
  date: string;
  byCategory: { transport: number; energy: number; diet: number; waste: number };
  totalKgCO2e: number;
}
```

---

## 12. Accessibility Requirements (WCAG 2.1 AA)

- Minimum contrast ratio 4.5:1 for text; verify with Tailwind color tokens.
- All interactive elements reachable via Tab, with visible focus states.
- All charts have an accompanying `<table>` with the same data, visually hidden but screen-reader accessible (`sr-only` class), or a toggle to "view as table."
- Form inputs use `<label>` with `for`/`id`, and `aria-describedby` for helper text.
- Respect `prefers-reduced-motion` for any animations.
- Support browser-level text zoom up to 200% without breaking layout.
- Color is never the only signal (e.g., pair red/green status with icons/text).

---

## 13. Security & Privacy Requirements

- No personal data leaves the device — everything is stored in `localStorage`.
- `.env.local` for any API key, listed in `.gitignore`; `.env.example` committed with placeholder only.
- Sanitize/validate all numeric inputs (min 0, max sane upper bound) before calculation to avoid NaN/Infinity propagation.
- If Gemini API is used, never log the API key, and wrap calls in try/catch with timeouts.
- Add a `SECURITY.md` (brief) noting the privacy-by-design approach — this is also good for the "Security" evaluation criterion.

---

## 14. Testing Strategy

- **Unit tests** (`src/lib/__tests__/calculator.test.ts`): verify `calculateFootprint()` against known inputs/outputs for each category using the emission factors table.
- **Unit tests** (`src/lib/__tests__/ecoBuddy.test.ts`): verify `getRecommendation()` returns the correct `topCategory` and `actionTag` for at least 5 representative scenarios (transport-heavy, energy-heavy, diet-heavy, waste-heavy, balanced/improving).
- **Unit tests** (`src/lib/__tests__/ecoBuddyAI.test.ts`): mock `fetch` to verify both Gemini functions (rephrase + weekly insight) return correct templated fallbacks when the API key is missing or the request fails/times out, and correctly pass through Gemini's response on success.
- **Component tests**: onboarding form validation, daily log submission, dashboard renders totals correctly.
- **Accessibility test**: run `axe-core` (via `vitest-axe` or `@axe-core/react` in dev) on key pages, document results in README.
- Include a short `TESTING.md` summarizing what's covered and how to run `npm test`.

---

## 15. Repository Structure

```
ecopulse/
├── README.md
├── SECURITY.md
├── TESTING.md
├── .gitignore
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Onboarding.tsx
│   │   ├── DailyLogForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EcoBuddyCard.tsx
│   │   ├── CategoryChart.tsx
│   │   └── GoalsBadges.tsx
│   ├── lib/
│   │   ├── calculator.ts
│   │   ├── ecoBuddy.ts
│   │   ├── ecoBuddyAI.ts
│   │   └── storage.ts
│   ├── data/
│   │   └── emissionFactors.json
│   ├── types/
│   │   └── index.ts
│   └── lib/__tests__/
│       ├── calculator.test.ts
│       └── ecoBuddy.test.ts
└── public/
    └── icons/ (small svg/png only)
```

---

## 16. README Requirements (must include)

1. **Chosen vertical:** Challenge 3 — Carbon Footprint Awareness Platform.
2. **Approach & logic:** Explain the rule-based decision engine, emission factor sourcing, and the Gemini AI layer (rephrased tips + weekly AI insight), including how to get/configure a free Gemini API key, and the safe fallback behavior if the key is missing.
3. **How it works:** Onboarding → daily logging → calculation → dashboard → EcoBuddy recommendation → goals/badges.
4. **Assumptions made:** India-default emission factors (overridable), illustrative/approximate values, single-user local data only, no real backend/community features.
5. **Setup instructions:** `npm install`, `npm run dev`, `npm test`, optional `.env.local` for Gemini key.
6. **Screenshots** (optimized/compressed, keep total repo small).
7. **Accessibility & security notes** (short summary, link to SECURITY.md).

---

## 17. Repo Size Management (to satisfy the <10 MB rule)

- `.gitignore` must exclude: `node_modules/`, `dist/`, `.env*`, `*.log`.
- Compress all images (PNG/SVG) before committing; prefer SVG for icons.
- Avoid committing lockfile bloat from unnecessary dependencies — keep `package.json` minimal (React, Vite, Tailwind, Recharts, Vitest, Testing Library only).
- Do not vendor any large datasets — emission factors JSON should be a few KB.

---

## 18. Single Branch / Submission Rules Checklist

- [ ] One GitHub repo, set to **Public**.
- [ ] Work only on `main` (never create/push other branches).
- [ ] Commit incrementally with clear messages (helps "Code Quality" review).
- [ ] Final repo size < 10 MB (`du -sh .git` check before final push, excluding ignored files).
- [ ] README, SECURITY.md, TESTING.md present.
- [ ] `.env.example` present, `.env.local` NOT committed.
- [ ] App runs with zero configuration (`npm install && npm run dev`) — no required API keys.

---

## 19. Phased Build Plan — Prompts for Antigravity

Use these as sequential prompts inside Antigravity once the repo is cloned locally.

**Phase 1 — Scaffold**
> "Initialize a Vite + React + TypeScript project named ecopulse. Add Tailwind CSS. Create the folder structure exactly as specified in the PRD Section 15. Add a .gitignore covering node_modules, dist, and .env*. Add a placeholder .env.example with VITE_GEMINI_API_KEY=."

**Phase 2 — Data Layer & Calculator**
> "Create src/data/emissionFactors.json using the values in PRD Section 8. Create src/types/index.ts with the interfaces from Section 11. Implement src/lib/calculator.ts with a pure function calculateFootprint(log: DailyLog, profile: UserProfile, factors): CalculatedFootprint. Write unit tests in src/lib/__tests__/calculator.test.ts covering at least one scenario per category."

**Phase 3 — Onboarding & Daily Log UI**
> "Build Onboarding.tsx (collects UserProfile, saves to localStorage via storage.ts) and DailyLogForm.tsx (quick-entry sliders/inputs for transport, electricity, fuel, diet, waste, water; saves DailyLog to localStorage keyed by date). Ensure all inputs are validated (no negative numbers) and fully keyboard accessible with labels."

**Phase 4 — Dashboard & Charts**
> "Build Dashboard.tsx showing: today's total CO2e, a weekly trend line chart, and a category breakdown chart using Recharts. Add an accessible data table fallback alongside each chart (sr-only or toggle). Use Tailwind for a clean, responsive, light/dark-mode layout."

**Phase 5 — EcoBuddy Decision Engine**
> "Implement src/lib/ecoBuddy.ts with getRecommendation(currentLog, weeklyHistory, profile) following the decision tree in PRD Section 9, returning the JSON contract shown. Write at least 5 unit tests in ecoBuddy.test.ts covering transport-heavy, energy-heavy, diet-heavy, waste-heavy, and improving-trend scenarios. Then build EcoBuddyCard.tsx to display the recommendation with the estimated savings."

**Phase 6 — Gemini AI Layer (core feature)**
> "Implement src/lib/ecoBuddyAI.ts with two functions: (1) rephraseRecommendation(rec) — calls the Gemini API to rewrite the EcoBuddy message warmly in <=2 sentences while preserving the numeric estimate, and (2) generateWeeklyInsight(weeklySummary) — calls Gemini to produce a 2-3 sentence personalized weekly narrative (biggest win, biggest opportunity). Both should read the key from import.meta.env.VITE_GEMINI_API_KEY, use a fetch timeout via AbortController (e.g. 8s), and wrap in try/catch. On any error or missing key, return a templated fallback string built from the raw numbers, so the app is fully functional with zero configuration. Cache the weekly insight in localStorage keyed by week to avoid redundant calls. Wire rephraseRecommendation into EcoBuddyCard.tsx and generateWeeklyInsight into a new WeeklyInsightCard.tsx on the Dashboard."

**Phase 7 — Goals, Badges, Export**
> "Build GoalsBadges.tsx: let users set a weekly % reduction goal, track daily streaks in localStorage, and award simple badges (e.g., '3-day streak', 'Meat-free week'). Add an export feature that generates a printable/downloadable weekly summary as HTML or CSV without a server."

**Phase 8 — Accessibility & Testing Pass**
> "Run an accessibility audit (axe-core) across all pages, fix contrast, focus order, and ARIA issues found. Ensure prefers-reduced-motion is respected. Run npm test and confirm all unit/component tests pass. Document results in TESTING.md."

**Phase 9 — Docs & Final Cleanup**
> "Write README.md per PRD Section 16, write SECURITY.md per Section 13, verify .gitignore correctness, check total repo size is under 10 MB, ensure only the main branch exists, and commit/push final changes."

---

## 20. What Will Make This Stand Out

- Gemini-powered personalization is front-and-center (rephrased tips + a "Weekly AI Insight" narrative), giving judges a visible "AI" wow-factor — while the rule-based fallback guarantees the demo never breaks, even with no internet on stage.
- The assistant's logic is transparent, testable, and genuinely adaptive — not a hardcoded tip list.
- Real, sourced emission factors localized for India (with override option) make it credible, not a toy.
- Zero setup friction (no required API keys, no backend) means judges can run it instantly.
- Accessibility and security are treated as first-class, documented requirements rather than afterthoughts — directly aligned with the stated evaluation tiers.
- The "what-if" framing in recommendations (estimated kg CO2e saved, with relatable comparisons) makes the tool feel actionable rather than just informational.

---

## 21. Getting a Gemini API Key (Quick Setup Guide)

1. Go to **aistudio.google.com** and sign in with a Google account.
2. Click **"Get API key"** → **"Create API key"**, then copy it.
3. In the project root, copy `.env.example` to a new file `.env.local`.
4. Set: `VITE_GEMINI_API_KEY=your_key_here`
5. `.env.local` is already in `.gitignore` — never commit it.
6. Restart `npm run dev` so Vite picks up the new variable.

The app works fully without this key (rule-based fallback for both the tip and the weekly summary), so this is optional for anyone running/judging the project — but adding it unlocks the full Gemini-powered experience described in Section 6 and Section 9.
