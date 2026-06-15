// EcoPulse — Carbon Footprint Calculator
// Pure function module — no UI dependencies, fully unit-testable
// PRD Section 6, Feature 3 & Section 8

import type { DailyLog, UserProfile, CalculatedFootprint, EmissionFactors } from '../types';

/**
 * Clamp a number between min and max (guards against NaN/Infinity)
 */
function clamp(value: number, min: number, max: number): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate transport emissions for a daily log.
 * @returns kg CO2e
 */
export function calculateTransportEmissions(
  log: DailyLog,
  factors: EmissionFactors
): number {
  return log.transport.reduce((total, entry) => {
    const km = clamp(entry.km, 0, 50000);
    const factor = factors.transport[entry.mode] ?? 0;
    return total + km * factor;
  }, 0);
}

/**
 * Calculate energy emissions (electricity + fuel) for a daily log.
 * @returns kg CO2e
 */
export function calculateEnergyEmissions(
  log: DailyLog,
  profile: UserProfile,
  factors: EmissionFactors
): number {
  const electricityFactor =
    profile.electricityFactorOverride ?? factors.electricity.indiaGridAverage;
  const kwhClamped = clamp(log.electricityKwh, 0, 10000);
  const electricityEmissions = kwhClamped * electricityFactor;

  let fuelEmissions = 0;
  const fuelAmount = clamp(log.fuel.amount, 0, 10000);
  if (log.fuel.type === 'lpg') {
    fuelEmissions = fuelAmount * factors.fuel.lpgPerKg;
  } else if (log.fuel.type === 'png') {
    fuelEmissions = fuelAmount * factors.fuel.pngPerCubicMeter;
  }

  return electricityEmissions + fuelEmissions;
}

/**
 * Calculate diet emissions for a daily log.
 * @returns kg CO2e
 */
export function calculateDietEmissions(
  log: DailyLog,
  factors: EmissionFactors
): number {
  const dietFactor = factors.diet[log.dietType] ?? factors.diet['average'];
  return clamp(dietFactor, 0, 20);
}

/**
 * Calculate waste & water emissions for a daily log.
 * @returns kg CO2e
 */
export function calculateWasteEmissions(
  log: DailyLog,
  factors: EmissionFactors
): number {
  const wasteKg = clamp(log.wasteKg, 0, 1000);
  const waterLiters = clamp(log.waterLiters, 0, 100000);

  // Composted organic waste gets a lower factor (credit for diversion)
  const wasteFactor = log.composted
    ? factors.waste.compostedPerKg
    : factors.waste.landfillPerKg;

  const wasteEmissions = wasteKg * wasteFactor;
  const waterEmissions = waterLiters * factors.water.perLiter;

  return wasteEmissions + waterEmissions;
}

/**
 * Main calculation function — pure, no side effects.
 * Converts a DailyLog into a CalculatedFootprint using the emission factors config.
 */
export function calculateFootprint(
  log: DailyLog,
  profile: UserProfile,
  factors: EmissionFactors
): CalculatedFootprint {
  const transport = calculateTransportEmissions(log, factors);
  const energy = calculateEnergyEmissions(log, profile, factors);
  const diet = calculateDietEmissions(log, factors);
  const waste = calculateWasteEmissions(log, factors);

  const byCategory = {
    transport: Math.round(transport * 1000) / 1000,
    energy: Math.round(energy * 1000) / 1000,
    diet: Math.round(diet * 1000) / 1000,
    waste: Math.round(waste * 1000) / 1000,
  };

  const totalKgCO2e =
    Math.round((byCategory.transport + byCategory.energy + byCategory.diet + byCategory.waste) * 1000) / 1000;

  return {
    date: log.date,
    byCategory,
    totalKgCO2e,
  };
}

/**
 * Aggregate multiple footprints into a weekly summary by category.
 */
export function aggregateWeeklyFootprints(
  footprints: CalculatedFootprint[]
): { byCategory: { transport: number; energy: number; diet: number; waste: number }; total: number } {
  const byCategory = { transport: 0, energy: 0, diet: 0, waste: 0 };
  let total = 0;

  for (const fp of footprints) {
    byCategory.transport += fp.byCategory.transport;
    byCategory.energy += fp.byCategory.energy;
    byCategory.diet += fp.byCategory.diet;
    byCategory.waste += fp.byCategory.waste;
    total += fp.totalKgCO2e;
  }

  return {
    byCategory: {
      transport: Math.round(byCategory.transport * 100) / 100,
      energy: Math.round(byCategory.energy * 100) / 100,
      diet: Math.round(byCategory.diet * 100) / 100,
      waste: Math.round(byCategory.waste * 100) / 100,
    },
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Get the dominant category (highest emission driver) from category breakdown.
 */
export function getDominantCategory(
  byCategory: { transport: number; energy: number; diet: number; waste: number }
): 'transport' | 'energy' | 'diet' | 'waste' {
  const entries = Object.entries(byCategory) as [keyof typeof byCategory, number][];
  return entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))[0];
}

/**
 * Compare user's daily footprint against India average.
 * @returns percentage above/below (negative = below = better)
 */
export function compareToAverage(
  userKgCO2e: number,
  indiaAvgPerDay: number
): number {
  if (indiaAvgPerDay === 0) return 0;
  return Math.round(((userKgCO2e - indiaAvgPerDay) / indiaAvgPerDay) * 100);
}

/**
 * Get ISO week string (e.g. "2025-W24") for a given date string.
 */
export function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
