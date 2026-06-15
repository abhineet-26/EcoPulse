// EcoPulse — Calculator Unit Tests
// PRD Section 14 — covers each category + edge cases

import { describe, it, expect } from 'vitest';
import {
  calculateFootprint,
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateDietEmissions,
  calculateWasteEmissions,
  getDominantCategory,
  compareToAverage,
  getWeekKey,
} from '../calculator';
import type { DailyLog, UserProfile, EmissionFactors } from '../../types';
import factorsJson from '../../data/emissionFactors.json';

const factors = factorsJson as unknown as EmissionFactors;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseProfile: UserProfile = {
  region: 'IN',
  householdSize: 3,
  primaryCommute: 'car',
  dietType: 'average',
  createdAt: '2025-01-01',
};

function makeLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    date: '2025-01-15',
    transport: [],
    electricityKwh: 0,
    fuel: { type: 'none', amount: 0 },
    dietType: 'average',
    wasteKg: 0,
    composted: false,
    waterLiters: 0,
    ...overrides,
  };
}

// ── Transport Tests ───────────────────────────────────────────────────────────

describe('calculateTransportEmissions', () => {
  it('returns 0 for empty transport', () => {
    const log = makeLog({ transport: [] });
    expect(calculateTransportEmissions(log, factors)).toBe(0);
  });

  it('calculates petrol car correctly: 10 km × 0.17 = 1.7', () => {
    const log = makeLog({ transport: [{ mode: 'petrolCar', km: 10 }] });
    expect(calculateTransportEmissions(log, factors)).toBeCloseTo(1.7, 5);
  });

  it('bicycle/walking = 0 emissions', () => {
    const log = makeLog({
      transport: [
        { mode: 'bicycle', km: 20 },
        { mode: 'walking', km: 5 },
      ],
    });
    expect(calculateTransportEmissions(log, factors)).toBe(0);
  });

  it('metro produces less than bus which is less than car', () => {
    const metroLog = makeLog({ transport: [{ mode: 'metro', km: 10 }] });
    const busLog = makeLog({ transport: [{ mode: 'bus', km: 10 }] });
    const carLog = makeLog({ transport: [{ mode: 'petrolCar', km: 10 }] });

    const metro = calculateTransportEmissions(metroLog, factors);
    const bus = calculateTransportEmissions(busLog, factors);
    const car = calculateTransportEmissions(carLog, factors);

    expect(metro).toBeLessThan(bus);
    expect(bus).toBeLessThan(car);
  });

  it('handles mixed modes correctly', () => {
    const log = makeLog({
      transport: [
        { mode: 'petrolCar', km: 5 },   // 5 × 0.17 = 0.85
        { mode: 'metro', km: 10 },        // 10 × 0.03 = 0.30
      ],
    });
    const result = calculateTransportEmissions(log, factors);
    expect(result).toBeCloseTo(1.15, 5);
  });

  it('clamps negative km to 0', () => {
    const log = makeLog({ transport: [{ mode: 'petrolCar', km: -5 }] });
    expect(calculateTransportEmissions(log, factors)).toBe(0);
  });
});

// ── Energy Tests ──────────────────────────────────────────────────────────────

describe('calculateEnergyEmissions', () => {
  it('returns 0 for 0 kWh and no fuel', () => {
    const log = makeLog({ electricityKwh: 0, fuel: { type: 'none', amount: 0 } });
    expect(calculateEnergyEmissions(log, baseProfile, factors)).toBe(0);
  });

  it('calculates electricity correctly: 5 kWh × 0.82 = 4.1', () => {
    const log = makeLog({ electricityKwh: 5, fuel: { type: 'none', amount: 0 } });
    expect(calculateEnergyEmissions(log, baseProfile, factors)).toBeCloseTo(4.1, 5);
  });

  it('uses electricityFactorOverride when provided', () => {
    const profileWithOverride = { ...baseProfile, electricityFactorOverride: 0.5 };
    const log = makeLog({ electricityKwh: 10, fuel: { type: 'none', amount: 0 } });
    expect(calculateEnergyEmissions(log, profileWithOverride, factors)).toBeCloseTo(5.0, 5);
  });

  it('calculates LPG correctly: 2 kg × 2.98 = 5.96', () => {
    const log = makeLog({ electricityKwh: 0, fuel: { type: 'lpg', amount: 2 } });
    expect(calculateEnergyEmissions(log, baseProfile, factors)).toBeCloseTo(5.96, 5);
  });

  it('calculates PNG correctly: 1 m³ × 2.0 = 2.0', () => {
    const log = makeLog({ electricityKwh: 0, fuel: { type: 'png', amount: 1 } });
    expect(calculateEnergyEmissions(log, baseProfile, factors)).toBeCloseTo(2.0, 5);
  });
});

// ── Diet Tests ────────────────────────────────────────────────────────────────

describe('calculateDietEmissions', () => {
  it('heavy meat diet = 3.3 kg CO2e', () => {
    const log = makeLog({ dietType: 'heavyMeat' });
    expect(calculateDietEmissions(log, factors)).toBeCloseTo(3.3, 5);
  });

  it('average diet = 2.5 kg CO2e', () => {
    const log = makeLog({ dietType: 'average' });
    expect(calculateDietEmissions(log, factors)).toBeCloseTo(2.5, 5);
  });

  it('vegetarian diet = 1.7 kg CO2e', () => {
    const log = makeLog({ dietType: 'vegetarian' });
    expect(calculateDietEmissions(log, factors)).toBeCloseTo(1.7, 5);
  });

  it('vegan diet = 1.5 kg CO2e', () => {
    const log = makeLog({ dietType: 'vegan' });
    expect(calculateDietEmissions(log, factors)).toBeCloseTo(1.5, 5);
  });

  it('diet emissions follow: heavyMeat > average > vegetarian > vegan', () => {
    const heavy = calculateDietEmissions(makeLog({ dietType: 'heavyMeat' }), factors);
    const avg = calculateDietEmissions(makeLog({ dietType: 'average' }), factors);
    const veg = calculateDietEmissions(makeLog({ dietType: 'vegetarian' }), factors);
    const vegan = calculateDietEmissions(makeLog({ dietType: 'vegan' }), factors);
    expect(heavy).toBeGreaterThan(avg);
    expect(avg).toBeGreaterThan(veg);
    expect(veg).toBeGreaterThan(vegan);
  });
});

// ── Waste Tests ───────────────────────────────────────────────────────────────

describe('calculateWasteEmissions', () => {
  it('returns 0 for 0 waste and 0 water', () => {
    const log = makeLog({ wasteKg: 0, waterLiters: 0 });
    expect(calculateWasteEmissions(log, factors)).toBe(0);
  });

  it('non-composted waste: 2 kg × 0.5 = 1.0', () => {
    const log = makeLog({ wasteKg: 2, waterLiters: 0, composted: false });
    expect(calculateWasteEmissions(log, factors)).toBeCloseTo(1.0, 5);
  });

  it('composted waste uses lower factor (0.1): 2 kg × 0.1 = 0.2', () => {
    const log = makeLog({ wasteKg: 2, waterLiters: 0, composted: true });
    expect(calculateWasteEmissions(log, factors)).toBeCloseTo(0.2, 5);
  });

  it('composted waste lower than non-composted', () => {
    const composted = calculateWasteEmissions(makeLog({ wasteKg: 2, composted: true }), factors);
    const landfill = calculateWasteEmissions(makeLog({ wasteKg: 2, composted: false }), factors);
    expect(composted).toBeLessThan(landfill);
  });

  it('water: 100 liters × 0.0003 = 0.03', () => {
    const log = makeLog({ wasteKg: 0, waterLiters: 100 });
    expect(calculateWasteEmissions(log, factors)).toBeCloseTo(0.03, 5);
  });
});

// ── Full Footprint Tests ──────────────────────────────────────────────────────

describe('calculateFootprint', () => {
  it('returns zero total for empty log', () => {
    const log = makeLog();
    const result = calculateFootprint(log, baseProfile, factors);
    // Diet is always non-zero (default average = 2.5)
    expect(result.byCategory.transport).toBe(0);
    expect(result.byCategory.energy).toBe(0);
    expect(result.byCategory.diet).toBe(2.5);
    expect(result.byCategory.waste).toBe(0);
    expect(result.totalKgCO2e).toBe(2.5);
  });

  it('sums all categories correctly', () => {
    const log = makeLog({
      transport: [{ mode: 'petrolCar', km: 10 }],  // 1.7
      electricityKwh: 5,                             // 4.1
      dietType: 'average',                           // 2.5
      wasteKg: 2,                                    // 1.0
      waterLiters: 100,                              // 0.03
    });
    const result = calculateFootprint(log, baseProfile, factors);
    expect(result.byCategory.transport).toBeCloseTo(1.7, 2);
    expect(result.byCategory.energy).toBeCloseTo(4.1, 2);
    expect(result.byCategory.diet).toBeCloseTo(2.5, 2);
    expect(result.totalKgCO2e).toBeGreaterThan(9);
  });

  it('preserves date from log', () => {
    const log = makeLog({ date: '2025-06-15' });
    const result = calculateFootprint(log, baseProfile, factors);
    expect(result.date).toBe('2025-06-15');
  });

  it('handles NaN/Infinity in inputs gracefully', () => {
    const log = makeLog({
      electricityKwh: NaN,
      wasteKg: Infinity,
    });
    const result = calculateFootprint(log, baseProfile, factors);
    expect(isFinite(result.totalKgCO2e)).toBe(true);
    expect(isNaN(result.totalKgCO2e)).toBe(false);
  });
});

// ── Utility Tests ─────────────────────────────────────────────────────────────

describe('getDominantCategory', () => {
  it('identifies transport as dominant', () => {
    expect(getDominantCategory({ transport: 5, energy: 1, diet: 2, waste: 0.5 })).toBe('transport');
  });

  it('identifies diet as dominant', () => {
    expect(getDominantCategory({ transport: 0, energy: 0, diet: 3.3, waste: 0 })).toBe('diet');
  });
});

describe('compareToAverage', () => {
  it('returns 0% when equal to average', () => {
    expect(compareToAverage(4.4, 4.4)).toBe(0);
  });

  it('returns negative % when below average (better)', () => {
    expect(compareToAverage(2.2, 4.4)).toBe(-50);
  });

  it('returns positive % when above average (worse)', () => {
    expect(compareToAverage(8.8, 4.4)).toBe(100);
  });
});

describe('getWeekKey', () => {
  it('returns correct ISO week format', () => {
    const key = getWeekKey('2025-01-15');
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });
});
