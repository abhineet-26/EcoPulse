// EcoPulse — Typed localStorage Wrapper
// Centralizes all persistence logic; keeps components clean

import type { UserProfile, DailyLog, CalculatedFootprint, Badge, WeeklyStats } from '../types';

const KEYS = {
  PROFILE: 'ecopulse_profile',
  DAILY_LOGS: 'ecopulse_daily_logs',
  FOOTPRINTS: 'ecopulse_footprints',
  BADGES: 'ecopulse_badges',
  STREAK: 'ecopulse_streak',
  WEEKLY_STATS: 'ecopulse_weekly_stats',
  THEME: 'ecopulse_theme',
  LAST_LOG_DATE: 'ecopulse_last_log_date',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[EcoPulse Storage] Failed to write to localStorage:', err);
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// Profile
export const storage = {
  getProfile: (): UserProfile | null => safeGet<UserProfile | null>(KEYS.PROFILE, null),
  saveProfile: (profile: UserProfile): void => safeSet(KEYS.PROFILE, profile),
  clearProfile: (): void => safeRemove(KEYS.PROFILE),

  // Daily Logs
  getDailyLogs: (): Record<string, DailyLog> => safeGet<Record<string, DailyLog>>(KEYS.DAILY_LOGS, {}),
  saveDailyLog: (log: DailyLog): void => {
    const logs = safeGet<Record<string, DailyLog>>(KEYS.DAILY_LOGS, {});
    logs[log.date] = log;
    safeSet(KEYS.DAILY_LOGS, logs);
  },
  getDailyLog: (date: string): DailyLog | null => {
    const logs = safeGet<Record<string, DailyLog>>(KEYS.DAILY_LOGS, {});
    return logs[date] ?? null;
  },

  // Calculated Footprints
  getFootprints: (): Record<string, CalculatedFootprint> =>
    safeGet<Record<string, CalculatedFootprint>>(KEYS.FOOTPRINTS, {}),
  saveFootprint: (fp: CalculatedFootprint): void => {
    const fps = safeGet<Record<string, CalculatedFootprint>>(KEYS.FOOTPRINTS, {});
    fps[fp.date] = fp;
    safeSet(KEYS.FOOTPRINTS, fps);
  },

  // Badges
  getBadges: (): Badge[] => safeGet<Badge[]>(KEYS.BADGES, []),
  saveBadges: (badges: Badge[]): void => safeSet(KEYS.BADGES, badges),
  awardBadge: (badge: Badge): void => {
    const existing = safeGet<Badge[]>(KEYS.BADGES, []);
    if (!existing.find(b => b.id === badge.id)) {
      existing.push({ ...badge, earnedAt: new Date().toISOString() });
      safeSet(KEYS.BADGES, existing);
    }
  },

  // Streak
  getStreak: (): number => safeGet<number>(KEYS.STREAK, 0),
  saveStreak: (streak: number): void => safeSet(KEYS.STREAK, streak),
  getLastLogDate: (): string | null => safeGet<string | null>(KEYS.LAST_LOG_DATE, null),
  saveLastLogDate: (date: string): void => safeSet(KEYS.LAST_LOG_DATE, date),

  // Weekly Stats
  getWeeklyStats: (): Record<string, WeeklyStats> => safeGet<Record<string, WeeklyStats>>(KEYS.WEEKLY_STATS, {}),
  saveWeeklyStats: (stats: WeeklyStats): void => {
    const all = safeGet<Record<string, WeeklyStats>>(KEYS.WEEKLY_STATS, {});
    all[stats.weekKey] = stats;
    safeSet(KEYS.WEEKLY_STATS, all);
  },
  getWeekStat: (weekKey: string): WeeklyStats | null => {
    const all = safeGet<Record<string, WeeklyStats>>(KEYS.WEEKLY_STATS, {});
    return all[weekKey] ?? null;
  },

  // Theme
  getTheme: (): 'dark' | 'light' => safeGet<'dark' | 'light'>(KEYS.THEME, 'dark'),
  saveTheme: (theme: 'dark' | 'light'): void => safeSet(KEYS.THEME, theme),

  // Clear everything (for dev/reset)
  clearAll: (): void => {
    Object.values(KEYS).forEach(key => safeRemove(key));
  },
};
