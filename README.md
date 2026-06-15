# EcoPulse — Personal Carbon Footprint Companion

> **Hackathon:** Prompt Wars Virtual — Challenge 3: Carbon Footprint Awareness Platform  
> **Vertical:** Climate & Sustainability  
> **Stack:** React + Vite + TypeScript + Tailwind CSS + Recharts + Gemini AI

---

## 🌍 What is EcoPulse?

EcoPulse is a privacy-first, client-side web app that helps you understand your daily carbon footprint **in under 30 seconds of input**, visualizes where your emissions come from, and gives you a dynamic, AI-powered "EcoBuddy" assistant that recommends your single most impactful next action — not generic advice.

**Zero backend. Zero signup. Zero cost to run.**

---

## 🎯 Chosen Vertical

**Challenge 3 — Carbon Footprint Awareness Platform**

EcoPulse directly addresses the challenge by:
- Translating complex CO₂e numbers into one prioritized, numerically-backed daily action
- Localizing for India with real emission factors (CEA, DEFRA, Our World in Data)
- Using Gemini AI to make recommendations feel personal and warm, not robotic
- Working fully offline with no API key required (rule-based fallback always active)

---

## 🔧 How It Works

```
Onboarding (profile) → Daily Log → Calculator → Dashboard + EcoBuddy → Goals/Badges
```

1. **Onboarding**: Set your region, household size, commute type, diet, and weekly goal. Stored in `localStorage` — never leaves your device.
2. **Quick Daily Log**: Four cards (Transport 🚗, Energy ⚡, Diet 🍽️, Waste ♻️) with sliders/steppers. Completes in ~30 seconds.
3. **Calculator Engine**: Pure function `calculateFootprint()` applies emission factors from `src/data/emissionFactors.json` to produce a `CalculatedFootprint` per category.
4. **Dashboard**: Today's total CO₂e, weekly trend line, category breakdown (pie/bar/table), comparison vs. India average and global average.
5. **EcoBuddy (AI-Powered)**: Identifies your top emission driver, applies the decision tree, and surfaces ONE specific recommendation with estimated kg CO₂e savings. Gemini AI rephrases it warmly.
6. **Weekly AI Insight**: A Gemini-generated 2–3 sentence personalized weekly narrative (biggest win, biggest opportunity). Cached per ISO week to avoid redundant API calls.
7. **Goals & Badges**: Weekly reduction target, daily streak tracking, badge awards (3-day streak, Plant Power, Zero Waste Hero, etc.).
8. **Export**: Download CSV or printable HTML report — no server needed.

---

## 🤖 EcoBuddy — Decision Logic

EcoBuddy runs a fully **documented, testable decision tree** (`src/lib/ecoBuddy.ts`):

**Step 1**: Compute category totals (Transport, Energy, Diet, Waste)  
**Step 2**: Identify the dominant category (highest % of total CO₂e)  
**Step 3**: Apply category-specific rules:

| Category | Condition | Recommendation |
|---|---|---|
| Transport | Car km/week > 50, public transit available | Switch 2 trips/week to metro — estimated CO₂e savings shown |
| Transport | Car km/week ≤ 50 | Carpool or combine errands |
| Energy | Electricity > household-size-adjusted median | Switch to LED, raise AC by 1°C |
| Energy | LPG dominant | Consider induction cooktop |
| Diet | Heavy meat | Try 2 plant-based days/week — CO₂e delta vs. vegetarian shown |
| Diet | Average | One plant-based meal tip |
| Diet | Vegetarian/Vegan | Celebrate + local produce tip |
| Waste | No composting | Start composting organic waste |
| Waste | Already composting | Reduce total waste generation |

**Step 4**: Trend detection over 7 days → positive reinforcement if improving, gentle nudge if worsening  
**Step 5**: Output as stable JSON contract `{ topCategory, message, estimatedSavingsKgCO2e, actionTag }`  
**Step 6**: Gemini rephrases message warmly (2s avg) → cached weekly insight generated

### Gemini AI Layer

- **`rephraseRecommendation(rec)`** — Calls `gemini-2.0-flash` to rewrite the EcoBuddy tip warmly in ≤2 sentences, preserving the CO₂e number.
- **`generateWeeklyInsight(summary)`** — Generates a personalized 2–3 sentence weekly narrative.
- Both use `AbortController` with an 8-second timeout.
- Both wrap calls in `try/catch` — any failure silently falls back to the rule-based message/templated summary.
- Weekly insight is cached in `localStorage` keyed by ISO week — no redundant calls.
- **The app is fully functional with zero API key** — Gemini is the enhanced experience, not a hard dependency.

---

## 📊 Emission Factors (Sources)

All factors stored in `src/data/emissionFactors.json` — single source of truth, easy to audit.

| Category | Source |
|---|---|
| Transport | DEFRA UK GHG Conversion Factors 2023; MoEFCC India |
| Electricity | CEA (Central Electricity Authority) India 2022-23 — 0.82 kg CO₂e/kWh |
| LPG/PNG | IPCC Guidelines for National GHG Inventories; DEFRA |
| Diet | Our World in Data; Poore & Nemecek (2018), Science |
| Waste | IPCC Fifth Assessment Report; EPA Waste Factors |
| Water | WSAA; EPA infrastructure emission estimates |
| Benchmarks | Our World in Data, World Bank, IEA 2023 |

> ⚠️ These are **approximate, India-weighted values for awareness purposes**. Override your electricity factor in profile settings for local accuracy.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Clone / navigate to project
cd ecopulse

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

### Run Tests

```bash
npm test
# 40 tests across calculator.test.ts and ecoBuddy.test.ts
```

### Optional: Enable Gemini AI

```bash
# Copy env template
cp .env.example .env.local

# Edit .env.local and set your key:
VITE_GEMINI_API_KEY=your_free_key_here
```

Get your **free** Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey) — no credit card required.

Restart `npm run dev` after setting the key.

---

## 🏗️ Project Structure

```
ecopulse/
├── src/
│   ├── App.tsx                     # Root + particle background + orb animations
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles (glassmorphism, animations)
│   ├── vite-env.d.ts              # Vite env type declarations
│   ├── components/
│   │   ├── Onboarding.tsx         # 5-step profile setup
│   │   ├── DailyLogForm.tsx       # 4-tab quick-entry log
│   │   ├── Dashboard.tsx          # Main dashboard (stats, tabs)
│   │   ├── CategoryChart.tsx      # Pie/bar/table chart with SR table
│   │   ├── EcoBuddyCard.tsx       # AI recommendation card
│   │   ├── WeeklyInsightCard.tsx  # Weekly AI narrative card
│   │   ├── GoalsBadges.tsx        # Goals, badges, export
│   │   └── Navigation.tsx         # Sticky top nav
│   ├── context/
│   │   └── AppContext.tsx         # React Context + localStorage state
│   ├── lib/
│   │   ├── calculator.ts          # Pure CO₂e calculation engine
│   │   ├── ecoBuddy.ts            # Decision tree engine
│   │   ├── ecoBuddyAI.ts         # Gemini API wrapper with fallbacks
│   │   ├── storage.ts             # Typed localStorage wrapper
│   │   └── __tests__/
│   │       ├── calculator.test.ts # 31 unit tests
│   │       └── ecoBuddy.test.ts   # 9 scenario tests (5 PRD scenarios)
│   ├── data/
│   │   └── emissionFactors.json   # Single source of truth for all CO₂e factors
│   └── types/
│       └── index.ts               # TypeScript interfaces
├── public/
│   └── icons/eco-leaf.svg        # SVG favicon
├── .env.example                   # API key template (committed)
├── .gitignore                     # Excludes node_modules, dist, .env*
├── README.md
├── SECURITY.md
├── TESTING.md
└── package.json
```

---

## ♿ Accessibility

EcoPulse targets **WCAG 2.1 AA**:
- Minimum 4.5:1 contrast ratio (dark theme verified)
- All interactive elements keyboard-navigable with visible focus states
- Charts include `<table>` with `.sr-only` for screen readers, plus a "view as table" toggle
- All form inputs use `<label for="id">` and `aria-describedby` for helper text
- `prefers-reduced-motion` — particle animations and transitions disabled
- `role="dialog"` with `aria-modal` on the log form modal
- `aria-live="polite"` on dynamic content (EcoBuddy message, weekly insight)
- Skip-to-content link for keyboard users
- Color never the only signal — icons and text paired with all status colors
- Browser text zoom up to 200% tested (flexbox/rem-based layout)

---

## 🔒 Security & Privacy

See [SECURITY.md](./SECURITY.md) for full details.

**TL;DR:**
- All data stays on your device (`localStorage`) — nothing is sent to any server except optional Gemini calls
- `.env.local` is in `.gitignore` — API key never committed
- All numeric inputs are validated and clamped (no NaN/Infinity propagation)
- Gemini calls wrapped in `try/catch` + 8s `AbortController` timeout
- API key never logged

---

## 🎨 Design

- **Theme**: Dark glassmorphism with teal/violet accent palette
- **Primary**: `#00D4A0` (electric teal), **Accent**: `#7C3AED` (deep violet)
- **Background**: Animated particle canvas + floating gradient orbs
- **Cards**: `backdrop-filter: blur(20px)` glass cards with subtle inset borders
- **Typography**: Inter (Google Fonts) + JetBrains Mono for numbers
- **Animations**: Float, orb-float, slide-up, fade-in, animated number counters

---

## 📝 Assumptions

1. India-default emission factors (0.82 kg CO₂e/kWh grid, metric units)
2. Emission factors are approximate — illustrative for awareness, not regulatory compliance
3. Single-user, local data only; household size used for per-capita energy benchmarking
4. Diet factors represent daily per-person averages, not individual meal tracking
5. No real backend — badges and community comparisons are local-only simulations

---

## 📄 License

MIT — feel free to fork, learn, and adapt.
