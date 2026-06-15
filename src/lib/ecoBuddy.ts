// EcoPulse — EcoBuddy Decision Engine
// PRD Section 9 — pure, testable function implementing the full decision tree

import type { DailyLog, UserProfile, CalculatedFootprint, Recommendation, RecommendationCategory } from '../types';
import { getDominantCategory, aggregateWeeklyFootprints } from './calculator';
import factors from '../data/emissionFactors.json';

/** Compute weekly car km total from an array of daily logs */
function weeklyCarKm(history: DailyLog[]): number {
  return history.reduce((total, log) => {
    const carKm = log.transport
      .filter(t => t.mode === 'petrolCar' || t.mode === 'dieselCar')
      .reduce((sum, t) => sum + t.km, 0);
    return total + carKm;
  }, 0);
}

/** Detect 7-day trend from last 7 footprints */
function detectTrend(
  footprints: CalculatedFootprint[]
): 'improving' | 'flat' | 'worsening' {
  if (footprints.length < 2) return 'flat';
  const sorted = [...footprints].sort((a, b) => a.date.localeCompare(b.date));
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half);
  const secondHalf = sorted.slice(half);
  const firstAvg = firstHalf.reduce((s, f) => s + f.totalKgCO2e, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, f) => s + f.totalKgCO2e, 0) / secondHalf.length;
  const delta = secondAvg - firstAvg;
  if (delta < -0.2) return 'improving';
  if (delta > 0.2) return 'worsening';
  return 'flat';
}

/** Transport-dominant recommendation */
function transportRecommendation(
  currentLog: DailyLog,
  history: DailyLog[],
  profile: UserProfile,
  trend: 'improving' | 'flat' | 'worsening'
): Recommendation {
  const carKmWeek = weeklyCarKm([...history, currentLog]);
  const hasPublicTransport =
    profile.primaryCommute === 'publicTransport' ||
    currentLog.transport.some(t => t.mode === 'metro' || t.mode === 'bus');

  if (carKmWeek > 50) {
    // Replace 2 car trips with metro/bus
    const avgCarKmPerTrip = carKmWeek / Math.max(history.length + 1, 1);
    const tripsPerWeek = 2;
    const carFactor = factors.transport.petrolCar;
    const metroFactor = factors.transport.metro;
    const savedKgCO2e = Math.round(tripsPerWeek * avgCarKmPerTrip * (carFactor - metroFactor) * 100) / 100;

    const action = hasPublicTransport ? 'switch_metro_2x' : 'use_bus_2x';
    const transitName = hasPublicTransport ? 'metro' : 'bus';
    return {
      topCategory: 'transport',
      message: `Swapping 2 car commutes for ${transitName} this week could cut about ${savedKgCO2e} kg CO₂e — roughly equivalent to planting ${Math.ceil(savedKgCO2e / 0.6)} tree seedlings for a year.`,
      estimatedSavingsKgCO2e: savedKgCO2e,
      actionTag: action,
      trend,
    };
  } else if (carKmWeek > 0) {
    const savedKgCO2e = Math.round(carKmWeek * 0.5 * factors.transport.petrolCar * 100) / 100;
    return {
      topCategory: 'transport',
      message: `Your car use is moderate (${Math.round(carKmWeek)} km this week). Try combining errands into 1 trip or carpooling — could save ~${savedKgCO2e} kg CO₂e this week.`,
      estimatedSavingsKgCO2e: savedKgCO2e,
      actionTag: 'carpool_or_combine',
      trend,
    };
  } else {
    return {
      topCategory: 'transport',
      message: 'Great — no car use logged! Consider if any upcoming trips can be done by bicycle or on foot for an even greener week.',
      estimatedSavingsKgCO2e: 0,
      actionTag: 'maintain_active_transport',
      trend,
    };
  }
}

/** Household-size adjusted electricity median (kWh/day) */
function electricityMedian(householdSize: number): number {
  // India average: ~100 kWh/month for a family of 3
  const baseKwhPerDay = 3.5; // rough average 4-person household
  return (baseKwhPerDay * householdSize) / 4;
}

/** Energy-dominant recommendation */
function energyRecommendation(
  currentLog: DailyLog,
  profile: UserProfile,
  trend: 'improving' | 'flat' | 'worsening'
): Recommendation {
  const median = electricityMedian(profile.householdSize);
  const electricityFactor = profile.electricityFactorOverride ?? factors.electricity.indiaGridAverage;

  if (currentLog.electricityKwh > median * 1.2) {
    const excessKwh = currentLog.electricityKwh - median;
    const potentialSavings = Math.round(excessKwh * 0.3 * electricityFactor * 100) / 100;
    return {
      topCategory: 'energy',
      message: `Your electricity use (${currentLog.electricityKwh} kWh) is above typical for your household size. Switching to LEDs and raising AC by 1°C could save ~${potentialSavings} kg CO₂e today.`,
      estimatedSavingsKgCO2e: potentialSavings,
      actionTag: 'reduce_electricity_led_ac',
      trend,
    };
  } else if (currentLog.fuel.type === 'lpg' && currentLog.fuel.amount > 0) {
    const lpgCO2e = currentLog.fuel.amount * factors.fuel.lpgPerKg;
    return {
      topCategory: 'energy',
      message: `LPG contributes ${Math.round(lpgCO2e * 10) / 10} kg CO₂e today. Consider switching to an induction cooktop for daily cooking — solar-powered induction can be near-zero emission.`,
      estimatedSavingsKgCO2e: Math.round(lpgCO2e * 0.4 * 100) / 100,
      actionTag: 'switch_induction_cooking',
      trend,
    };
  } else {
    return {
      topCategory: 'energy',
      message: 'Your energy use looks reasonable! Unplug devices on standby — they account for up to 5% of household electricity.',
      estimatedSavingsKgCO2e: Math.round(currentLog.electricityKwh * 0.05 * electricityFactor * 100) / 100,
      actionTag: 'unplug_standby',
      trend,
    };
  }
}

/** Diet-dominant recommendation */
function dietRecommendation(
  currentLog: DailyLog,
  trend: 'improving' | 'flat' | 'worsening'
): Recommendation {
  const dietFactor = factors.diet as unknown as Record<string, number>;
  const dietEmission = dietFactor[currentLog.dietType] ?? 2.5;
  const vegEmission = factors.diet.vegetarian;

  if (currentLog.dietType === 'heavyMeat') {
    const savedKgCO2e = Math.round((dietEmission - vegEmission) * 2 * 100) / 100; // 2 plant-based days
    return {
      topCategory: 'diet',
      message: `Diet is your biggest driver today at ${dietEmission} kg CO₂e. Trying 2 plant-based days this week could cut ~${savedKgCO2e} kg CO₂e — that's the equivalent of a 24 km car trip.`,
      estimatedSavingsKgCO2e: savedKgCO2e,
      actionTag: 'plant_based_2_days',
      trend,
    };
  } else if (currentLog.dietType === 'average') {
    const savedKgCO2e = Math.round((dietEmission - vegEmission) * 100) / 100;
    return {
      topCategory: 'diet',
      message: `Replacing one meat meal with a plant-based option today could save ~${savedKgCO2e} kg CO₂e. Local, seasonal vegetables have an even lower footprint.`,
      estimatedSavingsKgCO2e: savedKgCO2e,
      actionTag: 'one_plantbased_meal',
      trend,
    };
  } else {
    // vegetarian or vegan — celebrate
    return {
      topCategory: 'diet',
      message: `Your ${currentLog.dietType} diet is one of the most powerful climate choices you can make — saving up to ${Math.round((3.3 - dietEmission) * 100) / 100} kg CO₂e vs. a meat-heavy diet daily. Consider local and seasonal produce for even greater impact.`,
      estimatedSavingsKgCO2e: 0,
      actionTag: 'maintain_plant_diet',
      trend,
    };
  }
}

/** Waste-dominant recommendation */
function wasteRecommendation(
  currentLog: DailyLog,
  trend: 'improving' | 'flat' | 'worsening'
): Recommendation {
  const landfillFactor = factors.waste.landfillPerKg;
  const compostFactor = factors.waste.compostedPerKg;

  if (!currentLog.composted && currentLog.wasteKg > 0) {
    const savedKgCO2e = Math.round(currentLog.wasteKg * (landfillFactor - compostFactor) * 100) / 100;
    return {
      topCategory: 'waste',
      message: `Starting to compost your organic waste (${currentLog.wasteKg} kg today) could save ~${savedKgCO2e} kg CO₂e. Even a small kitchen compost bin makes a measurable difference.`,
      estimatedSavingsKgCO2e: savedKgCO2e,
      actionTag: 'start_composting',
      trend,
    };
  } else if (currentLog.composted) {
    return {
      topCategory: 'waste',
      message: 'Excellent — you\'re composting! The next step is reducing total waste generation: buy in bulk, avoid single-use packaging, and repair instead of replace.',
      estimatedSavingsKgCO2e: 0,
      actionTag: 'reduce_total_waste',
      trend,
    };
  } else {
    return {
      topCategory: 'waste',
      message: 'No waste logged today — well done! Segregating recyclables at source dramatically reduces landfill emissions and supports local recyclers.',
      estimatedSavingsKgCO2e: 0,
      actionTag: 'segregate_recyclables',
      trend,
    };
  }
}

/**
 * EcoBuddy Decision Engine — Main Entry Point
 * PRD Section 9, Step 1–5 fully implemented
 *
 * @param currentLog - Today's daily log
 * @param history - Last 7 daily logs (for trend detection)
 * @param historicalFootprints - Calculated footprints for trend analysis
 * @param profile - User profile for personalization
 * @returns Recommendation object (PRD Section 9, Step 5 output contract)
 */
export function getRecommendation(
  currentLog: DailyLog,
  history: DailyLog[],
  historicalFootprints: CalculatedFootprint[],
  profile: UserProfile,
  currentFootprint: { byCategory: { transport: number; energy: number; diet: number; waste: number }; totalKgCO2e: number }
): Recommendation {
  // Step 1+2: Identify dominant category
  const dominant = getDominantCategory(currentFootprint.byCategory);

  // Step 4: Detect trend
  const trend = detectTrend(historicalFootprints);

  // Step 3: Apply decision tree per category
  let recommendation: Recommendation;
  switch (dominant) {
    case 'transport':
      recommendation = transportRecommendation(currentLog, history, profile, trend);
      break;
    case 'energy':
      recommendation = energyRecommendation(currentLog, profile, trend);
      break;
    case 'diet':
      recommendation = dietRecommendation(currentLog, trend);
      break;
    case 'waste':
      recommendation = wasteRecommendation(currentLog, trend);
      break;
    default:
      recommendation = {
        topCategory: 'balanced' as RecommendationCategory,
        message: 'Your footprint looks well-balanced today! Keep logging to uncover trends and maintain your progress.',
        estimatedSavingsKgCO2e: 0,
        actionTag: 'keep_logging',
        trend,
      };
  }

  // Step 4: Trend-aware nudge overlay
  if (trend === 'improving') {
    recommendation.message = `📈 You\'re on a great streak — emissions trending down! ${recommendation.message}`;
  } else if (trend === 'worsening') {
    recommendation.message = `🔔 Your footprint has been rising the last few days. ${recommendation.message}`;
  }

  return recommendation;
}

/**
 * Aggregates weekly history to generate summary statistics for AI insight.
 */
export function buildWeeklySummary(
  footprints: CalculatedFootprint[]
): {
  weekTotal: number;
  avgPerDay: number;
  dominantCategory: string;
  byCategory: { transport: number; energy: number; diet: number; waste: number };
  trend: 'improving' | 'flat' | 'worsening';
} {
  if (footprints.length === 0) {
    return {
      weekTotal: 0,
      avgPerDay: 0,
      dominantCategory: 'balanced',
      byCategory: { transport: 0, energy: 0, diet: 0, waste: 0 },
      trend: 'flat',
    };
  }

  const agg = aggregateWeeklyFootprints(footprints);
  const dominant = getDominantCategory(agg.byCategory);
  const trend = detectTrend(footprints);

  return {
    weekTotal: agg.total,
    avgPerDay: Math.round((agg.total / footprints.length) * 100) / 100,
    dominantCategory: dominant,
    byCategory: agg.byCategory,
    trend,
  };
}
