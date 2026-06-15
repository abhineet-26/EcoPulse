// EcoPulse — Core TypeScript Types
// Matches PRD Section 11 data model

export interface UserProfile {
  region: string;           // default "IN"
  householdSize: number;    // 1–10
  primaryCommute: 'car' | 'bike' | 'publicTransport' | 'walkCycle';
  dietType: 'heavyMeat' | 'average' | 'vegetarian' | 'vegan';
  electricityFactorOverride?: number;   // kg CO2e/kWh; if set, overrides India default
  weeklyGoalPercent?: number;           // % reduction target
  name?: string;
  createdAt: string;
}

export type TransportMode =
  | 'petrolCar'
  | 'dieselCar'
  | 'motorbike'
  | 'bus'
  | 'metro'
  | 'autoRickshaw'
  | 'bicycle'
  | 'walking'
  | 'domesticFlight';

export type FuelType = 'lpg' | 'png' | 'none';

export type DietType = UserProfile['dietType'];

export interface TransportEntry {
  mode: TransportMode;
  km: number;
}

export interface DailyLog {
  date: string;                         // ISO yyyy-mm-dd
  transport: TransportEntry[];
  electricityKwh: number;
  fuel: { type: FuelType; amount: number };   // LPG in kg, PNG in m³
  dietType: DietType;
  wasteKg: number;
  composted: boolean;
  waterLiters: number;
  notes?: string;
}

export interface CategoryBreakdown {
  transport: number;
  energy: number;
  diet: number;
  waste: number;
}

export interface CalculatedFootprint {
  date: string;
  byCategory: CategoryBreakdown;
  totalKgCO2e: number;
}

export type RecommendationCategory = 'transport' | 'energy' | 'diet' | 'waste' | 'balanced';

export interface Recommendation {
  topCategory: RecommendationCategory;
  message: string;
  estimatedSavingsKgCO2e: number;
  actionTag: string;
  icon?: string;
  trend?: 'improving' | 'flat' | 'worsening';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  condition: 'streak_3' | 'streak_7' | 'meatfree_day' | 'low_carbon_day' | 'zero_waste_day' | 'first_log' | 'week_goal_met';
}

export interface WeeklyStats {
  weekKey: string;           // ISO yyyy-Www format
  totalKgCO2e: number;
  byCategory: CategoryBreakdown;
  daysLogged: number;
  avgPerDay: number;
  trend: 'improving' | 'flat' | 'worsening';
  aiInsight?: string;        // Gemini-generated or templated
  aiInsightGeneratedAt?: string;
}

export interface AppState {
  profile: UserProfile | null;
  dailyLogs: Record<string, DailyLog>;          // keyed by yyyy-mm-dd
  footprints: Record<string, CalculatedFootprint>;
  badges: Badge[];
  currentStreak: number;
  weeklyStats: Record<string, WeeklyStats>;
  theme: 'dark' | 'light';
}

export interface EmissionFactors {
  transport: Record<string, number>;
  electricity: { indiaGridAverage: number; comment: string };
  fuel: { lpgPerKg: number; lpgCylinder14_2kg: number; pngPerCubicMeter: number };
  diet: {
    heavyMeat: number;
    average: number;
    vegetarian: number;
    vegan: number;
    comment?: string;
    [key: string]: number | string | undefined;
  };
  waste: { landfillPerKg: number; compostedPerKg: number; comment: string };
  water: { perLiter: number; comment: string };
  benchmarks: {
    indiaAveragePerDay: number;
    globalAveragePerDay: number;
    sustainableTargetPerDay: number;
    sources: string;
  };
}
