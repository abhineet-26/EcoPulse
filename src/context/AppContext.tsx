// EcoPulse — App Context
// Global state management via React Context + localStorage persistence

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { UserProfile, DailyLog, CalculatedFootprint, Badge, WeeklyStats } from '../types';
import { storage } from '../lib/storage';
import { calculateFootprint, getWeekKey } from '../lib/calculator';
import { buildWeeklySummary } from '../lib/ecoBuddy';
import factorsData from '../data/emissionFactors.json';
import type { EmissionFactors } from '../types';

const factors = factorsData as unknown as EmissionFactors;

interface AppState {
  profile: UserProfile | null;
  dailyLogs: Record<string, DailyLog>;
  footprints: Record<string, CalculatedFootprint>;
  badges: Badge[];
  currentStreak: number;
  weeklyStats: Record<string, WeeklyStats>;
  theme: 'dark' | 'light';
  isOnboarded: boolean;
}

type AppAction =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SAVE_LOG'; payload: DailyLog }
  | { type: 'AWARD_BADGE'; payload: Badge }
  | { type: 'SET_STREAK'; payload: number }
  | { type: 'UPDATE_WEEKLY_STATS'; payload: WeeklyStats }
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload, isOnboarded: true };
    case 'SAVE_LOG': {
      const log = action.payload;
      const newLogs = { ...state.dailyLogs, [log.date]: log };
      // Recalculate footprint
      const fp = state.profile
        ? calculateFootprint(log, state.profile, factors)
        : null;
      const newFootprints = fp
        ? { ...state.footprints, [log.date]: fp }
        : state.footprints;
      return { ...state, dailyLogs: newLogs, footprints: newFootprints };
    }
    case 'AWARD_BADGE': {
      const exists = state.badges.find(b => b.id === action.payload.id);
      if (exists) return state;
      return { ...state, badges: [...state.badges, { ...action.payload, earnedAt: new Date().toISOString() }] };
    }
    case 'SET_STREAK':
      return { ...state, currentStreak: action.payload };
    case 'UPDATE_WEEKLY_STATS':
      return { ...state, weeklyStats: { ...state.weeklyStats, [action.payload.weekKey]: action.payload } };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const initialState: AppState = {
  profile: null,
  dailyLogs: {},
  footprints: {},
  badges: [],
  currentStreak: 0,
  weeklyStats: {},
  theme: 'dark',
  isOnboarded: false,
};

interface AppContextValue extends AppState {
  saveProfile: (profile: UserProfile) => void;
  saveLog: (log: DailyLog) => void;
  toggleTheme: () => void;
  getTodayLog: () => DailyLog | null;
  getTodayFootprint: () => CalculatedFootprint | null;
  getWeekFootprints: () => CalculatedFootprint[];
  getWeekLogs: () => DailyLog[];
  getCurrentWeekStats: () => WeeklyStats | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const profile = storage.getProfile();
    const dailyLogs = storage.getDailyLogs();
    const footprints = storage.getFootprints();
    const badges = storage.getBadges();
    const currentStreak = storage.getStreak();
    const weeklyStats = storage.getWeeklyStats();
    const theme = storage.getTheme();

    dispatch({
      type: 'LOAD_STATE',
      payload: {
        profile,
        dailyLogs,
        footprints,
        badges,
        currentStreak,
        weeklyStats,
        theme,
        isOnboarded: profile !== null,
      },
    });
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const saveProfile = useCallback((profile: UserProfile) => {
    storage.saveProfile(profile);
    dispatch({ type: 'SET_PROFILE', payload: profile });
  }, []);

  const saveLog = useCallback((log: DailyLog) => {
    storage.saveDailyLog(log);
    dispatch({ type: 'SAVE_LOG', payload: log });

    // Update footprint in storage
    if (state.profile) {
      const fp = calculateFootprint(log, state.profile, factors);
      storage.saveFootprint(fp);
    }

    // Update streak
    const today = new Date().toISOString().slice(0, 10);
    const lastLogDate = storage.getLastLogDate();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak = 1;
    if (lastLogDate === yesterday) {
      newStreak = storage.getStreak() + 1;
    } else if (lastLogDate === today) {
      newStreak = storage.getStreak();
    }
    storage.saveStreak(newStreak);
    storage.saveLastLogDate(today);
    dispatch({ type: 'SET_STREAK', payload: newStreak });

    // Award first log badge
    const firstLogBadge: Badge = {
      id: 'first_log',
      name: 'First Step',
      description: 'Logged your first carbon footprint entry!',
      icon: '🌱',
      condition: 'first_log',
    };
    storage.awardBadge(firstLogBadge);
    dispatch({ type: 'AWARD_BADGE', payload: firstLogBadge });

    // Check streak badges
    if (newStreak >= 3) {
      const badge3: Badge = {
        id: 'streak_3',
        name: '3-Day Streak',
        description: 'Logged your footprint 3 days in a row!',
        icon: '🔥',
        condition: 'streak_3',
      };
      storage.awardBadge(badge3);
      dispatch({ type: 'AWARD_BADGE', payload: badge3 });
    }
    if (newStreak >= 7) {
      const badge7: Badge = {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'A full week of consistent logging!',
        icon: '⚡',
        condition: 'streak_7',
      };
      storage.awardBadge(badge7);
      dispatch({ type: 'AWARD_BADGE', payload: badge7 });
    }

    // Meat-free day badge
    if (log.dietType === 'vegetarian' || log.dietType === 'vegan') {
      const meatFree: Badge = {
        id: 'meatfree_day',
        name: 'Plant Power',
        description: 'Chose a plant-based diet today!',
        icon: '🥗',
        condition: 'meatfree_day',
      };
      storage.awardBadge(meatFree);
      dispatch({ type: 'AWARD_BADGE', payload: meatFree });
    }

    // Zero waste day
    if (log.wasteKg === 0) {
      const zeroBadge: Badge = {
        id: 'zero_waste_day',
        name: 'Zero Waste Hero',
        description: 'No waste logged today!',
        icon: '♻️',
        condition: 'zero_waste_day',
      };
      storage.awardBadge(zeroBadge);
      dispatch({ type: 'AWARD_BADGE', payload: zeroBadge });
    }

    // Update weekly stats
    const weekKey = getWeekKey(log.date);
    const allFootprints = { ...state.footprints };
    if (state.profile) {
      allFootprints[log.date] = calculateFootprint(log, state.profile, factors);
    }
    const weekFps = Object.entries(allFootprints)
      .filter(([d]) => getWeekKey(d) === weekKey)
      .map(([, fp]) => fp);
    const summary = buildWeeklySummary(weekFps);
    const weekStats: WeeklyStats = {
      weekKey,
      totalKgCO2e: summary.weekTotal,
      byCategory: summary.byCategory,
      daysLogged: weekFps.length,
      avgPerDay: summary.avgPerDay,
      trend: summary.trend,
    };
    storage.saveWeeklyStats(weekStats);
    dispatch({ type: 'UPDATE_WEEKLY_STATS', payload: weekStats });
  }, [state.profile, state.footprints]);

  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    storage.saveTheme(newTheme);
    dispatch({ type: 'SET_THEME', payload: newTheme });
  }, [state.theme]);

  const getTodayLog = useCallback((): DailyLog | null => {
    const today = new Date().toISOString().slice(0, 10);
    return state.dailyLogs[today] ?? null;
  }, [state.dailyLogs]);

  const getTodayFootprint = useCallback((): CalculatedFootprint | null => {
    const today = new Date().toISOString().slice(0, 10);
    return state.footprints[today] ?? null;
  }, [state.footprints]);

  const getWeekFootprints = useCallback((): CalculatedFootprint[] => {
    const today = new Date().toISOString().slice(0, 10);
    const weekKey = getWeekKey(today);
    return Object.entries(state.footprints)
      .filter(([d]) => getWeekKey(d) === weekKey)
      .map(([, fp]) => fp)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.footprints]);

  const getWeekLogs = useCallback((): DailyLog[] => {
    const today = new Date().toISOString().slice(0, 10);
    const weekKey = getWeekKey(today);
    return Object.entries(state.dailyLogs)
      .filter(([d]) => getWeekKey(d) === weekKey)
      .map(([, log]) => log)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.dailyLogs]);

  const getCurrentWeekStats = useCallback((): WeeklyStats | null => {
    const today = new Date().toISOString().slice(0, 10);
    const weekKey = getWeekKey(today);
    return state.weeklyStats[weekKey] ?? null;
  }, [state.weeklyStats]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        saveProfile,
        saveLog,
        toggleTheme,
        getTodayLog,
        getTodayFootprint,
        getWeekFootprints,
        getWeekLogs,
        getCurrentWeekStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
