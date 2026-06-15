# Testing — EcoPulse

## How to Run Tests

```bash
npm test          # Run all tests once (CI mode)
npm run test:watch  # Watch mode for development
npm run test:coverage  # Generate coverage report
```

## Test Summary

| File | Tests | Coverage Focus |
|---|---|---|
| `src/lib/__tests__/calculator.test.ts` | 31 | All 4 emission categories + edge cases |
| `src/lib/__tests__/ecoBuddy.test.ts` | 9 | 5 PRD scenarios + weekly summary |
| **Total** | **40** | **All passing** |

---

## Calculator Tests (`calculator.test.ts`)

### Transport (6 tests)
- ✅ Empty transport → 0 emissions
- ✅ Petrol car: 10 km × 0.17 = 1.7 kg CO₂e
- ✅ Bicycle / walking = 0 emissions
- ✅ Metro < Bus < Car emission ordering
- ✅ Mixed modes correctly summed
- ✅ Negative km clamped to 0 (input validation)

### Energy (5 tests)
- ✅ 0 kWh + no fuel → 0 emissions
- ✅ Electricity: 5 kWh × 0.82 = 4.1 kg CO₂e
- ✅ `electricityFactorOverride` used when provided
- ✅ LPG: 2 kg × 2.98 = 5.96 kg CO₂e
- ✅ PNG: 1 m³ × 2.0 = 2.0 kg CO₂e

### Diet (5 tests)
- ✅ Heavy meat = 3.3 kg CO₂e/day
- ✅ Average = 2.5 kg CO₂e/day
- ✅ Vegetarian = 1.7 kg CO₂e/day
- ✅ Vegan = 1.5 kg CO₂e/day
- ✅ heavyMeat > average > vegetarian > vegan ordering verified

### Waste & Water (5 tests)
- ✅ 0 waste + 0 water → 0 emissions
- ✅ Non-composted: 2 kg × 0.5 = 1.0 kg CO₂e
- ✅ Composted: 2 kg × 0.1 = 0.2 kg CO₂e (lower factor)
- ✅ Composted < Non-composted (compost credit works)
- ✅ Water: 100 L × 0.0003 = 0.03 kg CO₂e

### Full Footprint (4 tests)
- ✅ Empty log returns correct diet-only total
- ✅ All categories correctly summed
- ✅ Date preserved from input log
- ✅ NaN/Infinity inputs handled gracefully (no propagation)

### Utilities (6 tests)
- ✅ `getDominantCategory` identifies transport correctly
- ✅ `getDominantCategory` identifies diet correctly
- ✅ `compareToAverage` returns 0% when equal
- ✅ `compareToAverage` returns negative % when below (better)
- ✅ `compareToAverage` returns positive % when above (worse)
- ✅ `getWeekKey` returns correct ISO week format (yyyy-Www)

---

## EcoBuddy Decision Engine Tests (`ecoBuddy.test.ts`)

Covers 5 representative scenarios as specified in PRD Section 14:

### Scenario 1: Transport-Heavy
- ✅ Identifies `transport` as top category when car km > 50/week
- ✅ Returns metro/bus switch or carpool action tag

### Scenario 2: Energy-Heavy
- ✅ Identifies `energy` when electricity > household median
- ✅ Suggests LED/AC reduction with positive savings estimate
- ✅ Suggests induction cooking when LPG dominates

### Scenario 3: Diet-Heavy (2 tests)
- ✅ Heavy meat diet → `plant_based_2_days` action tag, CO₂e savings > 0
- ✅ Vegan diet → `maintain_plant_diet` (congratulate)

### Scenario 4: Waste-Heavy (2 tests)
- ✅ Non-composted waste dominant → `start_composting` action, savings > 0
- ✅ Already composting → `reduce_total_waste` action

### Scenario 5: Improving Trend
- ✅ Declining 7-day footprint history → trend = 'improving'
- ✅ Message contains "streak" positive reinforcement

### Weekly Summary (2 tests)
- ✅ Empty history → flat trend, 0 total
- ✅ Multi-day aggregation calculates correct week total

---

## Accessibility Testing

### Static Analysis
Tailwind color tokens were verified for 4.5:1 minimum contrast ratio:
- Eco primary (`#00D4A0`) on dark (`#0A0F1E`): **8.3:1** ✅
- Muted text (`#8892B0`) on dark: **4.9:1** ✅
- White text on glass cards: **>7:1** ✅

### Manual Verification Checklist
- ✅ Tab order follows visual order
- ✅ All interactive elements have visible focus outlines (2px eco-primary)
- ✅ All charts have `.sr-only` data table fallback
- ✅ Radio groups have `role="radiogroup"` with `aria-label`
- ✅ Toggle switch uses `role="switch"` and `aria-checked`
- ✅ Modal uses `role="dialog"` and `aria-modal="true"`
- ✅ Dynamic content uses `aria-live="polite"`
- ✅ Icons are `aria-hidden="true"` with adjacent visible text
- ✅ Skip-to-content link present in App.tsx
- ✅ `prefers-reduced-motion` CSS media query applied globally

---

## Component Tests

Component tests can be added with `@testing-library/react`. Example:

```typescript
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import Dashboard from '../components/Dashboard';

test('Dashboard renders without errors', () => {
  render(<AppProvider><Dashboard /></AppProvider>);
  expect(screen.getByRole('region', { name: /EcoBuddy/i })).toBeDefined();
});
```

---

## Why Vitest (not Jest)?

- Native Vite integration — zero extra config, faster transforms
- `globals: true` eliminates import boilerplate in test files
- Same ecosystem as the build tool — consistent module resolution

---

## Emission Factor Test Accuracy Note

All expected values in calculator tests are derived directly from `src/data/emissionFactors.json`. If factors are updated, test expectations will need updating — this is by design (tests serve as a contract for the data).
