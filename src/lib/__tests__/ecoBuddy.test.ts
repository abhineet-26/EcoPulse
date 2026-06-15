// EcoPulse — EcoBuddy Decision Engine Unit Tests
// PRD Section 14 — 5+ representative scenarios

import { describe, it, expect } from 'vitest';
import { getRecommendation, buildWeeklySummary } from '../ecoBuddy';
import type { DailyLog, UserProfile, CalculatedFootprint } from '../../types';

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

function makeFootprint(
  overrides: Partial<{ transport: number; energy: number; diet: number; waste: number; total: number }> = {},
  date = '2025-01-15'
): CalculatedFootprint {
  const byCategory = {
    transport: overrides.transport ?? 0,
    energy: overrides.energy ?? 0,
    diet: overrides.diet ?? 2.5,
    waste: overrides.waste ?? 0,
  };
  return {
    date,
    byCategory,
    totalKgCO2e: overrides.total ?? Object.values(byCategory).reduce((a, b) => a + b, 0),
  };
}

// Scenario 1: Transport-Heavy
describe('Scenario 1: Transport-heavy (car km > 50/week)', () => {
  it('identifies transport as top category and recommends transit switch', () => {
    const currentLog = makeLog({
      transport: [{ mode: 'petrolCar', km: 30 }],
    });
    const history = Array.from({ length: 6 }, (_, i) =>
      makeLog({ date: `2025-01-${String(9 + i).padStart(2, '0')}`, transport: [{ mode: 'petrolCar', km: 10 }] })
    );
    const footprint = {
      byCategory: { transport: 5.1, energy: 0.5, diet: 2.5, waste: 0.1 },
      totalKgCO2e: 8.2,
    };
    const rec = getRecommendation(currentLog, history, [], baseProfile, footprint);
    expect(rec.topCategory).toBe('transport');
    expect(['switch_metro_2x', 'use_bus_2x', 'carpool_or_combine']).toContain(rec.actionTag);
    expect(rec.estimatedSavingsKgCO2e).toBeGreaterThanOrEqual(0);
  });
});

// Scenario 2: Energy-Heavy
describe('Scenario 2: Energy-heavy (high electricity use)', () => {
  it('identifies energy as top category and suggests LED/AC reduction', () => {
    const currentLog = makeLog({ electricityKwh: 15 });
    const footprint = {
      byCategory: { transport: 0, energy: 12.3, diet: 2.5, waste: 0.1 },
      totalKgCO2e: 14.9,
    };
    const rec = getRecommendation(currentLog, [], [], baseProfile, footprint);
    expect(rec.topCategory).toBe('energy');
    expect(rec.estimatedSavingsKgCO2e).toBeGreaterThan(0);
  });
});

// Scenario 3: Diet-Heavy
describe('Scenario 3: Diet-heavy (heavy meat diet)', () => {
  it('identifies diet as top category and recommends plant-based days', () => {
    const currentLog = makeLog({ dietType: 'heavyMeat' });
    const footprint = {
      byCategory: { transport: 0.3, energy: 0.4, diet: 3.3, waste: 0.1 },
      totalKgCO2e: 4.1,
    };
    const rec = getRecommendation(currentLog, [], [], baseProfile, footprint);
    expect(rec.topCategory).toBe('diet');
    expect(rec.actionTag).toBe('plant_based_2_days');
    expect(rec.estimatedSavingsKgCO2e).toBeGreaterThan(0);
    expect(rec.message).toContain('plant');
  });

  it('congratulates vegan users', () => {
    const currentLog = makeLog({ dietType: 'vegan' });
    const footprint = {
      byCategory: { transport: 0, energy: 0, diet: 1.5, waste: 0 },
      totalKgCO2e: 1.5,
    };
    const rec = getRecommendation(currentLog, [], [], baseProfile, footprint);
    expect(rec.topCategory).toBe('diet');
    expect(rec.actionTag).toBe('maintain_plant_diet');
  });
});

// Scenario 4: Waste-Heavy
describe('Scenario 4: Waste-heavy (high landfill waste, no composting)', () => {
  it('identifies waste as top category and recommends composting', () => {
    const currentLog = makeLog({ wasteKg: 10, composted: false });
    // Waste must clearly dominate over diet to trigger waste recommendation
    const footprint = {
      byCategory: { transport: 0, energy: 0.5, diet: 1.5, waste: 5.0 },
      totalKgCO2e: 7.0,
    };
    const rec = getRecommendation(currentLog, [], [], baseProfile, footprint);
    expect(rec.topCategory).toBe('waste');
    expect(rec.actionTag).toBe('start_composting');
    expect(rec.estimatedSavingsKgCO2e).toBeGreaterThan(0);
    expect(rec.message.toLowerCase()).toContain('compost');
  });

  it('gives reduce-waste advice when already composting', () => {
    const currentLog = makeLog({ wasteKg: 8, composted: true });
    // Waste must clearly dominate: waste 4.0 > diet 1.5
    const footprint = {
      byCategory: { transport: 0, energy: 0.3, diet: 1.5, waste: 4.0 },
      totalKgCO2e: 5.8,
    };
    const rec = getRecommendation(currentLog, [], [], { ...baseProfile, dietType: 'vegan' }, footprint);
    expect(rec.topCategory).toBe('waste');
    expect(rec.actionTag).toBe('reduce_total_waste');
  });
});

// Scenario 5: Balanced / Improving Trend
describe('Scenario 5: Balanced footprint with improving trend', () => {
  it('detects improving trend from declining historical footprints', () => {
    const currentLog = makeLog({ electricityKwh: 2, dietType: 'vegetarian' });
    const historicalFootprints: CalculatedFootprint[] = [
      makeFootprint({ transport: 2, energy: 3, diet: 1.7, waste: 0.3, total: 7.0 }, '2025-01-09'),
      makeFootprint({ transport: 1.5, energy: 2.5, diet: 1.7, waste: 0.2, total: 5.9 }, '2025-01-10'),
      makeFootprint({ transport: 1, energy: 2, diet: 1.7, waste: 0.2, total: 4.9 }, '2025-01-11'),
      makeFootprint({ transport: 0.5, energy: 1.5, diet: 1.7, waste: 0.1, total: 3.8 }, '2025-01-12'),
    ];
    const footprint = {
      byCategory: { transport: 0, energy: 1.64, diet: 1.7, waste: 0.1 },
      totalKgCO2e: 3.44,
    };
    const rec = getRecommendation(currentLog, [], historicalFootprints, { ...baseProfile, dietType: 'vegetarian' }, footprint);
    expect(rec.trend).toBe('improving');
    expect(rec.message).toContain('streak');
  });
});

// buildWeeklySummary
describe('buildWeeklySummary', () => {
  it('returns flat trend for empty history', () => {
    const summary = buildWeeklySummary([]);
    expect(summary.weekTotal).toBe(0);
    expect(summary.trend).toBe('flat');
    expect(summary.dominantCategory).toBe('balanced');
  });

  it('correctly aggregates weekly totals', () => {
    const fps: CalculatedFootprint[] = [
      makeFootprint({ transport: 2, energy: 3, diet: 2.5, waste: 0.5, total: 8 }, '2025-01-13'),
      makeFootprint({ transport: 1, energy: 2, diet: 2.5, waste: 0.3, total: 5.8 }, '2025-01-14'),
    ];
    const summary = buildWeeklySummary(fps);
    expect(summary.weekTotal).toBeCloseTo(13.8, 1);
  });
});
